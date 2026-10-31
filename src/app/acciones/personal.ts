"use server";

import { revalidatePath } from "next/cache";
import { type EstadoFormulario, texto } from "@/lib/formularios";
import {
    buscarMedicoPorId, buscarMedicoPorUsuario, crearBloqueo, eliminarBloqueo, reemplazarDisponibilidad, type Medico,
} from "@/lib/modelos/medicos";
import { auditar, notificar } from "@/lib/modelos/notificaciones";
import { consultar } from "@/lib/db";
import { requerirUsuario } from "@/lib/sesion";
import { construirInstante, esFechaValida, formatearFechaLarga, hoyBogota, minutosDeHora, sumarDias } from "@/lib/tiempo";

/** El médico gestiona su propio horario; la administración, el de cualquier médico de su consultorio. */
async function medicoAutorizado(medicoId: number): Promise<{ medico: Medico; usuarioId: number } | null> {
    const usuario = await requerirUsuario("medico", "admin");
    if (usuario.rol === "medico") {
        const propio = await buscarMedicoPorUsuario(usuario.id);
        return propio && propio.id === medicoId ? { medico: propio, usuarioId: usuario.id } : null;
    }
    const medico = await buscarMedicoPorId(medicoId);
    return medico && medico.consultorio_id === usuario.consultorio_id ? { medico, usuarioId: usuario.id } : null;
}

/** Guarda el horario semanal enviado como JSON [{dia, inicio, fin}]. */
export async function guardarHorario(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const contexto = await medicoAutorizado(Number(texto(datos, "medicoId")));
    if (!contexto) return { error: "No tienes permiso para cambiar este horario." };

    let bloques: Array<{ dia: number; inicio: string; fin: string }>;
    try {
        bloques = JSON.parse(texto(datos, "bloques"));
        if (!Array.isArray(bloques)) throw new Error();
    } catch {
        return { error: "No pudimos leer el horario. Recarga la página e inténtalo de nuevo." };
    }

    const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;
    const porDia = new Map<number, Array<[number, number]>>();
    for (const b of bloques) {
        if (!Number.isInteger(b.dia) || b.dia < 0 || b.dia > 6 || !formatoHora.test(b.inicio) || !formatoHora.test(b.fin)) {
            return { error: "Hay una hora con formato inválido." };
        }
        const ini = minutosDeHora(b.inicio);
        const fin = minutosDeHora(b.fin);
        if (fin <= ini) return { error: "Cada franja debe terminar después de empezar." };
        if (fin - ini < contexto.medico.duracion_cita_min) {
            return { error: `Cada franja debe durar al menos una consulta (${contexto.medico.duracion_cita_min} minutos).` };
        }
        const lista = porDia.get(b.dia) ?? [];
        if (lista.some(([i, f]) => ini < f && fin > i)) return { error: "Hay franjas que se cruzan el mismo día." };
        lista.push([ini, fin]);
        porDia.set(b.dia, lista);
    }
    await reemplazarDisponibilidad(contexto.medico.id, bloques);
    await auditar(contexto.usuarioId, "guardar_horario", "medico", contexto.medico.id);
    revalidatePath("/panel", "layout");
    return { exito: bloques.length === 0 ? "Horario guardado. Sin franjas, nadie podrá reservar contigo." : "Horario guardado. Los pacientes ya ven los turnos nuevos." };
}

/** Bloquea un día completo (vacaciones, congreso, incapacidad). */
export async function agregarAusencia(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const contexto = await medicoAutorizado(Number(texto(datos, "medicoId")));
    if (!contexto) return { error: "No tienes permiso para cambiar esta agenda." };
    const desde = texto(datos, "desde");
    const hasta = texto(datos, "hasta") || desde;
    const motivo = texto(datos, "motivo").slice(0, 150);
    if (!esFechaValida(desde) || !esFechaValida(hasta)) return { error: "Elige las fechas de la ausencia." };
    if (desde < hoyBogota()) return { error: "La ausencia debe empezar hoy o después." };
    if (hasta < desde) return { error: "La fecha final debe ser igual o posterior a la inicial." };
    if (sumarDias(desde, 60) < hasta) return { error: "Registra ausencias de máximo 60 días seguidos." };

    for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
        await crearBloqueo(contexto.medico.id, fecha, motivo);
    }

    // Las citas ya tomadas esos días se avisan al paciente para que reprograme.
    const afectadas = await consultar<{ id: number; paciente_id: number; inicio: Date }>(
        `SELECT id, paciente_id, inicio FROM citas
         WHERE medico_id = $1 AND estado = 'programada' AND inicio >= $2::timestamptz AND inicio < $3::timestamptz`,
        [contexto.medico.id, construirInstante(desde, "00:00").toISOString(), construirInstante(sumarDias(hasta, 1), "00:00").toISOString()],
    );
    for (const cita of afectadas) {
        await consultar("UPDATE citas SET estado = 'cancelada', cancelada_por = 'medico' WHERE id = $1", [cita.id]);
        await notificar(
            cita.paciente_id,
            "Tu cita fue cancelada",
            `${contexto.medico.nombres} ${contexto.medico.apellidos} no atenderá el ${formatearFechaLarga(new Date(cita.inicio))}. Reserva otro horario cuando quieras.`,
            `/panel/paciente/cita/${cita.id}`,
        );
    }
    await auditar(contexto.usuarioId, "registrar_ausencia", "medico", contexto.medico.id, `${desde} a ${hasta}`);
    revalidatePath("/panel", "layout");
    return {
        exito: afectadas.length > 0
            ? `Ausencia registrada. Se cancelaron ${afectadas.length} citas y avisamos a cada paciente.`
            : "Ausencia registrada. Esos días no aparecerán en la agenda pública.",
    };
}

export async function quitarAusencia(datos: FormData): Promise<void> {
    const contexto = await medicoAutorizado(Number(texto(datos, "medicoId")));
    if (!contexto) return;
    await eliminarBloqueo(contexto.medico.id, Number(texto(datos, "bloqueoId")));
    revalidatePath("/panel", "layout");
}
