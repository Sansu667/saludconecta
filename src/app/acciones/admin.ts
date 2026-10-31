"use server";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
    type EstadoFormulario, TIPOS_DOCUMENTO, erroresPorCampo, esquemaEmail, texto, valoresVisibles,
} from "@/lib/formularios";
import {
    actualizarConsultorio, asegurarEspecialidad, crearEspecialidad, eliminarEspecialidad,
} from "@/lib/modelos/consultorios";
import { actualizarPerfilMedico, buscarMedicoPorId, crearPerfilMedico } from "@/lib/modelos/medicos";
import {
    buscarUsuarioPorId, cambiarContrasena, crearUsuarioPersonal, existeEmail, pacienteDelConsultorio, type Usuario,
} from "@/lib/modelos/usuarios";
import { agendarCita, obtenerCita } from "@/lib/modelos/citas";
import { auditar, notificar } from "@/lib/modelos/notificaciones";
import { consultar, consultarUno } from "@/lib/db";
import { requerirUsuario } from "@/lib/sesion";
import { esFechaValida, formatearFechaLarga, formatearHora } from "@/lib/tiempo";
import bcrypt from "bcryptjs";

/** Contraseña temporal legible: sin letras que se confundan (l, 1, O, 0). */
function generarContrasenaTemporal(): string {
    const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let resultado = "";
    for (let i = 0; i < 10; i += 1) resultado += alfabeto[randomInt(alfabeto.length)];
    return resultado;
}

async function requerirAdmin(): Promise<Usuario & { consultorio_id: number }> {
    const usuario = await requerirUsuario("admin");
    if (!usuario.consultorio_id) redirect("/");
    return usuario as Usuario & { consultorio_id: number };
}

const esquemaProfesional = z.object({
    nombres: z.string().trim().min(2, "Escribe los nombres.").max(100),
    apellidos: z.string().trim().min(2, "Escribe los apellidos.").max(100),
    email: esquemaEmail,
    numRegistro: z.string().trim().max(50),
    duracion: z.coerce.number().int().min(10, "Mínimo 10 minutos.").max(180, "Máximo 180 minutos."),
});

/** Crea la cuenta de un profesional con una contraseña temporal. */
export async function crearProfesional(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const admin = await requerirAdmin();
    const valores = valoresVisibles(datos);
    const resultado = esquemaProfesional.safeParse({
        nombres: texto(datos, "nombres"),
        apellidos: texto(datos, "apellidos"),
        email: texto(datos, "email"),
        numRegistro: texto(datos, "numRegistro"),
        duracion: texto(datos, "duracion") || "30",
    });
    if (!resultado.success) return { error: "Revisa los campos marcados.", campos: erroresPorCampo(resultado.error), valores };
    const d = resultado.data;
    if (await existeEmail(d.email)) return { error: "Ya hay una cuenta con ese correo.", campos: { email: "Correo ya registrado." }, valores };

    const nuevaEspecialidad = texto(datos, "especialidadNueva");
    const especialidadElegida = Number(texto(datos, "especialidadId")) || null;
    let especialidadId: number | null = null;
    if (nuevaEspecialidad) {
        especialidadId = await asegurarEspecialidad(admin.consultorio_id, nuevaEspecialidad.slice(0, 100));
    } else if (especialidadElegida) {
        const valida = await consultarUno("SELECT 1 FROM especialidades WHERE id = $1 AND consultorio_id = $2", [especialidadElegida, admin.consultorio_id]);
        especialidadId = valida ? especialidadElegida : null;
    }

    const temporal = generarContrasenaTemporal();
    const usuarioId = await crearUsuarioPersonal({
        consultorioId: admin.consultorio_id, rol: "medico", nombres: d.nombres, apellidos: d.apellidos, email: d.email, contrasena: temporal,
    });
    const medicoId = await crearPerfilMedico({
        usuarioId, consultorioId: admin.consultorio_id, especialidadId, numRegistro: d.numRegistro, duracion: d.duracion,
    });
    await notificar(usuarioId, "Bienvenida a SaludConecta", "Configura tu horario para que los pacientes puedan reservar contigo.", "/panel/medico/horario");
    await auditar(admin.id, "crear_profesional", "medico", medicoId);
    revalidatePath("/panel", "layout");
    return {
        exito: `Cuenta creada. Comparte estos datos con ${d.nombres}: correo ${d.email}, contraseña temporal ${temporal}. Puede cambiarla en «Mi cuenta». Ahora configura su horario.`,
        valores: { medicoId: String(medicoId) },
    };
}

