"use client";

import { useEffect, useState, useTransition } from "react";
import { obtenerTurnos, type DiaConTurnos } from "@/app/acciones/agenda";

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function partesFecha(fecha: string) {
    const d = new Date(`${fecha}T12:00:00Z`);
    return { dia: d.getUTCDay(), numero: d.getUTCDate(), mes: d.getUTCMonth() };
}

export function textoFecha(fecha: string): string {
    const p = partesFecha(fecha);
    return `${DIAS_LARGOS[p.dia]} ${p.numero} de ${MESES_LARGOS[p.mes]}`;
}

export function textoHora(hora: string): string {
    const [h, m] = hora.split(":").map(Number);
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

interface Props {
    medicoId: number | null;
    excluirCitaId?: number | null;
    onCambio?: (seleccion: { fecha: string; hora: string } | null) => void;
    fechaInicial?: string | null;
    horaInicial?: string | null;
}

/**
 * Selector de turno: una tira de días con cupo y los horarios libres del día
 * elegido. Escribe la selección en los campos ocultos fecha y hora.
 */
export function SelectorTurno({ medicoId, excluirCitaId = null, onCambio, fechaInicial = null, horaInicial = null }: Props) {
    const [dias, setDias] = useState<DiaConTurnos[] | null>(null);
    const [fecha, setFecha] = useState<string | null>(null);
    const [hora, setHora] = useState<string | null>(null);
    const [cargando, iniciar] = useTransition();

    useEffect(() => {
        setFecha(null);
        setHora(null);
        onCambio?.(null);
        if (!medicoId) {
            setDias(null);
            return;
        }
        iniciar(async () => {
            const resultado = await obtenerTurnos(medicoId, excluirCitaId);
            setDias(resultado);
            const preferido = resultado.find((d) => d.fecha === fechaInicial);
            if (preferido) {
                setFecha(preferido.fecha);
                if (horaInicial && preferido.horas.includes(horaInicial)) {
                    setHora(horaInicial);
                    onCambio?.({ fecha: preferido.fecha, hora: horaInicial });
                }
            } else if (resultado.length > 0) {
                setFecha(resultado[0].fecha);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [medicoId, excluirCitaId]);

    if (!medicoId) return null;
    if (cargando || dias === null) {
        return <p className="py-6 text-gris" aria-live="polite">Buscando horarios libres…</p>;
    }
    if (dias.length === 0) {
        return (
            <p className="rounded-lg bg-menta px-4 py-4">
                Este profesional no tiene turnos libres en las próximas cuatro semanas. Prueba con otro o llama al consultorio.
            </p>
        );
    }

    const horasDelDia = dias.find((d) => d.fecha === fecha)?.horas ?? [];
    const manana = horasDelDia.filter((h) => Number(h.slice(0, 2)) < 12);
    const tarde = horasDelDia.filter((h) => Number(h.slice(0, 2)) >= 12);

    function elegirHora(h: string) {
        setHora(h);
        if (fecha) onCambio?.({ fecha, hora: h });
    }

    return (
        <div>
            <input type="hidden" name="fecha" value={hora && fecha ? fecha : ""} />
            <input type="hidden" name="hora" value={hora ?? ""} />
            <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-3" role="radiogroup" aria-label="Día">
                {dias.map((d) => {
                    const p = partesFecha(d.fecha);
                    const activo = d.fecha === fecha;
                    return (
                        <button
                            key={d.fecha}
                            type="button"
                            role="radio"
                            aria-checked={activo}
                            aria-label={`${textoFecha(d.fecha)}, ${d.horas.length} turnos libres`}
                            onClick={() => { setFecha(d.fecha); setHora(null); onCambio?.(null); }}
                            className={`flex w-[4.4rem] shrink-0 snap-start flex-col items-center rounded-xl border-[1.5px] px-2 py-2.5 leading-tight transition-colors ${
                                activo ? "border-tinta bg-tinta text-papel" : "border-linea bg-white hover:border-pino"
                            }`}
                        >
                            <span className={`text-xs ${activo ? "text-papel/75" : "text-gris"}`}>{DIAS_CORTOS[p.dia]}</span>
                            <span className="font-display text-xl font-bold">{p.numero}</span>
                            <span className={`text-xs ${activo ? "text-papel/75" : "text-gris"}`}>{MESES[p.mes]}</span>
                            <span className={`mt-1 h-1 w-6 rounded-full ${d.horas.length > 4 ? "bg-pino-claro" : "bg-resaltador"}`} aria-hidden="true" />
                        </button>
                    );
                })}
            </div>
            {fecha && (
                <div className="mt-3 space-y-4">
                    {[["Mañana", manana], ["Tarde", tarde]].map(([titulo, horas]) =>
                        (horas as string[]).length > 0 ? (
                            <div key={titulo as string}>
                                <p className="mb-2 text-sm font-bold text-gris">{titulo as string}</p>
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                    {(horas as string[]).map((h) => (
                                        <button key={h} type="button" className="turno" aria-pressed={h === hora} onClick={() => elegirHora(h)}>
                                            {textoHora(h)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null,
                    )}
                </div>
            )}
        </div>
    );
}
