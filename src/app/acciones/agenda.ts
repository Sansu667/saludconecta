"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type EstadoFormulario, erroresPorCampo, esquemaPaciente, texto, valoresVisibles } from "@/lib/formularios";
import {
    agendarCita, calcularTurnosLibres, cancelarCita, obtenerCita, pacientePuedeCambiar, registrarAtencion, reprogramarCita,
    HORAS_MINIMAS_CAMBIO_PACIENTE, type CitaDetalle,
} from "@/lib/modelos/citas";
import {
    MAXIMO_INTENTOS_LOGIN, buscarUsuarioConHash, contarIntentosFallidos, crearPaciente, existeEmail,
    registrarIntentoLogin, verificarContrasena, type Usuario,
} from "@/lib/modelos/usuarios";
import { buscarMedicoPorId } from "@/lib/modelos/medicos";
import { auditar, notificar } from "@/lib/modelos/notificaciones";
import { iniciarSesion, obtenerUsuarioActual, requerirUsuario } from "@/lib/sesion";
import { puedeRegistrarAtencion, puedeVerCita, rutaCita } from "@/lib/permisos";
import { esFechaValida, formatearFechaLarga, formatearHora, hoyBogota, sumarDias } from "@/lib/tiempo";

const DIAS_VISIBLES = 28;

export interface DiaConTurnos {
    fecha: string;
    horas: string[];
}

/**
 * Turnos libres de un médico para las próximas semanas.
 * Si se indica una cita a reprogramar, su propio turno cuenta como libre,
 * siempre que quien pregunta pueda gestionar esa cita.
 */
export async function obtenerTurnos(medicoId: number, excluirCitaId: number | null = null): Promise<DiaConTurnos[]> {
    if (!Number.isInteger(medicoId) || medicoId <= 0) return [];
    let excluir: number | null = null;
    if (excluirCitaId) {
        const usuario = await obtenerUsuarioActual();
        const cita = await obtenerCita(excluirCitaId);
        if (usuario && cita && puedeVerCita(usuario, cita) && cita.medico_id === medicoId) excluir = cita.id;
    }
    const hoy = hoyBogota();
    const mapa = await calcularTurnosLibres(medicoId, hoy, sumarDias(hoy, DIAS_VISIBLES - 1), excluir);
    return Array.from(mapa.entries()).map(([fecha, horas]) => ({ fecha, horas }));
}

function avisarCitaNueva(cita: CitaDetalle): Promise<void[]> {
    const cuando = `${formatearFechaLarga(cita.inicio)} a las ${formatearHora(cita.inicio)}`;
    return Promise.all([
        notificar(
            cita.paciente_id,
            "Cita confirmada",
            `Tu cita con ${cita.medico_nombres} ${cita.medico_apellidos} quedó para el ${cuando} en ${cita.consultorio_nombre}.`,
            `/panel/paciente/cita/${cita.id}`,
        ),
        notificar(
            cita.medico_usuario_id,
            "Nueva cita en tu agenda",
            `${cita.paciente_nombres} ${cita.paciente_apellidos} reservó el ${cuando}.`,
            `/panel/medico/cita/${cita.id}`,
        ),
    ]);
}

const esquemaReserva = z.object({
    medicoId: z.coerce.number().int().positive("Elige un profesional."),
    fecha: z.string().refine(esFechaValida, "Elige un día."),
    hora: z.string().regex(/^\d{2}:\d{2}$/, "Elige una hora."),
    motivo: z.string().trim().max(500, "Resume el motivo en menos de 500 caracteres."),
});

/**
 * Controlador de la reserva desde la página pública del consultorio.
 * Resuelve la identidad del paciente (sesión, ingreso o registro) y agenda.
 */
