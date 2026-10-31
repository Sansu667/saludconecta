"use client";

import { useActionState, useState } from "react";
import { cancelarCitaAccion, reprogramarCitaAccion } from "@/app/acciones/agenda";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { AvisoFormulario, BotonEnvio } from "@/componentes/formulario";
import { SelectorTurno, textoFecha, textoHora } from "./SelectorTurno";

interface Props {
    citaId: number;
    medicoId: number;
    /** Si el usuario es personal del consultorio, puede dejar un motivo para el paciente. */
    pedirMotivo?: boolean;
    bloqueadoPorPlazo?: string | null;
}

/** Cancelar o mover una cita, con confirmación explícita antes de cancelar. */
export function AccionesCita({ citaId, medicoId, pedirMotivo = false, bloqueadoPorPlazo = null }: Props) {
    const [abierto, setAbierto] = useState<"ninguno" | "mover" | "cancelar">("ninguno");
    const [estadoCancelar, accionCancelar] = useActionState(cancelarCitaAccion, ESTADO_INICIAL);
    const [estadoMover, accionMover] = useActionState(reprogramarCitaAccion, ESTADO_INICIAL);
    const [turno, setTurno] = useState<{ fecha: string; hora: string } | null>(null);

    if (estadoCancelar.exito) return <AvisoFormulario estado={estadoCancelar} />;
    if (bloqueadoPorPlazo) {
        return <p className="rounded-lg bg-menta px-4 py-3 text-[0.95rem]">{bloqueadoPorPlazo}</p>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <button type="button" className="boton boton-secundario" aria-expanded={abierto === "mover"} onClick={() => setAbierto(abierto === "mover" ? "ninguno" : "mover")}>
                    Cambiar fecha u hora
                </button>
                <button type="button" className="boton boton-peligro" aria-expanded={abierto === "cancelar"} onClick={() => setAbierto(abierto === "cancelar" ? "ninguno" : "cancelar")}>
                    Cancelar cita
                </button>
            </div>

            {abierto === "mover" && (
                <form action={accionMover} className="hoja space-y-4 p-5">
                    <input type="hidden" name="citaId" value={citaId} />
                    <p className="font-bold">Elige el nuevo turno con el mismo profesional</p>
                    <SelectorTurno medicoId={medicoId} excluirCitaId={citaId} onCambio={setTurno} />
                    <AvisoFormulario estado={estadoMover} />
                    <BotonEnvio disabled={!turno} pendiente="Moviendo…">
                        {turno ? `Mover al ${textoFecha(turno.fecha)}, ${textoHora(turno.hora)}` : "Elige un turno"}
                    </BotonEnvio>
                </form>
            )}

            {abierto === "cancelar" && (
                <form action={accionCancelar} className="space-y-4 rounded-2xl border-[1.5px] border-alerta bg-alerta-suave/50 p-5">
                    <input type="hidden" name="citaId" value={citaId} />
                    <p className="font-bold">¿Seguro que quieres cancelar esta cita?</p>
                    <p className="text-[0.95rem] text-gris">El turno quedará libre para otra persona.</p>
                    {pedirMotivo && (
                        <div>
                            <label htmlFor="motivoCancelacion" className="etiqueta">Motivo para el paciente <span className="font-normal text-gris">(opcional)</span></label>
                            <input id="motivoCancelacion" name="motivoCancelacion" className="campo" maxLength={200} placeholder="Por ejemplo: la doctora tuvo una urgencia" />
                        </div>
                    )}
                    <AvisoFormulario estado={estadoCancelar} />
                    <div className="flex flex-wrap gap-2">
                        <BotonEnvio className="boton bg-alerta text-white hover:bg-[#8f3322]" pendiente="Cancelando…">Sí, cancelar la cita</BotonEnvio>
                        <button type="button" className="boton boton-secundario" onClick={() => setAbierto("ninguno")}>No, mantenerla</button>
                    </div>
                </form>
            )}
        </div>
    );
}
