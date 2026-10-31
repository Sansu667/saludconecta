"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const HORAS = ["8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30"];

/** Turnos ya tomados en la vitrina, como [día 0-4, fila]. Fijos para que no salte al cargar. */
const TOMADOS: Array<[number, number, string]> = [
    [0, 0, "J. Henao"], [0, 1, "L. Marín"], [0, 3, "V. Cardona"], [0, 4, "D. Arbeláez"], [0, 6, "M. Zapata"],
    [1, 0, "I. Quintero"], [1, 2, "S. Restrepo"], [1, 5, "A. Toro"], [1, 6, "C. Ruiz"],
    [2, 1, "P. Lopera"], [2, 2, "M. Gómez"], [2, 3, "J. Duque"], [2, 7, "L. Ochoa"],
    [3, 0, "R. Gil"], [3, 4, "E. Mejía"], [3, 5, "N. Vélez"],
    [4, 2, "F. Ríos"], [4, 3, "K. Pineda"], [4, 6, "T. Salazar"], [4, 7, "G. Arango"],
];

export interface DiaVitrina {
    corto: string;
    numero: number;
    largo: string;
}

/**
 * Vitrina interactiva del hero: una semana de agenda real donde el visitante
 * toca un turno libre y ve lo que vería su paciente.
 */
export function AgendaViva({ dias }: { dias: DiaVitrina[] }) {
    const [elegido, setElegido] = useState<[number, number] | null>(null);
    const tomados = useMemo(() => new Map(TOMADOS.map(([d, h, n]) => [`${d}-${h}`, n])), []);

    const confirmacion = elegido
        ? `${dias[elegido[0]].largo}, ${HORAS[elegido[1]]} a. m.`
        : null;

    return (
        <div className="relative">
            <div className="hoja overflow-hidden shadow-[0_24px_60px_-28px_rgba(14,47,44,0.45)]">
                <div className="flex items-center justify-between gap-3 border-b border-linea bg-menta/60 px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                        <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-pino font-display text-lg font-bold text-papel">LM</span>
                        <div className="leading-tight">
                            <p className="font-bold">Dra. Laura Méndez</p>
                            <p className="text-sm text-gris">Medicina general, consulta de 30 min</p>
                        </div>
                    </div>
                    <p className="hidden text-sm text-gris sm:block">Centro Médico Aurora</p>
                </div>

                <div className="px-3 pb-4 pt-3 sm:px-5" role="group" aria-label="Turnos de la próxima semana">
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                        {dias.map((dia, i) => (
                            <p key={i} className="pb-1 text-center leading-tight">
                                <span className="block text-xs text-gris">{dia.corto}</span>
                                <span className="font-display text-lg font-bold">{dia.numero}</span>
                            </p>
                        ))}
                        {HORAS.map((hora, fila) =>
                            dias.map((_, columna) => {
                                const clave = `${columna}-${fila}`;
                                const paciente = tomados.get(clave);
                                const esElegido = elegido?.[0] === columna && elegido?.[1] === fila;
                                if (paciente) {
                                    return (
                                        <div
                                            key={clave}
                                            className="rounded-[6px] bg-resaltador-suave px-1 py-[0.42rem] text-center text-[0.7rem] leading-tight text-tinta/70 sm:text-xs"
                                            title={`${hora} ocupado`}
                                        >
                                            <span className="hidden sm:inline">{paciente}</span>
                                            <span className="sm:hidden">{hora}</span>
                                        </div>
                                    );
                                }
                                return (
                                    <button
                                        key={clave}
                                        type="button"
                                        aria-pressed={esElegido}
                                        aria-label={`Reservar ${hora}`}
                                        onClick={() => setElegido([columna, fila])}
                                        className="turno text-[0.78rem] sm:text-sm"
                                    >
                                        {esElegido ? "Tú" : hora}
                                    </button>
                                );
                            }),
                        )}
                    </div>
                </div>

                <div className="border-t border-linea px-4 py-4 sm:px-5" aria-live="polite">
                    {confirmacion ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-[0.95rem]">
                                <span className="font-bold">Cita reservada:</span> {confirmacion}. El recordatorio sale un día antes.
                            </p>
                            <Link href="/c/demo" className="boton boton-resaltado boton-pequeno shrink-0">Hacerlo de verdad en la demo</Link>
                        </div>
                    ) : (
                        <p className="text-[0.95rem] text-gris">Toca un turno libre. Así reserva tu paciente, sin llamar.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
