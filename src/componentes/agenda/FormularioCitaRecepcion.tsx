"use client";

import { useActionState, useState } from "react";
import { agendarPorRecepcion } from "@/app/acciones/admin";
import { ESTADO_INICIAL, TIPOS_DOCUMENTO } from "@/lib/formularios";
import { AvisoFormulario, BotonEnvio, Campo, Selector } from "@/componentes/formulario";
import { SelectorTurno, textoFecha, textoHora } from "./SelectorTurno";

interface Props {
    paciente: { id: number; nombre: string; documento: string } | null;
    medicos: Array<{ id: number; nombre: string; especialidad: string | null }>;
    medicoInicial: number | null;
    fechaInicial: string | null;
    horaInicial: string | null;
}

/** Agendamiento desde recepción, para pacientes que llaman o llegan en persona. */
export function FormularioCitaRecepcion({ paciente, medicos, medicoInicial, fechaInicial, horaInicial }: Props) {
    const [estado, accion] = useActionState(agendarPorRecepcion, ESTADO_INICIAL);
    const [medicoId, setMedicoId] = useState<number | null>(medicoInicial ?? medicos[0]?.id ?? null);
    const [turno, setTurno] = useState<{ fecha: string; hora: string } | null>(null);

    return (
        <form action={accion} className="space-y-8" noValidate>
            <input type="hidden" name="pacienteId" value={paciente?.id ?? ""} />
            <input type="hidden" name="medicoId" value={medicoId ?? ""} />

            {!paciente && (
                <fieldset className="hoja space-y-4 p-6">
                    <legend className="sr-only">Datos del paciente nuevo</legend>
                    <h2 className="text-xl font-bold">Datos del paciente</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Campo etiqueta="Nombres" nombre="nombres" estado={estado} />
                        <Campo etiqueta="Apellidos" nombre="apellidos" estado={estado} />
                        <Selector etiqueta="Tipo de documento" nombre="tipoDoc" estado={estado} opciones={TIPOS_DOCUMENTO} />
                        <Campo etiqueta="Número de documento" nombre="numDoc" estado={estado} />
                        <Campo etiqueta="Celular" nombre="telefono" type="tel" estado={estado} />
                        <Campo etiqueta="Correo" nombre="email" type="email" estado={estado} ayuda="Opcional. Con correo, el paciente podrá entrar a ver su cita." />
                    </div>
                    <label className="flex items-start gap-3 text-[0.95rem]">
                        <input type="checkbox" name="autoriza" value="si" defaultChecked={estado.valores?.autoriza === "si"} className="mt-1 size-5 shrink-0 accent-[var(--color-pino)]" />
                        <span>El paciente autorizó el tratamiento de sus datos personales y de salud para gestionar sus citas.</span>
                    </label>
                    {estado.campos?.autoriza && <p className="text-sm font-bold text-alerta">{estado.campos.autoriza}</p>}
                </fieldset>
            )}

            <section className="space-y-4">
                <h2 className="text-xl font-bold">Profesional y turno</h2>
                <div className="max-w-md">
                    <label htmlFor="selMedico" className="etiqueta">Profesional</label>
                    <select id="selMedico" className="campo" value={medicoId ?? ""} onChange={(e) => { setMedicoId(Number(e.target.value)); setTurno(null); }}>
                        {medicos.map((m) => <option key={m.id} value={m.id}>{m.nombre}{m.especialidad ? `, ${m.especialidad}` : ""}</option>)}
                    </select>
                </div>
                <SelectorTurno
                    medicoId={medicoId}
                    onCambio={setTurno}
                    fechaInicial={medicoId === medicoInicial ? fechaInicial : null}
                    horaInicial={medicoId === medicoInicial ? horaInicial : null}
                />
            </section>

            <div>
                <label htmlFor="motivo" className="etiqueta">Motivo de la consulta <span className="font-normal text-gris">(opcional)</span></label>
                <textarea id="motivo" name="motivo" rows={2} className="campo" maxLength={500} defaultValue={estado.valores?.motivo} />
            </div>

            <AvisoFormulario estado={estado} />
            <div className="sticky bottom-20 z-10 rounded-2xl border-2 border-tinta bg-white p-4 shadow-[0_10px_30px_-12px_rgba(14,47,44,0.4)] sm:flex sm:items-center sm:justify-between sm:gap-6 lg:bottom-4">
                <p className="leading-snug">
                    <span className="block font-bold">{paciente ? paciente.nombre : "Paciente nuevo"}</span>
                    <span className="text-gris">{turno ? `${textoFecha(turno.fecha)}, ${textoHora(turno.hora)}` : "Elige un turno"}</span>
                </p>
                <BotonEnvio disabled={!turno} className="boton boton-resaltado mt-3 w-full border-[1.5px] border-tinta sm:mt-0 sm:w-auto" pendiente="Agendando…">
                    Agendar cita
                </BotonEnvio>
            </div>
        </form>
    );
}
