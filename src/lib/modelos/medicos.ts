import "server-only";
import { consultar, consultarUno } from "../db";

export interface Medico {
    id: number;
    usuario_id: number;
    consultorio_id: number;
    especialidad_id: number | null;
    especialidad: string | null;
    num_registro: string | null;
    biografia: string | null;
    duracion_cita_min: number;
    activo: boolean;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string | null;
}

export interface BloqueHorario {
    id: number;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
}

export interface Bloqueo {
    id: number;
    fecha: string;
    motivo: string | null;
}

const SELECCION = `
    SELECT m.id, m.usuario_id, m.consultorio_id, m.especialidad_id, e.nombre AS especialidad,
           m.num_registro, m.biografia, m.duracion_cita_min, m.activo,
           u.nombres, u.apellidos, u.email, u.telefono
    FROM medicos m
    JOIN usuarios u ON u.id = m.usuario_id
    LEFT JOIN especialidades e ON e.id = m.especialidad_id`;

export async function listarMedicos(consultorioId: number, soloActivos = false): Promise<Medico[]> {
    return consultar<Medico>(
        `${SELECCION} WHERE m.consultorio_id = $1 ${soloActivos ? "AND m.activo" : ""} ORDER BY u.nombres`,
        [consultorioId],
    );
}

/** Médicos activos que tienen al menos un bloque de horario (los que se pueden agendar). */
export async function listarMedicosAgendables(consultorioId: number): Promise<Medico[]> {
    return consultar<Medico>(
        `${SELECCION} WHERE m.consultorio_id = $1 AND m.activo
         AND EXISTS (SELECT 1 FROM disponibilidad d WHERE d.medico_id = m.id)
         ORDER BY e.nombre, u.nombres`,
        [consultorioId],
    );
}

export async function buscarMedicoPorId(id: number): Promise<Medico | null> {
    return consultarUno<Medico>(`${SELECCION} WHERE m.id = $1`, [id]);
}

export async function buscarMedicoPorUsuario(usuarioId: number): Promise<Medico | null> {
    return consultarUno<Medico>(`${SELECCION} WHERE m.usuario_id = $1`, [usuarioId]);
}

/** Crea el perfil profesional de un usuario médico. */
export async function crearPerfilMedico(datos: {
    usuarioId: number;
    consultorioId: number;
    especialidadId: number | null;
    numRegistro: string;
    duracion: number;
    biografia?: string;
}): Promise<number> {
    const [fila] = await consultar<{ id: number }>(
        `INSERT INTO medicos (usuario_id, consultorio_id, especialidad_id, num_registro, duracion_cita_min, biografia)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [datos.usuarioId, datos.consultorioId, datos.especialidadId, datos.numRegistro.trim(), datos.duracion, datos.biografia?.trim() || null],
    );
    return fila.id;
}

export async function actualizarPerfilMedico(
    id: number,
    datos: { especialidadId: number | null; numRegistro: string; duracion: number; biografia: string; activo: boolean },
): Promise<void> {
    await consultar(
        `UPDATE medicos SET especialidad_id = $1, num_registro = $2, duracion_cita_min = $3, biografia = $4, activo = $5
         WHERE id = $6`,
        [datos.especialidadId, datos.numRegistro.trim(), datos.duracion, datos.biografia.trim() || null, datos.activo, id],
    );
}

export async function obtenerDisponibilidad(medicoId: number): Promise<BloqueHorario[]> {
    return consultar<BloqueHorario>(
        `SELECT id, dia_semana, to_char(hora_inicio, 'HH24:MI') AS hora_inicio, to_char(hora_fin, 'HH24:MI') AS hora_fin
         FROM disponibilidad WHERE medico_id = $1 ORDER BY dia_semana, hora_inicio`,
        [medicoId],
    );
}

/** Reemplaza el horario semanal completo del médico. */
export async function reemplazarDisponibilidad(
    medicoId: number,
    bloques: Array<{ dia: number; inicio: string; fin: string }>,
): Promise<void> {
    await consultar("DELETE FROM disponibilidad WHERE medico_id = $1", [medicoId]);
    if (bloques.length === 0) return;
    await consultar(
        `INSERT INTO disponibilidad (medico_id, dia_semana, hora_inicio, hora_fin)
         SELECT $1, d, i::time, f::time FROM unnest($2::int[], $3::text[], $4::text[]) AS t(d, i, f)`,
        [medicoId, bloques.map((b) => b.dia), bloques.map((b) => b.inicio), bloques.map((b) => b.fin)],
    );
}

export async function listarBloqueos(medicoId: number, desde: string): Promise<Bloqueo[]> {
    return consultar<Bloqueo>(
        "SELECT id, fecha::text AS fecha, motivo FROM bloqueos WHERE medico_id = $1 AND fecha >= $2::date ORDER BY fecha",
        [medicoId, desde],
    );
}

export async function crearBloqueo(medicoId: number, fecha: string, motivo: string): Promise<void> {
    await consultar(
        `INSERT INTO bloqueos (medico_id, fecha, motivo) VALUES ($1, $2::date, $3)
         ON CONFLICT (medico_id, fecha) DO UPDATE SET motivo = EXCLUDED.motivo`,
        [medicoId, fecha, motivo.trim() || null],
    );
}

export async function eliminarBloqueo(medicoId: number, bloqueoId: number): Promise<void> {
    await consultar("DELETE FROM bloqueos WHERE id = $1 AND medico_id = $2", [bloqueoId, medicoId]);
}

export function nombreMedico(medico: { nombres: string; apellidos: string }): string {
    return `${medico.nombres} ${medico.apellidos}`;
}
