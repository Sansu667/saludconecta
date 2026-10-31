"use client";

import { useActionState, useState } from "react";
import { registrarAtencionAccion } from "@/app/acciones/agenda";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { AvisoFormulario, BotonEnvio } from "@/componentes/formulario";

interface Props {
    citaId: number;
    inicial: { estado: string; diagnostico: string; tratamiento: string; notas: string };
}

/** Registro de la consulta por parte del médico. */
export function FormularioAtencion({ citaId, inicial }: Props) {
    const [estado, accion] = useActionState(registrarAtencionAccion, ESTADO_INICIAL);
    const [asistio, setAsistio] = useState(inicial.estado !== "no_asistio");
    const valor = (campo: keyof Props["inicial"]) => estado.valores?.[campo] ?? inicial[campo];

    return (
        <form action={accion} className="space-y-5">
            <input type="hidden" name="citaId" value={citaId} />
            <fieldset>
                <legend className="etiqueta">¿El paciente asistió?</legend>
                <div className="mt-1 inline-flex rounded-full border-[1.5px] border-tinta p-1">
                    <label className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-bold ${asistio ? "bg-tinta text-papel" : ""}`}>
                        <input type="radio" name="estado" value="completada" checked={asistio} onChange={() => setAsistio(true)} className="sr-only" />
                        Sí, lo atendí
                    </label>
                    <label className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-bold ${!asistio ? "bg-tinta text-papel" : ""}`}>
                        <input type="radio" name="estado" value="no_asistio" checked={!asistio} onChange={() => setAsistio(false)} className="sr-only" />
                        No asistió
                    </label>
                </div>
            </fieldset>

            {asistio ? (
                <>
                    <div>
                        <label htmlFor="diagnostico" className="etiqueta">Diagnóstico o impresión diagnóstica</label>
                        <input id="diagnostico" name="diagnostico" className="campo" maxLength={1000} defaultValue={valor("diagnostico")}
                            aria-invalid={estado.campos?.diagnostico ? true : undefined} />
                        {estado.campos?.diagnostico && <p className="mt-1 text-sm font-bold text-alerta">{estado.campos.diagnostico}</p>}
                        <p className="ayuda">El paciente lo verá en su cuenta.</p>
                    </div>
                    <div>
                        <label htmlFor="tratamiento" className="etiqueta">Indicaciones y tratamiento</label>
                        <textarea id="tratamiento" name="tratamiento" rows={4} className="campo" maxLength={2000} defaultValue={valor("tratamiento")} />
                        <p className="ayuda">El paciente también lo verá.</p>
                    </div>
                </>
            ) : (
                <>
                    <input type="hidden" name="diagnostico" value="" />
                    <input type="hidden" name="tratamiento" value="" />
                </>
            )}
            <div>
                <label htmlFor="notas" className="etiqueta">Notas privadas <span className="font-normal text-gris">(solo las ve el personal del consultorio)</span></label>
                <textarea id="notas" name="notas" rows={3} className="campo" maxLength={3000} defaultValue={valor("notas")} />
            </div>
            <AvisoFormulario estado={estado} />
            <BotonEnvio pendiente="Guardando…">{asistio ? "Guardar consulta" : "Registrar inasistencia"}</BotonEnvio>
        </form>
    );
}
