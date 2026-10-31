"use client";

import { useActionState, useState } from "react";
import { agregarAusencia, guardarHorario, quitarAusencia } from "@/app/acciones/personal";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { AvisoFormulario, BotonEnvio } from "@/componentes/formulario";

const DIAS = [
    { dia: 1, nombre: "Lunes" },
    { dia: 2, nombre: "Martes" },
    { dia: 3, nombre: "Miércoles" },
    { dia: 4, nombre: "Jueves" },
    { dia: 5, nombre: "Viernes" },
    { dia: 6, nombre: "Sábado" },
    { dia: 0, nombre: "Domingo" },
];

interface Franja { dia: number; inicio: string; fin: string }

/** Editor del horario semanal: franjas por día que se pueden añadir y quitar. */
export function EditorHorario({ medicoId, inicial, duracion }: { medicoId: number; inicial: Franja[]; duracion: number }) {
    const [franjas, setFranjas] = useState<Franja[]>(inicial);
    const [estado, accion] = useActionState(guardarHorario, ESTADO_INICIAL);

    function actualizar(indice: number, cambio: Partial<Franja>) {
        setFranjas((actual) => actual.map((f, i) => (i === indice ? { ...f, ...cambio } : f)));
    }
    function agregar(dia: number) {
        const delDia = franjas.filter((f) => f.dia === dia);
        const sugerida = delDia.length === 0 ? { inicio: "08:00", fin: "12:00" } : { inicio: "14:00", fin: "18:00" };
        setFranjas((actual) => [...actual, { dia, ...sugerida }]);
    }
    function quitar(indice: number) {
        setFranjas((actual) => actual.filter((_, i) => i !== indice));
    }
    function copiarLunesATodos() {
        const lunes = franjas.filter((f) => f.dia === 1);
        setFranjas([...lunes, ...[2, 3, 4, 5].flatMap((dia) => lunes.map((f) => ({ ...f, dia })))]);
    }

    function turnosDe(f: Franja): number {
        const [hi, mi] = f.inicio.split(":").map(Number);
        const [hf, mf] = f.fin.split(":").map(Number);
        return Math.max(0, Math.floor((hf * 60 + mf - (hi * 60 + mi)) / duracion));
    }
    const totalSemana = franjas.reduce((suma, f) => suma + turnosDe(f), 0);

    return (
        <form action={accion} className="space-y-5">
            <input type="hidden" name="medicoId" value={medicoId} />
            <input type="hidden" name="bloques" value={JSON.stringify(franjas)} />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-gris">Consultas de {duracion} minutos. <strong className="text-tinta">{totalSemana} turnos por semana</strong> con este horario.</p>
                {franjas.some((f) => f.dia === 1) && (
                    <button type="button" onClick={copiarLunesATodos} className="enlace text-sm">Copiar el lunes de martes a viernes</button>
                )}
            </div>
            <ul className="divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-white">
                {DIAS.map(({ dia, nombre }) => {
                    const delDia = franjas.map((f, i) => ({ f, i })).filter(({ f }) => f.dia === dia);
                    return (
                        <li key={dia} className="grid gap-3 px-4 py-4 sm:grid-cols-[8rem_1fr] sm:items-start sm:px-5">
                            <p className={`pt-2 font-bold ${delDia.length === 0 ? "text-gris-suave" : ""}`}>{nombre}</p>
                            <div className="space-y-2">
                                {delDia.length === 0 && <p className="pt-2 text-sm text-gris">No atiende</p>}
                                {delDia.map(({ f, i }) => (
                                    <div key={i} className="flex flex-wrap items-center gap-2">
                                        <label className="sr-only" htmlFor={`ini-${i}`}>Desde</label>
                                        <input id={`ini-${i}`} type="time" step={300} value={f.inicio} onChange={(e) => actualizar(i, { inicio: e.target.value })} className="campo w-[8.2rem] py-2" />
                                        <span className="text-gris">a</span>
                                        <label className="sr-only" htmlFor={`fin-${i}`}>Hasta</label>
                                        <input id={`fin-${i}`} type="time" step={300} value={f.fin} onChange={(e) => actualizar(i, { fin: e.target.value })} className="campo w-[8.2rem] py-2" />
                                        <span className="text-sm text-gris">{turnosDe(f)} turnos</span>
                                        <button type="button" onClick={() => quitar(i)} className="ml-auto text-sm font-bold text-alerta underline underline-offset-2 sm:ml-2" aria-label={`Quitar franja del ${nombre.toLowerCase()}`}>Quitar</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => agregar(dia)} className="text-sm font-bold text-pino underline underline-offset-2">
                                    {delDia.length === 0 ? "Agregar horario" : "Agregar otra franja"}
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <AvisoFormulario estado={estado} />
            <BotonEnvio pendiente="Guardando…">Guardar horario</BotonEnvio>
        </form>
    );
}

export function FormularioAusencia({ medicoId, hoy }: { medicoId: number; hoy: string }) {
    const [estado, accion] = useActionState(agregarAusencia, ESTADO_INICIAL);
    return (
        <form action={accion} className="space-y-4">
            <input type="hidden" name="medicoId" value={medicoId} />
            <div className="grid gap-4 sm:grid-cols-3">
                <div>
                    <label htmlFor="desde" className="etiqueta">Desde</label>
                    <input id="desde" name="desde" type="date" min={hoy} className="campo" required />
                </div>
                <div>
                    <label htmlFor="hasta" className="etiqueta">Hasta</label>
                    <input id="hasta" name="hasta" type="date" min={hoy} className="campo" />
                </div>
                <div>
                    <label htmlFor="motivo" className="etiqueta">Motivo <span className="font-normal text-gris">(opcional)</span></label>
                    <input id="motivo" name="motivo" className="campo" maxLength={150} placeholder="Vacaciones" />
                </div>
            </div>
            <p className="ayuda">Si hay citas esos días, se cancelan y cada paciente recibe un aviso para reprogramar.</p>
            <AvisoFormulario estado={estado} />
            <BotonEnvio className="boton boton-secundario" pendiente="Guardando…">Registrar ausencia</BotonEnvio>
        </form>
    );
}

export function BotonQuitarAusencia({ medicoId, bloqueoId }: { medicoId: number; bloqueoId: number }) {
    return (
        <form action={quitarAusencia}>
            <input type="hidden" name="medicoId" value={medicoId} />
            <input type="hidden" name="bloqueoId" value={bloqueoId} />
            <button type="submit" className="text-sm font-bold text-alerta underline underline-offset-2">Quitar</button>
        </form>
    );
}
