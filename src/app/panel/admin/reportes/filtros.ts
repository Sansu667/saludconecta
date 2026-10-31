import type { EstadoCita, FiltrosReporte } from "@/lib/modelos/citas";
import { esFechaValida, hoyBogota, sumarDias } from "@/lib/tiempo";

export type ParametrosReporte = { desde?: string; hasta?: string; medico?: string; especialidad?: string; estado?: string };

const ESTADOS: EstadoCita[] = ["programada", "completada", "cancelada", "no_asistio"];

/** Convierte los parámetros de la URL en filtros válidos (por defecto, los últimos 30 días). */
export function leerFiltros(p: ParametrosReporte): FiltrosReporte {
    const hoy = hoyBogota();
    let desde = p.desde && esFechaValida(p.desde) ? p.desde : sumarDias(hoy, -29);
    let hasta = p.hasta && esFechaValida(p.hasta) ? p.hasta : hoy;
    if (hasta < desde) [desde, hasta] = [hasta, desde];
    if (sumarDias(desde, 366) < hasta) desde = sumarDias(hasta, -366);
    return {
        desde,
        hasta,
        medicoId: Number(p.medico) || null,
        especialidadId: Number(p.especialidad) || null,
        estado: ESTADOS.includes(p.estado as EstadoCita) ? (p.estado as EstadoCita) : null,
    };
}

export function filtrosAConsulta(f: FiltrosReporte): string {
    const q = new URLSearchParams({ desde: f.desde, hasta: f.hasta });
    if (f.medicoId) q.set("medico", String(f.medicoId));
    if (f.especialidadId) q.set("especialidad", String(f.especialidadId));
    if (f.estado) q.set("estado", f.estado);
    return q.toString();
}
