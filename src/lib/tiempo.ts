/**
 * Utilidades de fecha y hora. Colombia no usa horario de verano, así que
 * todo el sistema trabaja con el desfase fijo de Bogotá (UTC-5).
 */
export const ZONA_HORARIA = "America/Bogota";
export const DESFASE_BOGOTA = "-05:00";

const NOMBRES_DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const NOMBRES_DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const NOMBRES_MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export { NOMBRES_DIAS, NOMBRES_DIAS_CORTOS };

function partes(fecha: Date): { anio: string; mes: string; dia: string; hora: string; minuto: string } {
    const formato = new Intl.DateTimeFormat("en-CA", {
        timeZone: ZONA_HORARIA,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });
    const mapa: Record<string, string> = {};
    for (const parte of formato.formatToParts(fecha)) {
        mapa[parte.type] = parte.value;
    }
    return { anio: mapa.year, mes: mapa.month, dia: mapa.day, hora: mapa.hour, minuto: mapa.minute };
}

/** Fecha (AAAA-MM-DD) de un instante, vista desde Bogotá. */
export function fechaBogota(instante: Date): string {
    const p = partes(instante);
    return `${p.anio}-${p.mes}-${p.dia}`;
}

/** Hora (HH:MM, 24 h) de un instante, vista desde Bogotá. */
export function horaBogota(instante: Date): string {
    const p = partes(instante);
    return `${p.hora}:${p.minuto}`;
}

/** Fecha de hoy en Bogotá. */
export function hoyBogota(): string {
    return fechaBogota(new Date());
}

/** Convierte una fecha y una hora locales de Bogotá en un instante. */
export function construirInstante(fecha: string, hora: string): Date {
    const horaNormalizada = hora.length === 5 ? `${hora}:00` : hora;
    return new Date(`${fecha}T${horaNormalizada}${DESFASE_BOGOTA}`);
}

/** Día de la semana (0 = domingo) de una fecha AAAA-MM-DD. */
export function diaSemana(fecha: string): number {
    return new Date(`${fecha}T12:00:00Z`).getUTCDay();
}

/** Suma días a una fecha AAAA-MM-DD. */
export function sumarDias(fecha: string, dias: number): string {
    const base = new Date(`${fecha}T12:00:00Z`);
    base.setUTCDate(base.getUTCDate() + dias);
    return base.toISOString().slice(0, 10);
}

/** Valida el formato AAAA-MM-DD. */
export function esFechaValida(fecha: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
    const d = new Date(`${fecha}T12:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}

/** "viernes 30 de octubre" */
export function formatearFechaLarga(fecha: string | Date): string {
    const texto = typeof fecha === "string" ? fecha : fechaBogota(fecha);
    const [anio, mes, dia] = texto.split("-").map(Number);
    const nombreDia = NOMBRES_DIAS[diaSemana(texto)];
    const sufijoAnio = anio !== Number(hoyBogota().slice(0, 4)) ? ` de ${anio}` : "";
    return `${nombreDia} ${dia} de ${NOMBRES_MESES[mes - 1]}${sufijoAnio}`;
}

/** "30 oct" */
export function formatearFechaCorta(fecha: string | Date): string {
    const texto = typeof fecha === "string" ? fecha : fechaBogota(fecha);
    const [, mes, dia] = texto.split("-").map(Number);
    return `${dia} ${NOMBRES_MESES[mes - 1].slice(0, 3)}`;
}

/** "8:30 a. m." a partir de "08:30" o de un instante. */
export function formatearHora(hora: string | Date): string {
    const texto = typeof hora === "string" ? hora.slice(0, 5) : horaBogota(hora);
    const [h, m] = texto.split(":").map(Number);
    const sufijo = h < 12 ? "a. m." : "p. m.";
    const hora12 = h % 12 === 0 ? 12 : h % 12;
    return `${hora12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

/** Minutos desde medianoche de una hora "HH:MM" o "HH:MM:SS". */
export function minutosDeHora(hora: string): number {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
}

/** "HH:MM" a partir de minutos desde medianoche. */
export function horaDeMinutos(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Edad en años cumplidos a partir de AAAA-MM-DD. */
export function calcularEdad(fechaNacimiento: string | null | undefined): number | null {
    if (!fechaNacimiento) return null;
    const hoy = hoyBogota();
    const [a1, m1, d1] = fechaNacimiento.split("-").map(Number);
    const [a2, m2, d2] = hoy.split("-").map(Number);
    let edad = a2 - a1;
    if (m2 < m1 || (m2 === m1 && d2 < d1)) edad -= 1;
    return edad;
}
