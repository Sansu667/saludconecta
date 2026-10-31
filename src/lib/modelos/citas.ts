import "server-only";
import { consultar, consultarUno, esViolacionUnicidad } from "../db";
import {
    construirInstante, diaSemana, fechaBogota, horaBogota, horaDeMinutos, hoyBogota, minutosDeHora, sumarDias,
} from "../tiempo";

/** Con cuánta anticipación mínima se puede reservar un turno. */
export const ANTICIPACION_MINIMA_MINUTOS = 60;
/** Hasta cuántos días hacia adelante se abre la agenda. */
export const DIAS_AGENDA_ABIERTA = 45;
/** Hasta cuántas horas antes un paciente puede cancelar o reprogramar. */
export const HORAS_MINIMAS_CAMBIO_PACIENTE = 2;

export type EstadoCita = "programada" | "completada" | "cancelada" | "no_asistio";

export const ETIQUETAS_ESTADO: Record<EstadoCita, string> = {
    programada: "Programada",
    completada: "Atendida",
    cancelada: "Cancelada",
    no_asistio: "No asistió",
};

export interface CitaDetalle {
    id: number;
    consultorio_id: number;
    medico_id: number;
    paciente_id: number;
    inicio: Date;
    fin: Date;
    estado: EstadoCita;
    motivo: string | null;
    diagnostico: string | null;
    tratamiento: string | null;
    notas_medico: string | null;
    cancelada_por: string | null;
    medico_nombres: string;
    medico_apellidos: string;
    medico_usuario_id: number;
    especialidad: string | null;
    paciente_nombres: string;
    paciente_apellidos: string;
    paciente_email: string;
    paciente_telefono: string | null;
    paciente_tipo_doc: string | null;
    paciente_num_doc: string | null;
    paciente_fecha_nac: string | null;
    consultorio_nombre: string;
    consultorio_slug: string;
    consultorio_direccion: string | null;
    consultorio_telefono: string | null;
}

const SELECCION_DETALLE = `
    SELECT c.id, c.consultorio_id, c.medico_id, c.paciente_id, c.inicio, c.fin, c.estado, c.motivo,
           c.diagnostico, c.tratamiento, c.notas_medico, c.cancelada_por,
           um.nombres AS medico_nombres, um.apellidos AS medico_apellidos, um.id AS medico_usuario_id,
           e.nombre AS especialidad,
           up.nombres AS paciente_nombres, up.apellidos AS paciente_apellidos, up.email AS paciente_email,
           up.telefono AS paciente_telefono, up.tipo_doc AS paciente_tipo_doc, up.num_doc AS paciente_num_doc,
           up.fecha_nac::text AS paciente_fecha_nac,
           co.nombre AS consultorio_nombre, co.slug AS consultorio_slug, co.direccion AS consultorio_direccion,
           co.telefono AS consultorio_telefono
    FROM citas c
    JOIN medicos m ON m.id = c.medico_id
    JOIN usuarios um ON um.id = m.usuario_id
    LEFT JOIN especialidades e ON e.id = m.especialidad_id
    JOIN usuarios up ON up.id = c.paciente_id
    JOIN consultorios co ON co.id = c.consultorio_id`;

function normalizarCita<T extends { inicio: unknown; fin: unknown }>(fila: T): T {
    return { ...fila, inicio: new Date(fila.inicio as string), fin: new Date(fila.fin as string) };
}

export type Resultado<T = undefined> = { ok: true; valor: T } | { ok: false; error: string };

/**
 * Calcula los turnos libres de un médico entre dos fechas (incluidas).
 * Combina el horario semanal, los días bloqueados y las citas ya tomadas.
 * @param excluirCitaId Cita que se ignora (útil al reprogramar esa misma cita).
 * @return Mapa de fecha AAAA-MM-DD a lista de horas HH:MM libres.
 */
