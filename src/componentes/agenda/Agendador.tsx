"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { reservarCita, reservarCitaPaciente } from "@/app/acciones/agenda";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { AvisoFormulario, BotonEnvio, Campo } from "@/componentes/formulario";
import { CamposPaciente } from "@/componentes/auth/CamposPaciente";
import { SelectorTurno, textoFecha, textoHora } from "./SelectorTurno";

export interface MedicoAgendable {
    id: number;
    nombre: string;
    especialidad: string | null;
    duracion: number;
    biografia: string | null;
}

interface Props {
    medicos: MedicoAgendable[];
    /** Nombre del paciente con sesión abierta, o null si no hay sesión de paciente. */
    paciente: string | null;
    /** Rol de la sesión abierta cuando no es un paciente. */
    rolPersonal?: string | null;
    /** Desde el panel del paciente, la sesión ya existe y no se muestra el bloque de datos. */
    desdePanel?: boolean;
    medicoInicial?: number | null;
}

function iniciales(nombre: string): string {
    return nombre.replace(/^(Dra?\.)\s*/, "").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

/** Flujo de reserva: profesional, turno, datos del paciente y confirmación. */
export function Agendador({ medicos, paciente, rolPersonal = null, desdePanel = false, medicoInicial = null }: Props) {
    const [estado, accion] = useActionState(desdePanel ? reservarCitaPaciente : reservarCita, ESTADO_INICIAL);
    const especialidades = useMemo(
        () => Array.from(new Set(medicos.map((m) => m.especialidad ?? "Otros"))).sort(),
        [medicos],
    );
    const [especialidad, setEspecialidad] = useState<string | null>(null);
    const [medicoId, setMedicoId] = useState<number | null>(medicoInicial);
    const [turno, setTurno] = useState<{ fecha: string; hora: string } | null>(null);
    const [modo, setModo] = useState<"nuevo" | "existente">("nuevo");

    const visibles = especialidad ? medicos.filter((m) => (m.especialidad ?? "Otros") === especialidad) : medicos;
    const medico = medicos.find((m) => m.id === medicoId) ?? null;
    const conSesion = desdePanel || Boolean(paciente) || estado.valores?.sesion === "si";

    if (rolPersonal) {
        return (
            <div className="hoja p-6">
                <p className="font-bold">Tienes abierta una cuenta del consultorio ({rolPersonal}).</p>
                <p className="mt-2 text-gris">Para reservar como paciente, cierra sesión. Para agendar a nombre de un paciente, usa la agenda de recepción.</p>
                <Link href="/panel" className="boton boton-primario mt-4">Ir a mi panel</Link>
            </div>
        );
    }

    return (
        <form action={accion} className="space-y-10" noValidate>
            <input type="hidden" name="medicoId" value={medicoId ?? ""} />
            <input type="hidden" name="modo" value={modo} />

            <section aria-labelledby="paso-profesional">
                <h2 id="paso-profesional" className="text-2xl font-bold">¿Con quién quieres la cita?</h2>
                {especialidades.length > 1 && (
                    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por especialidad">
                        <button type="button" onClick={() => setEspecialidad(null)} aria-pressed={especialidad === null}
                            className={`rounded-full border-[1.5px] px-4 py-1.5 text-sm font-bold ${especialidad === null ? "border-tinta bg-tinta text-papel" : "border-linea bg-white hover:border-pino"}`}>
                            Todas
                        </button>
                        {especialidades.map((e) => (
                            <button key={e} type="button" onClick={() => setEspecialidad(e)} aria-pressed={especialidad === e}
                                className={`rounded-full border-[1.5px] px-4 py-1.5 text-sm font-bold ${especialidad === e ? "border-tinta bg-tinta text-papel" : "border-linea bg-white hover:border-pino"}`}>
                                {e}
                            </button>
                        ))}
                    </div>
                )}
                <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="paso-profesional">
                    {visibles.map((m) => {
                        const activo = m.id === medicoId;
                        return (
                            <button
                                key={m.id}
                                type="button"
                                role="radio"
                                aria-checked={activo}
                                onClick={() => { setMedicoId(m.id); setTurno(null); }}
                                className={`flex items-start gap-4 rounded-xl border-[1.5px] p-4 text-left transition-colors ${
                                    activo ? "border-tinta bg-resaltador-suave" : "border-linea bg-white hover:border-pino"
                                }`}
                            >
                                <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-full font-display font-bold ${activo ? "bg-tinta text-resaltador" : "bg-menta text-pino"}`}>
                                    {iniciales(m.nombre)}
                                </span>
                                <span>
                                    <span className="block font-bold">{m.nombre}</span>
                                    <span className="block text-sm text-gris">{m.especialidad ?? "Consulta"}, {m.duracion} min</span>
                                    {m.biografia && <span className="mt-1.5 block text-sm leading-snug text-gris">{m.biografia}</span>}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {medico && (
                <section aria-labelledby="paso-turno">
                    <h2 id="paso-turno" className="text-2xl font-bold">¿Qué día y a qué hora?</h2>
                    <div className="mt-4">
                        <SelectorTurno medicoId={medico.id} onCambio={setTurno} />
                    </div>
                    {estado.campos?.hora && <p className="mt-2 text-sm font-bold text-alerta">{estado.campos.hora}</p>}
                </section>
            )}

            {medico && turno && (
                <section aria-labelledby="paso-datos" className="space-y-6">
                    <h2 id="paso-datos" className="text-2xl font-bold">{conSesion ? "Último paso" : "Tus datos"}</h2>
                    <div>
                        <label htmlFor="motivo" className="etiqueta">Motivo de la consulta <span className="font-normal text-gris">(opcional)</span></label>
                        <textarea id="motivo" name="motivo" rows={2} maxLength={500} className="campo" defaultValue={estado.valores?.motivo}
                            placeholder="Por ejemplo: control de tensión, dolor de muela" />
                    </div>

                    {conSesion ? (
                        <p className="rounded-lg bg-menta px-4 py-3">
                            Reservas como <strong>{paciente ?? "tú"}</strong>.
                        </p>
                    ) : (
                        <div>
                            <div className="mb-5 inline-flex rounded-full border-[1.5px] border-tinta p-1" role="tablist" aria-label="Cuenta">
                                <button type="button" role="tab" aria-selected={modo === "nuevo"} onClick={() => setModo("nuevo")}
                                    className={`rounded-full px-4 py-1.5 text-sm font-bold ${modo === "nuevo" ? "bg-tinta text-papel" : ""}`}>
                                    Es mi primera vez
                                </button>
                                <button type="button" role="tab" aria-selected={modo === "existente"} onClick={() => setModo("existente")}
                                    className={`rounded-full px-4 py-1.5 text-sm font-bold ${modo === "existente" ? "bg-tinta text-papel" : ""}`}>
                                    Ya tengo cuenta
                                </button>
                            </div>
                            {modo === "nuevo" ? (
                                <CamposPaciente estado={estado} />
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Campo etiqueta="Correo" nombre="emailIngreso" type="email" autoComplete="email" estado={estado} />
                                    <Campo etiqueta="Contraseña" nombre="contrasenaIngreso" type="password" autoComplete="current-password" estado={estado} />
                                </div>
                            )}
                        </div>
                    )}

                    <AvisoFormulario estado={estado} />
                    <div className="sticky bottom-3 z-10 rounded-2xl border-2 border-tinta bg-white p-4 shadow-[0_10px_30px_-12px_rgba(14,47,44,0.4)] sm:flex sm:items-center sm:justify-between sm:gap-6">
                        <p className="leading-snug">
                            <span className="block font-bold">{medico.nombre}</span>
                            <span className="text-gris">{textoFecha(turno.fecha)}, {textoHora(turno.hora)}</span>
                        </p>
                        <BotonEnvio className="boton boton-resaltado mt-3 w-full border-[1.5px] border-tinta sm:mt-0 sm:w-auto" pendiente="Reservando…">
                            Confirmar cita
                        </BotonEnvio>
                    </div>
                </section>
            )}

            {!(medico && turno) && <AvisoFormulario estado={estado} />}
        </form>
    );
}
