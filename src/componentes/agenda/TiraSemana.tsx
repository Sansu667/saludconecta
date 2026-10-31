import Link from "next/link";
import { NOMBRES_DIAS_CORTOS, diaSemana, formatearFechaLarga, hoyBogota, sumarDias } from "@/lib/tiempo";

/** Lunes de la semana de una fecha. */
export function lunesDe(fecha: string): string {
    const d = diaSemana(fecha);
    return sumarDias(fecha, d === 0 ? -6 : 1 - d);
}

/** Navegación por días: semana anterior/siguiente y los siete días con su número de citas. */
export function TiraSemana({ fecha, conteos, ruta }: { fecha: string; conteos: Record<string, number>; ruta: (fecha: string) => string }) {
    const lunes = lunesDe(fecha);
    const hoy = hoyBogota();
    const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
    return (
        <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-2xl font-bold first-letter:uppercase">{formatearFechaLarga(fecha)}</p>
                <div className="flex gap-2">
                    <Link href={ruta(sumarDias(lunes, -7))} className="boton boton-secundario boton-pequeno" aria-label="Semana anterior">Anterior</Link>
                    {fecha !== hoy && <Link href={ruta(hoy)} className="boton boton-secundario boton-pequeno">Hoy</Link>}
                    <Link href={ruta(sumarDias(lunes, 7))} className="boton boton-secundario boton-pequeno" aria-label="Semana siguiente">Siguiente</Link>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
                {dias.map((d) => {
                    const activo = d === fecha;
                    const total = conteos[d] ?? 0;
                    return (
                        <Link
                            key={d}
                            href={ruta(d)}
                            aria-current={activo ? "date" : undefined}
                            className={`flex flex-col items-center rounded-xl border-[1.5px] py-2 leading-tight transition-colors ${
                                activo ? "border-tinta bg-tinta text-papel" : d === hoy ? "border-pino bg-white" : "border-linea bg-white hover:border-pino"
                            }`}
                        >
                            <span className={`text-xs ${activo ? "text-papel/70" : "text-gris"}`}>{NOMBRES_DIAS_CORTOS[diaSemana(d)]}</span>
                            <span className="font-display text-lg font-bold">{Number(d.slice(8))}</span>
                            <span className={`mt-0.5 text-[0.7rem] font-bold ${total ? (activo ? "text-resaltador" : "text-pino") : activo ? "text-papel/50" : "text-gris-suave"}`}>
                                {total}<span className="hidden sm:inline"> {total === 1 ? "cita" : "citas"}</span>
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