export async function calcularTurnosLibres(
    medicoId: number,
    desde: string,
    hasta: string,
    excluirCitaId: number | null = null,
): Promise<Map<string, string[]>> {
    const resultado = new Map<string, string[]>();
    const medico = await consultarUno<{ duracion_cita_min: number; activo: boolean }>(
        "SELECT duracion_cita_min, activo FROM medicos WHERE id = $1",
        [medicoId],
    );
    if (!medico || !medico.activo) return resultado;

    const hoy = hoyBogota();
    const limite = sumarDias(hoy, DIAS_AGENDA_ABIERTA);
    const inicioRango = desde < hoy ? hoy : desde;
    const finRango = hasta > limite ? limite : hasta;
    if (inicioRango > finRango) return resultado;

    const [bloques, bloqueos, ocupadas] = await Promise.all([
        consultar<{ dia_semana: number; hora_inicio: string; hora_fin: string }>(
            `SELECT dia_semana, to_char(hora_inicio, 'HH24:MI') AS hora_inicio, to_char(hora_fin, 'HH24:MI') AS hora_fin
             FROM disponibilidad WHERE medico_id = $1 ORDER BY hora_inicio`,
            [medicoId],
        ),
        consultar<{ fecha: string }>(
            "SELECT fecha::text AS fecha FROM bloqueos WHERE medico_id = $1 AND fecha BETWEEN $2::date AND $3::date",
            [medicoId, inicioRango, finRango],
        ),
        consultar<{ inicio: string; fin: string }>(
            `SELECT inicio, fin FROM citas
             WHERE medico_id = $1 AND estado <> 'cancelada' AND ($4::int IS NULL OR id <> $4::int)
               AND inicio < $3::timestamptz AND fin > $2::timestamptz`,
            [
                medicoId,
                construirInstante(inicioRango, "00:00").toISOString(),
                construirInstante(sumarDias(finRango, 1), "00:00").toISOString(),
                excluirCitaId,
            ],
        ),
    ]);

    const diasBloqueados = new Set(bloqueos.map((b) => b.fecha));
    const intervalosOcupados = ocupadas.map((o) => [new Date(o.inicio).getTime(), new Date(o.fin).getTime()]);
    const momentoMinimo = Date.now() + ANTICIPACION_MINIMA_MINUTOS * 60000;
    const duracionMs = medico.duracion_cita_min * 60000;

    for (let fecha = inicioRango; fecha <= finRango; fecha = sumarDias(fecha, 1)) {
        if (diasBloqueados.has(fecha)) continue;
        const dia = diaSemana(fecha);
        const horas: string[] = [];
        for (const bloque of bloques.filter((b) => b.dia_semana === dia)) {
            const finBloque = minutosDeHora(bloque.hora_fin);
            for (let m = minutosDeHora(bloque.hora_inicio); m + medico.duracion_cita_min <= finBloque; m += medico.duracion_cita_min) {
                const hora = horaDeMinutos(m);
                const inicio = construirInstante(fecha, hora).getTime();
                if (inicio < momentoMinimo) continue;
                const fin = inicio + duracionMs;
                const choca = intervalosOcupados.some(([oi, of]) => inicio < of && fin > oi);
                if (!choca) horas.push(hora);
            }
        }
        if (horas.length > 0) resultado.set(fecha, horas);
    }
    return resultado;
}

/** Turnos libres de un solo día. */
export async function turnosLibresDelDia(medicoId: number, fecha: string, excluirCitaId: number | null = null): Promise<string[]> {
    const mapa = await calcularTurnosLibres(medicoId, fecha, fecha, excluirCitaId);
    return mapa.get(fecha) ?? [];
}

/**
 * Agenda una cita verificando que el turno siga libre.
 * El índice único parcial de la base de datos impide dos citas en el mismo turno
 * aunque dos personas confirmen al mismo tiempo.
 */