export async function reservarCita(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const valores = valoresVisibles(datos);
    const reserva = esquemaReserva.safeParse({
        medicoId: texto(datos, "medicoId"),
        fecha: texto(datos, "fecha"),
        hora: texto(datos, "hora"),
        motivo: texto(datos, "motivo"),
    });
    if (!reserva.success) {
        return { error: "Falta elegir el turno.", campos: erroresPorCampo(reserva.error), valores };
    }

    let paciente: Pick<Usuario, "id" | "rol"> | null = await obtenerUsuarioActual();
    if (paciente && paciente.rol !== "paciente") {
        return { error: "Estás con una cuenta del consultorio. Para reservar como paciente, cierra sesión o agenda desde el panel de recepción.", valores };
    }

    if (!paciente) {
        const modo = texto(datos, "modo");
        if (modo === "existente") {
            const email = texto(datos, "emailIngreso").toLowerCase();
            const contrasena = String(datos.get("contrasenaIngreso") ?? "");
            if ((await contarIntentosFallidos(email)) >= MAXIMO_INTENTOS_LOGIN) {
                return { error: "Demasiados intentos fallidos con este correo. Espera unos minutos.", valores };
            }
            const usuario = email ? await buscarUsuarioConHash(email) : null;
            const valido = usuario ? await verificarContrasena(contrasena, usuario.contrasena_hash) : false;
            await registrarIntentoLogin(email || "-", valido);
            if (!usuario || !valido) {
                return { error: "El correo o la contraseña no coinciden.", campos: { emailIngreso: "Revisa el correo y la contraseña." }, valores };
            }
            if (usuario.rol !== "paciente") {
                return { error: "Esa es una cuenta del consultorio. Usa una cuenta de paciente para reservar.", valores };
            }
            await iniciarSesion(usuario);
            paciente = usuario;
        } else {
            const registro = esquemaPaciente.safeParse({
                nombres: texto(datos, "nombres"),
                apellidos: texto(datos, "apellidos"),
                tipoDoc: texto(datos, "tipoDoc"),
                numDoc: texto(datos, "numDoc"),
                email: texto(datos, "email"),
                telefono: texto(datos, "telefono"),
                contrasena: String(datos.get("contrasena") ?? ""),
                aceptaDatos: texto(datos, "aceptaDatos"),
            });
            if (!registro.success) {
                return { error: "Revisa tus datos.", campos: erroresPorCampo(registro.error), valores };
            }
            if (await existeEmail(registro.data.email)) {
                return {
                    error: "Ya tienes una cuenta con ese correo. Elige «Ya tengo cuenta» para ingresar.",
                    campos: { email: "Este correo ya está registrado." },
                    valores,
                };
            }
            const id = await crearPaciente({ ...registro.data, fechaNac: texto(datos, "fechaNac") || null });
            await auditar(id, "registro_paciente", "usuario", id);
            await iniciarSesion({ id, rol: "paciente", consultorio_id: null });
            paciente = { id, rol: "paciente" };
        }
    }

    const resultado = await agendarCita({ ...reserva.data, pacienteId: paciente.id });
    if (!resultado.ok) return { error: resultado.error, valores: { ...valores, sesion: "si" } };

    const cita = await obtenerCita(resultado.valor);
    if (cita) await avisarCitaNueva(cita);
    await auditar(paciente.id, "agendar_cita", "cita", resultado.valor, "paciente");
    redirect(`/panel/paciente/cita/${resultado.valor}?nueva=1`);
}

/** El paciente agenda desde su panel (ya tiene sesión). */
export async function reservarCitaPaciente(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const usuario = await requerirUsuario("paciente");
    const reserva = esquemaReserva.safeParse({
        medicoId: texto(datos, "medicoId"),
        fecha: texto(datos, "fecha"),
        hora: texto(datos, "hora"),
        motivo: texto(datos, "motivo"),
    });
    if (!reserva.success) return { error: "Falta elegir el turno.", campos: erroresPorCampo(reserva.error) };
    const resultado = await agendarCita({ ...reserva.data, pacienteId: usuario.id });
    if (!resultado.ok) return { error: resultado.error };
    const cita = await obtenerCita(resultado.valor);
    if (cita) await avisarCitaNueva(cita);
    await auditar(usuario.id, "agendar_cita", "cita", resultado.valor, "paciente");
    redirect(`/panel/paciente/cita/${resultado.valor}?nueva=1`);
}

async function cargarCitaAutorizada(citaId: number): Promise<{ usuario: Usuario; cita: CitaDetalle } | null> {
    const usuario = await requerirUsuario();
    const cita = await obtenerCita(citaId);
    if (!cita || !puedeVerCita(usuario, cita)) return null;
    return { usuario, cita };
}

/** Cancela una cita respetando el plazo del paciente. */
export async function cancelarCitaAccion(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const citaId = Number(texto(datos, "citaId"));
    const contexto = await cargarCitaAutorizada(citaId);
    if (!contexto) return { error: "No encontramos esa cita." };
    const { usuario, cita } = contexto;
    if (usuario.rol === "paciente" && !pacientePuedeCambiar(cita)) {
        return { error: `Faltan menos de ${HORAS_MINIMAS_CAMBIO_PACIENTE} horas. Para cancelar, llama al consultorio al ${cita.consultorio_telefono ?? "número del consultorio"}.` };
    }
    const resultado = await cancelarCita(cita.id, usuario.rol);
    if (!resultado.ok) return { error: resultado.error };

    const cuando = `${formatearFechaLarga(cita.inicio)} a las ${formatearHora(cita.inicio)}`;
    const motivo = texto(datos, "motivoCancelacion");
    if (usuario.rol === "paciente") {
        await notificar(cita.medico_usuario_id, "Cita cancelada por el paciente",
            `${cita.paciente_nombres} ${cita.paciente_apellidos} canceló su cita del ${cuando}. El turno quedó libre.`,
            `/panel/medico/cita/${cita.id}`);
    } else {
        await notificar(cita.paciente_id, "Tu cita fue cancelada",
            `${cita.consultorio_nombre} canceló tu cita del ${cuando}.${motivo ? ` Motivo: ${motivo}.` : ""} Puedes reservar otro horario cuando quieras.`,
            `/panel/paciente/cita/${cita.id}`);
        if (usuario.rol === "admin") {
            await notificar(cita.medico_usuario_id, "Cita cancelada por recepción",
                `Se canceló la cita de ${cita.paciente_nombres} ${cita.paciente_apellidos} del ${cuando}.`, `/panel/medico/cita/${cita.id}`);
        }
    }
    await auditar(usuario.id, "cancelar_cita", "cita", cita.id, motivo || null);
    revalidatePath("/panel", "layout");
    return { exito: "La cita quedó cancelada y el turno está libre otra vez." };
}

