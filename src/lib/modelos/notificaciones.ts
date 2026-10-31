import "server-only";
import { consultar, consultarUno } from "../db";
import { citasParaRecordar, marcarRecordatorioEnviado } from "./citas";
import { formatearFechaLarga, formatearHora } from "../tiempo";

export interface Notificacion {
    id: number;
    titulo: string;
    cuerpo: string | null;
    enlace: string | null;
    leida: boolean;
    creado_en: Date;
}

/** Crea una notificación dentro de la plataforma. */
export async function notificar(usuarioId: number, titulo: string, cuerpo: string, enlace: string | null = null): Promise<void> {
    await consultar(
        "INSERT INTO notificaciones (usuario_id, titulo, cuerpo, enlace) VALUES ($1, $2, $3, $4)",
        [usuarioId, titulo, cuerpo, enlace],
    );
}

export async function listarNotificaciones(usuarioId: number, limite = 40): Promise<Notificacion[]> {
    const filas = await consultar<Notificacion>(
        `SELECT id, titulo, cuerpo, enlace, leida, creado_en FROM notificaciones
         WHERE usuario_id = $1 ORDER BY creado_en DESC LIMIT $2`,
        [usuarioId, limite],
    );
    return filas.map((f) => ({ ...f, creado_en: new Date(f.creado_en) }));
}

export async function contarNoLeidas(usuarioId: number): Promise<number> {
    const fila = await consultarUno<{ total: number }>(
        "SELECT COUNT(*)::int AS total FROM notificaciones WHERE usuario_id = $1 AND NOT leida",
        [usuarioId],
    );
    return fila?.total ?? 0;
}

export async function marcarTodasLeidas(usuarioId: number): Promise<void> {
    await consultar("UPDATE notificaciones SET leida = TRUE WHERE usuario_id = $1 AND NOT leida", [usuarioId]);
}

/**
 * Crea los recordatorios de las citas de las próximas 24 horas.
 * Se llama al abrir el panel del paciente y desde la tarea programada diaria,
 * así el recordatorio llega aunque el paciente no entre a la plataforma.
 * @param pacienteId Limita a un paciente; null procesa todos.
 * @return Cuántos recordatorios se crearon.
 */
export async function generarRecordatorios(pacienteId: number | null): Promise<number> {
    const citas = await citasParaRecordar(pacienteId);
    for (const cita of citas) {
        await notificar(
            cita.paciente_id,
            "Recordatorio de tu cita",
            `Tienes cita con ${cita.medico_nombres} ${cita.medico_apellidos} el ${formatearFechaLarga(cita.inicio)} a las ${formatearHora(cita.inicio)} en ${cita.consultorio_nombre}.`,
            `/panel/paciente/cita/${cita.id}`,
        );
    }
    await marcarRecordatorioEnviado(citas.map((c) => c.id));
    return citas.length;
}

/** Deja una huella de las acciones importantes para auditoría. */
export async function auditar(usuarioId: number | null, accion: string, entidad: string | null = null, entidadId: number | null = null, detalle: string | null = null): Promise<void> {
    try {
        await consultar(
            "INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle) VALUES ($1, $2, $3, $4, $5)",
            [usuarioId, accion, entidad, entidadId, detalle],
        );
    } catch {
        // La auditoría nunca debe tumbar la operación principal.
    }
}

export async function guardarProspecto(datos: {
    nombre: string; email: string; telefono: string; consultorio: string; ciudad: string; medicos: string; mensaje: string;
}): Promise<void> {
    await consultar(
        `INSERT INTO prospectos (nombre, email, telefono, consultorio, ciudad, medicos, mensaje)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [datos.nombre, datos.email, datos.telefono, datos.consultorio, datos.ciudad, datos.medicos, datos.mensaje],
    );
}

export async function listarProspectos(): Promise<Array<{
    id: number; nombre: string; email: string; telefono: string | null; consultorio: string | null;
    ciudad: string | null; medicos: string | null; mensaje: string | null; creado_en: Date;
}>> {
    return consultar("SELECT * FROM prospectos ORDER BY creado_en DESC LIMIT 500");
}

export async function resumenPlataforma(): Promise<{ consultorios: number; pacientes: number; citas: number }> {
    const fila = await consultarUno<{ consultorios: number; pacientes: number; citas: number }>(
        `SELECT (SELECT COUNT(*)::int FROM consultorios WHERE NOT es_demo) AS consultorios,
                (SELECT COUNT(*)::int FROM usuarios WHERE rol = 'paciente' AND NOT es_demo) AS pacientes,
                (SELECT COUNT(*)::int FROM citas c JOIN consultorios co ON co.id = c.consultorio_id WHERE NOT co.es_demo) AS citas`,
    );
    return fila ?? { consultorios: 0, pacientes: 0, citas: 0 };
}