/** Actualiza el perfil profesional de un médico del consultorio. */
export async function actualizarProfesional(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const admin = await requerirAdmin();
    const medico = await buscarMedicoPorId(Number(texto(datos, "medicoId")));
    if (!medico || medico.consultorio_id !== admin.consultorio_id) return { error: "No encontramos a ese profesional." };
    const duracion = Number(texto(datos, "duracion"));
    if (!Number.isInteger(duracion) || duracion < 10 || duracion > 180) return { error: "La duración debe estar entre 10 y 180 minutos.", campos: { duracion: "Entre 10 y 180." } };
    const especialidadId = Number(texto(datos, "especialidadId")) || null;
    if (especialidadId) {
        const valida = await consultarUno("SELECT 1 FROM especialidades WHERE id = $1 AND consultorio_id = $2", [especialidadId, admin.consultorio_id]);
        if (!valida) return { error: "Especialidad no válida." };
    }
    await actualizarPerfilMedico(medico.id, {
        especialidadId,
        numRegistro: texto(datos, "numRegistro").slice(0, 50),
        duracion,
        biografia: texto(datos, "biografia").slice(0, 600),
        activo: texto(datos, "activo") === "si",
    });
    await auditar(admin.id, "actualizar_profesional", "medico", medico.id);
    revalidatePath("/panel", "layout");
    return { exito: "Perfil actualizado." };
}

/** Asigna una contraseña temporal a un médico o a un paciente atendido en el consultorio. */
export async function restablecerContrasena(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const admin = await requerirAdmin();
    const objetivo = await buscarUsuarioPorId(Number(texto(datos, "usuarioId")));
    if (!objetivo) return { error: "No encontramos esa cuenta." };
    if (objetivo.es_demo) return { error: "Las cuentas de la demo no se pueden modificar." };
    const permitido = objetivo.rol === "medico"
        ? objetivo.consultorio_id === admin.consultorio_id
        : objetivo.rol === "paciente" && (await pacienteDelConsultorio(objetivo.id, admin.consultorio_id));
    if (!permitido) return { error: "Solo puedes restablecer cuentas de tu consultorio." };
    const temporal = generarContrasenaTemporal();
    await cambiarContrasena(objetivo.id, temporal);
    await auditar(admin.id, "restablecer_contrasena", "usuario", objetivo.id);
    return { exito: `Contraseña temporal para ${objetivo.nombres}: ${temporal}. Pídele que la cambie en «Mi cuenta».` };
}

const esquemaConsultorio = z.object({
    nombre: z.string().trim().min(3, "Escribe el nombre.").max(120),
    ciudad: z.string().trim().max(80),
    direccion: z.string().trim().max(150),
    telefono: z.string().trim().max(30),
    descripcion: z.string().trim().max(600, "Máximo 600 caracteres."),
});

export async function guardarConsultorio(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const admin = await requerirAdmin();
    const resultado = esquemaConsultorio.safeParse({
        nombre: texto(datos, "nombre"),
        ciudad: texto(datos, "ciudad"),
        direccion: texto(datos, "direccion"),
        telefono: texto(datos, "telefono"),
        descripcion: texto(datos, "descripcion"),
    });
    if (!resultado.success) return { error: "Revisa los campos.", campos: erroresPorCampo(resultado.error), valores: valoresVisibles(datos) };
    await actualizarConsultorio(admin.consultorio_id, resultado.data);
    await auditar(admin.id, "actualizar_consultorio", "consultorio", admin.consultorio_id);
    revalidatePath("/", "layout");
    return { exito: "Datos del consultorio guardados." };
}

export async function agregarEspecialidad(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const admin = await requerirAdmin();
    const nombre = texto(datos, "nombre");
    if (nombre.length < 3) return { error: "Escribe el nombre de la especialidad." };
    await crearEspecialidad(admin.consultorio_id, nombre.slice(0, 100));
    revalidatePath("/panel", "layout");
    return { exito: `Especialidad «${nombre}» agregada.` };
}

export async function quitarEspecialidad(datos: FormData): Promise<void> {
    const admin = await requerirAdmin();
    await eliminarEspecialidad(admin.consultorio_id, Number(texto(datos, "especialidadId")));
    revalidatePath("/panel", "layout");
}