/** Reprograma una cita a otro turno del mismo profesional. */
export async function reprogramarCitaAccion(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const citaId = Number(texto(datos, "citaId"));
    const fecha = texto(datos, "fecha");
    const hora = texto(datos, "hora");
    if (!esFechaValida(fecha) || !/^\d{2}:\d{2}$/.test(hora)) return { error: "Elige el nuevo día y la nueva hora." };
    const contexto = await cargarCitaAutorizada(citaId);
    if (!contexto) return { error: "No encontramos esa cita." };
    const { usuario, cita } = contexto;
    if (usuario.rol === "paciente" && !pacientePuedeCambiar(cita)) {
        return { error: `Faltan menos de ${HORAS_MINIMAS_CAMBIO_PACIENTE} horas. Para moverla, llama al consultorio.` };
    }
    const resultado = await reprogramarCita(cita.id, fecha, hora);
    if (!resultado.ok) return { error: resultado.error };

    const antes = `${formatearFechaLarga(cita.inicio)} ${formatearHora(cita.inicio)}`;
    const ahora = `${formatearFechaLarga(fecha)} a las ${formatearHora(hora)}`;
    if (usuario.rol === "paciente") {
        await notificar(cita.medico_usuario_id, "Cita reprogramada",
            `${cita.paciente_nombres} ${cita.paciente_apellidos} movió su cita del ${antes} al ${ahora}.`, `/panel/medico/cita/${cita.id}`);
    } else {
        await notificar(cita.paciente_id, "Tu cita cambió de horario",
            `Tu cita en ${cita.consultorio_nombre} pasó del ${antes} al ${ahora}.`, `/panel/paciente/cita/${cita.id}`);
        if (usuario.rol === "admin") {
            await notificar(cita.medico_usuario_id, "Cita reprogramada por recepción",
                `La cita de ${cita.paciente_nombres} ${cita.paciente_apellidos} pasó al ${ahora}.`, `/panel/medico/cita/${cita.id}`);
        }
    }
    await auditar(usuario.id, "reprogramar_cita", "cita", cita.id, `${fecha} ${hora}`);
    revalidatePath("/panel", "layout");
    redirect(`${rutaCita(usuario.rol, cita.id)}?movida=1`);
}

const esquemaAtencion = z.object({
    estado: z.enum(["completada", "no_asistio"]),
    diagnostico: z.string().trim().max(1000),
    tratamiento: z.string().trim().max(2000),
    notas: z.string().trim().max(3000),
});

/** El médico registra el resultado de la consulta. */
export async function registrarAtencionAccion(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const citaId = Number(texto(datos, "citaId"));
    const contexto = await cargarCitaAutorizada(citaId);
    if (!contexto || !puedeRegistrarAtencion(contexto.usuario, contexto.cita)) return { error: "Solo el profesional de la cita puede registrar la atención." };
    const { usuario, cita } = contexto;
    if (cita.estado === "cancelada") return { error: "Esta cita fue cancelada." };
    if (cita.inicio.getTime() > Date.now() + 15 * 60000) return { error: "Podrás registrar la atención cuando llegue la hora de la cita." };
    const resultado = esquemaAtencion.safeParse({
        estado: texto(datos, "estado"),
        diagnostico: texto(datos, "diagnostico"),
        tratamiento: texto(datos, "tratamiento"),
        notas: texto(datos, "notas"),
    });
    if (!resultado.success) return { error: "Revisa los campos.", campos: erroresPorCampo(resultado.error), valores: valoresVisibles(datos) };
    if (resultado.data.estado === "completada" && !resultado.data.diagnostico) {
        return { error: "Escribe al menos el diagnóstico o la impresión diagnóstica.", campos: { diagnostico: "Campo obligatorio para cerrar la consulta." }, valores: valoresVisibles(datos) };
    }
    await registrarAtencion(cita.id, resultado.data);
    if (resultado.data.estado === "completada" && cita.estado !== "completada") {
        await notificar(cita.paciente_id, "Indicaciones de tu consulta",
            `${cita.medico_nombres} ${cita.medico_apellidos} registró el diagnóstico y las indicaciones de tu cita del ${formatearFechaLarga(cita.inicio)}.`,
            `/panel/paciente/cita/${cita.id}`);
    }
    await auditar(usuario.id, "registrar_atencion", "cita", cita.id, resultado.data.estado);
    revalidatePath("/panel", "layout");
    return { exito: resultado.data.estado === "completada" ? "Consulta guardada." : "Quedó registrada la inasistencia." };
}