export async function agendarCita(datos: {
    medicoId: number;
    pacienteId: number;
    fecha: string;
    hora: string;
    motivo: string;
}): Promise<Resultado<number>> {
    const medico = await consultarUno<{ consultorio_id: number; duracion_cita_min: number }>(
        "SELECT consultorio_id, duracion_cita_min FROM medicos WHERE id = $1 AND activo",
        [datos.medicoId],
    );
    if (!medico) return { ok: false, error: "Este profesional no está recibiendo citas en este momento." };

    const libres = await turnosLibresDelDia(datos.medicoId, datos.fecha);
    if (!libres.includes(datos.hora)) {
        return { ok: false, error: "Ese horario ya no está disponible. Elige otro, por favor." };
    }
    const inicio = construirInstante(datos.fecha, datos.hora);
    const fin = new Date(inicio.getTime() + medico.duracion_cita_min * 60000);

    const cruce = await consultarUno(
        `SELECT 1 FROM citas WHERE paciente_id = $1 AND estado = 'programada'
         AND inicio < $3::timestamptz AND fin > $2::timestamptz`,
        [datos.pacienteId, inicio.toISOString(), fin.toISOString()],
    );
    if (cruce) return { ok: false, error: "Ya tienes otra cita a esa misma hora." };

    try {
        const [fila] = await consultar<{ id: number }>(
            `INSERT INTO citas (consultorio_id, medico_id, paciente_id, inicio, fin, motivo)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [medico.consultorio_id, datos.medicoId, datos.pacienteId, inicio.toISOString(), fin.toISOString(), datos.motivo.trim() || null],
        );
        return { ok: true, valor: fila.id };
    } catch (error) {
        if (esViolacionUnicidad(error)) {
            return { ok: false, error: "Alguien acaba de tomar ese horario. Elige otro, por favor." };
        }
        throw error;
    }
}

/** Mueve una cita programada a otro turno libre del mismo médico. */
export async function reprogramarCita(citaId: number, fecha: string, hora: string): Promise<Resultado> {
    const cita = await consultarUno<{ medico_id: number; estado: EstadoCita; duracion: number }>(
        `SELECT c.medico_id, c.estado, m.duracion_cita_min AS duracion
         FROM citas c JOIN medicos m ON m.id = c.medico_id WHERE c.id = $1`,
        [citaId],
    );
    if (!cita || cita.estado !== "programada") return { ok: false, error: "Solo se pueden reprogramar citas programadas." };
    const libres = await turnosLibresDelDia(cita.medico_id, fecha, citaId);
    if (!libres.includes(hora)) return { ok: false, error: "Ese horario ya no está disponible. Elige otro, por favor." };
    const inicio = construirInstante(fecha, hora);
    const fin = new Date(inicio.getTime() + cita.duracion * 60000);
    try {
        await consultar(
            "UPDATE citas SET inicio = $1, fin = $2, recordatorio_enviado = FALSE WHERE id = $3",
            [inicio.toISOString(), fin.toISOString(), citaId],
        );
        return { ok: true, valor: undefined };
    } catch (error) {
        if (esViolacionUnicidad(error)) return { ok: false, error: "Alguien acaba de tomar ese horario. Elige otro, por favor." };
        throw error;
    }
}

/** Cancela una cita programada. */
export async function cancelarCita(citaId: number, canceladaPor: "paciente" | "medico" | "admin"): Promise<Resultado> {
    const filas = await consultar(
        "UPDATE citas SET estado = 'cancelada', cancelada_por = $2 WHERE id = $1 AND estado = 'programada' RETURNING id",
        [citaId, canceladaPor],
    );
    if (filas.length === 0) return { ok: false, error: "La cita ya no estaba programada." };
    return { ok: true, valor: undefined };
}

/** Guarda lo que el médico registró en la consulta y cierra la cita. */
export async function registrarAtencion(
    citaId: number,
    datos: { estado: "completada" | "no_asistio"; diagnostico: string; tratamiento: string; notas: string },
): Promise<void> {
    await consultar(
        `UPDATE citas SET estado = $2, diagnostico = $3, tratamiento = $4, notas_medico = $5
         WHERE id = $1 AND estado <> 'cancelada'`,
        [citaId, datos.estado, datos.diagnostico.trim() || null, datos.tratamiento.trim() || null, datos.notas.trim() || null],
    );
}

export async function obtenerCita(citaId: number): Promise<CitaDetalle | null> {
    const fila = await consultarUno<CitaDetalle>(`${SELECCION_DETALLE} WHERE c.id = $1`, [citaId]);
    return fila ? normalizarCita(fila) : null;
}

/** Citas del paciente: próximas (programadas a futuro) o historial. */
export async function listarCitasPaciente(pacienteId: number, tipo: "proximas" | "historial"): Promise<CitaDetalle[]> {
    const condicion = tipo === "proximas"
        ? "c.estado = 'programada' AND c.fin >= NOW() ORDER BY c.inicio ASC"
        : "NOT (c.estado = 'programada' AND c.fin >= NOW()) ORDER BY c.inicio DESC LIMIT 100";
    const filas = await consultar<CitaDetalle>(`${SELECCION_DETALLE} WHERE c.paciente_id = $1 AND ${condicion}`, [pacienteId]);
    return filas.map(normalizarCita);
}

/** Citas de un médico en un rango de fechas locales. */
export async function listarCitasMedico(medicoId: number, desde: string, hasta: string): Promise<CitaDetalle[]> {
    const filas = await consultar<CitaDetalle>(
        `${SELECCION_DETALLE} WHERE c.medico_id = $1 AND c.inicio >= $2::timestamptz AND c.inicio < $3::timestamptz
         ORDER BY c.inicio`,
        [medicoId, construirInstante(desde, "00:00").toISOString(), construirInstante(sumarDias(hasta, 1), "00:00").toISOString()],
    );
    return filas.map(normalizarCita);
}

/** Historia de un paciente dentro de un consultorio (lo que ve el médico). */
export async function historialPacienteEnConsultorio(pacienteId: number, consultorioId: number): Promise<CitaDetalle[]> {
    const filas = await consultar<CitaDetalle>(
        `${SELECCION_DETALLE} WHERE c.paciente_id = $1 AND c.consultorio_id = $2 ORDER BY c.inicio DESC`,
        [pacienteId, consultorioId],
    );
    return filas.map(normalizarCita);
}

export interface FiltrosReporte {
    desde: string;
    hasta: string;
    medicoId?: number | null;
    especialidadId?: number | null;
    estado?: EstadoCita | null;
}

/** Listado de citas del consultorio con filtros, para reportes y exportación. */
export async function reporteCitas(consultorioId: number, filtros: FiltrosReporte, limite = 2000): Promise<CitaDetalle[]> {
    const filas = await consultar<CitaDetalle>(
        `${SELECCION_DETALLE}
         WHERE c.consultorio_id = $1 AND c.inicio >= $2::timestamptz AND c.inicio < $3::timestamptz
           AND ($4::int IS NULL OR c.medico_id = $4::int)
           AND ($5::int IS NULL OR m.especialidad_id = $5::int)
           AND ($6::text IS NULL OR c.estado = $6::text)
         ORDER BY c.inicio DESC LIMIT $7`,
        [
            consultorioId,
            construirInstante(filtros.desde, "00:00").toISOString(),
            construirInstante(sumarDias(filtros.hasta, 1), "00:00").toISOString(),
            filtros.medicoId ?? null,
            filtros.especialidadId ?? null,
            filtros.estado ?? null,
            limite,
        ],
    );
    return filas.map(normalizarCita);
}

export interface ResumenEstados {
    total: number;
    programada: number;
    completada: number;
    cancelada: number;
    no_asistio: number;
}

export interface Estadisticas {
    resumen: ResumenEstados;
    porMedico: Array<{ medico_id: number; nombre: string; especialidad: string | null } & ResumenEstados>;
    porEspecialidad: Array<{ nombre: string; total: number }>;
    porDia: Array<{ fecha: string; total: number }>;
    pacientesUnicos: number;
}

/** Cifras del consultorio en un rango de fechas. */
export async function calcularEstadisticas(consultorioId: number, desde: string, hasta: string): Promise<Estadisticas> {
    const parametros = [
        consultorioId,
        construirInstante(desde, "00:00").toISOString(),
        construirInstante(sumarDias(hasta, 1), "00:00").toISOString(),
    ];
    const conteo = `COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE c.estado = 'programada')::int AS programada,
        COUNT(*) FILTER (WHERE c.estado = 'completada')::int AS completada,
        COUNT(*) FILTER (WHERE c.estado = 'cancelada')::int AS cancelada,
        COUNT(*) FILTER (WHERE c.estado = 'no_asistio')::int AS no_asistio`;
    const rango = "c.consultorio_id = $1 AND c.inicio >= $2::timestamptz AND c.inicio < $3::timestamptz";

    const [resumen, porMedico, porEspecialidad, porDia, unicos] = await Promise.all([
        consultarUno<ResumenEstados>(`SELECT ${conteo} FROM citas c WHERE ${rango}`, parametros),
        consultar<{ medico_id: number; nombre: string; especialidad: string | null } & ResumenEstados>(
            `SELECT m.id AS medico_id, u.nombres || ' ' || u.apellidos AS nombre, e.nombre AS especialidad, ${conteo}
             FROM medicos m JOIN usuarios u ON u.id = m.usuario_id
             LEFT JOIN especialidades e ON e.id = m.especialidad_id
             LEFT JOIN citas c ON c.medico_id = m.id AND c.inicio >= $2::timestamptz AND c.inicio < $3::timestamptz
             WHERE m.consultorio_id = $1
             GROUP BY m.id, u.nombres, u.apellidos, e.nombre
             ORDER BY total DESC`,
            parametros,
        ),
        consultar<{ nombre: string; total: number }>(
            `SELECT COALESCE(e.nombre, 'Sin especialidad') AS nombre, COUNT(c.id)::int AS total
             FROM citas c JOIN medicos m ON m.id = c.medico_id
             LEFT JOIN especialidades e ON e.id = m.especialidad_id
             WHERE ${rango} AND c.estado <> 'cancelada'
             GROUP BY 1 ORDER BY total DESC`,
            parametros,
        ),
        consultar<{ fecha: string; total: number }>(
            `SELECT to_char(c.inicio AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') AS fecha, COUNT(*)::int AS total
             FROM citas c WHERE ${rango} AND c.estado <> 'cancelada'
             GROUP BY 1 ORDER BY 1`,
            parametros,
        ),
        consultarUno<{ total: number }>(
            `SELECT COUNT(DISTINCT c.paciente_id)::int AS total FROM citas c WHERE ${rango}`,
            parametros,
        ),
    ]);

    return {
        resumen: resumen ?? { total: 0, programada: 0, completada: 0, cancelada: 0, no_asistio: 0 },
        porMedico,
        porEspecialidad,
        porDia,
        pacientesUnicos: unicos?.total ?? 0,
    };
}

/** Citas programadas que empiezan en las próximas 24 horas y aún no tienen recordatorio. */
export async function citasParaRecordar(pacienteId: number | null): Promise<CitaDetalle[]> {
    const filas = await consultar<CitaDetalle>(
        `${SELECCION_DETALLE}
         WHERE c.estado = 'programada' AND c.recordatorio_enviado = FALSE
           AND c.inicio > NOW() AND c.inicio <= NOW() + INTERVAL '24 hours'
           AND ($1::int IS NULL OR c.paciente_id = $1::int)
         LIMIT 500`,
        [pacienteId],
    );
    return filas.map(normalizarCita);
}

export async function marcarRecordatorioEnviado(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await consultar("UPDATE citas SET recordatorio_enviado = TRUE WHERE id = ANY($1::int[])", [ids]);
}

/** Indica si al paciente aún le da el tiempo para cancelar o reprogramar. */
export function pacientePuedeCambiar(cita: { inicio: Date; estado: EstadoCita }): boolean {
    if (cita.estado !== "programada") return false;
    return cita.inicio.getTime() - Date.now() >= HORAS_MINIMAS_CAMBIO_PACIENTE * 3600000;
}

export { fechaBogota, horaBogota };