const esquemaPacienteRapido = z.object({
    nombres: z.string().trim().min(2, "Escribe los nombres.").max(100),
    apellidos: z.string().trim().min(2, "Escribe los apellidos.").max(100),
    tipoDoc: z.enum(TIPOS_DOCUMENTO.map((t) => t.valor) as [string, ...string[]]),
    numDoc: z.string().trim().regex(/^[A-Za-z0-9-]{4,20}$/, "Número de documento sin puntos ni espacios."),
    telefono: z.string().trim().regex(/^[0-9 +()-]{7,20}$/, "Escribe un teléfono."),
    email: z.union([z.literal(""), esquemaEmail]),
    autoriza: z.literal("si", { message: "Confirma que el paciente autorizó el tratamiento de sus datos." }),
});

/** Recepción agenda a nombre de un paciente (existente o nuevo), por ejemplo, por teléfono. */
export async function agendarPorRecepcion(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const admin = await requerirAdmin();
    const valores = valoresVisibles(datos);
    const medicoId = Number(texto(datos, "medicoId"));
    const fecha = texto(datos, "fecha");
    const hora = texto(datos, "hora");
    if (!medicoId || !esFechaValida(fecha) || !/^\d{2}:\d{2}$/.test(hora)) {
        return { error: "Elige profesional, día y hora.", valores };
    }
    const medico = await buscarMedicoPorId(medicoId);
    if (!medico || medico.consultorio_id !== admin.consultorio_id) return { error: "Ese profesional no es de tu consultorio.", valores };

    let pacienteId = Number(texto(datos, "pacienteId")) || null;
    if (pacienteId) {
        const paciente = await buscarUsuarioPorId(pacienteId);
        if (!paciente || paciente.rol !== "paciente") return { error: "No encontramos al paciente.", valores };
    } else {
        const resultado = esquemaPacienteRapido.safeParse({
            nombres: texto(datos, "nombres"),
            apellidos: texto(datos, "apellidos"),
            tipoDoc: texto(datos, "tipoDoc"),
            numDoc: texto(datos, "numDoc"),
            telefono: texto(datos, "telefono"),
            email: texto(datos, "email").toLowerCase(),
            autoriza: texto(datos, "autoriza"),
        });
        if (!resultado.success) return { error: "Revisa los datos del paciente.", campos: erroresPorCampo(resultado.error), valores };
        const p = resultado.data;
        const existente = await consultarUno<{ id: number }>(
            "SELECT id FROM usuarios WHERE rol = 'paciente' AND tipo_doc = $1 AND num_doc = $2",
            [p.tipoDoc, p.numDoc],
        );
        if (existente) {
            pacienteId = existente.id;
        } else {
            const email = p.email || `${p.tipoDoc.toLowerCase()}${p.numDoc.toLowerCase()}.c${admin.consultorio_id}@sin-correo.saludconecta.co`;
            if (await existeEmail(email)) return { error: "Ya existe una cuenta con ese correo. Búscala por documento o correo.", campos: { email: "Correo ya registrado." }, valores };
            const hash = await bcrypt.hash(generarContrasenaTemporal(), 10);
            const [fila] = await consultar<{ id: number }>(
                `INSERT INTO usuarios (rol, nombres, apellidos, email, contrasena_hash, tipo_doc, num_doc, telefono, acepto_datos_en)
                 VALUES ('paciente', $1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
                [p.nombres, p.apellidos, email, hash, p.tipoDoc, p.numDoc, p.telefono],
            );
            pacienteId = fila.id;
            await auditar(admin.id, "registro_paciente_recepcion", "usuario", pacienteId);
        }
    }

    const resultado = await agendarCita({ medicoId, pacienteId: pacienteId!, fecha, hora, motivo: texto(datos, "motivo") });
    if (!resultado.ok) return { error: resultado.error, valores };
    const cita = await obtenerCita(resultado.valor);
    if (cita) {
        const cuando = `${formatearFechaLarga(cita.inicio)} a las ${formatearHora(cita.inicio)}`;
        await notificar(cita.paciente_id, "Cita confirmada", `${cita.consultorio_nombre} te agendó con ${cita.medico_nombres} ${cita.medico_apellidos} el ${cuando}.`, `/panel/paciente/cita/${cita.id}`);
        await notificar(cita.medico_usuario_id, "Nueva cita en tu agenda", `Recepción agendó a ${cita.paciente_nombres} ${cita.paciente_apellidos} el ${cuando}.`, `/panel/medico/cita/${cita.id}`);
    }
    await auditar(admin.id, "agendar_cita", "cita", resultado.valor, "recepcion");
    redirect(`/panel/admin/cita/${resultado.valor}?nueva=1`);
}
