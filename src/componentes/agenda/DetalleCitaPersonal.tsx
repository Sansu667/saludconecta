import Link from "next/link";
import { AccionesCita } from "./AccionesCita";
import { FormularioAtencion } from "./FormularioAtencion";
import { CuandoCita, DatoCita, InsigniaEstado } from "@/componentes/panel/ui";
import { historialPacienteEnConsultorio, type CitaDetalle } from "@/lib/modelos/citas";
import type { Usuario } from "@/lib/modelos/usuarios";
import { puedeRegistrarAtencion, rutaCita } from "@/lib/permisos";
import { calcularEdad, formatearFechaLarga, formatearHora } from "@/lib/tiempo";

/** Vista de una cita para el médico o la recepción. */
export async function DetalleCitaPersonal({ usuario, cita, volver, aviso }: { usuario: Usuario; cita: CitaDetalle; volver: string; aviso?: string | null }) {
    const historial = (await historialPacienteEnConsultorio(cita.paciente_id, cita.consultorio_id)).filter((c) => c.id !== cita.id);
    const edad = calcularEdad(cita.paciente_fecha_nac);
    const esFutura = cita.inicio.getTime() > Date.now();
    const puedeAtender = puedeRegistrarAtencion(usuario, cita) && cita.estado !== "cancelada" && cita.inicio.getTime() <= Date.now() + 15 * 60000;

    return (
        <>
            <Link href={volver} className="enlace text-sm">Volver a la agenda</Link>
            {aviso && <p role="status" className="mt-5 rounded-xl border-2 border-tinta bg-resaltador px-4 py-3 font-bold">{aviso}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold sm:text-4xl">{cita.paciente_nombres} {cita.paciente_apellidos}</h1>
                <InsigniaEstado estado={cita.estado} />
            </div>
            <p className="mt-2 text-gris">
                <CuandoCita cita={cita} />{usuario.rol === "admin" ? ` con ${cita.medico_nombres} ${cita.medico_apellidos}` : ""}
            </p>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
                <div className="space-y-8">
                    <section className="hoja p-6">
                        <h2 className="mb-1 text-sm font-bold text-gris">Motivo de consulta</h2>
                        <p className="text-lg">{cita.motivo ?? "El paciente no indicó el motivo."}</p>
                    </section>

                    {puedeAtender && (
                        <section aria-labelledby="atencion" className="hoja p-6">
                            <h2 id="atencion" className="mb-5 text-2xl font-bold">{cita.estado === "programada" ? "Registrar la consulta" : "Editar el registro"}</h2>
                            <FormularioAtencion
                                citaId={cita.id}
                                inicial={{ estado: cita.estado, diagnostico: cita.diagnostico ?? "", tratamiento: cita.tratamiento ?? "", notas: cita.notas_medico ?? "" }}
                            />
                        </section>
                    )}

                    {!puedeAtender && cita.estado === "completada" && (
                        <section className="space-y-3 rounded-2xl border-l-4 border-pino bg-white p-6">
                            <DatoCita etiqueta="Diagnóstico">{cita.diagnostico ?? "No registrado"}</DatoCita>
                            <DatoCita etiqueta="Indicaciones"><span className="whitespace-pre-line font-normal">{cita.tratamiento ?? "Sin indicaciones"}</span></DatoCita>
                            {cita.notas_medico && <DatoCita etiqueta="Notas privadas"><span className="whitespace-pre-line font-normal">{cita.notas_medico}</span></DatoCita>}
                        </section>
                    )}

                    {cita.estado === "programada" && esFutura && (
                        <section aria-labelledby="cambios">
                            <h2 id="cambios" className="mb-4 text-xl font-bold">Cambiar o cancelar</h2>
                            <AccionesCita citaId={cita.id} medicoId={cita.medico_id} pedirMotivo />
                        </section>
                    )}

                    <section aria-labelledby="historia">
                        <h2 id="historia" className="mb-4 text-xl font-bold">Consultas anteriores en este consultorio</h2>
                        {historial.length === 0 ? (
                            <p className="text-gris">Es la primera cita de este paciente aquí.</p>
                        ) : (
                            <ol className="relative space-y-5 border-l-2 border-linea pl-5">
                                {historial.map((h) => (
                                    <li key={h.id} className="relative">
                                        <span aria-hidden="true" className={`absolute -left-[1.6rem] top-1.5 size-3 rounded-full border-2 border-white ${h.estado === "completada" ? "bg-pino" : "bg-linea"}`} />
                                        <Link href={rutaCita(usuario.rol, h.id)} className="group block">
                                            <p className="text-sm text-gris">
                                                <span className="first-letter:uppercase">{formatearFechaLarga(h.inicio)}</span>, {formatearHora(h.inicio)}. {h.medico_nombres} {h.medico_apellidos}
                                            </p>
                                            <p className="font-bold group-hover:text-pino">
                                                {h.estado === "completada" ? h.diagnostico ?? "Atendida, sin diagnóstico" : h.estado === "programada" ? `Programada: ${h.motivo ?? "sin motivo"}` : h.estado === "cancelada" ? "Cancelada" : "No asistió"}
                                            </p>
                                            {h.estado === "completada" && h.tratamiento && <p className="line-clamp-2 text-sm text-gris">{h.tratamiento}</p>}
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>
                </div>

                <aside className="h-fit rounded-2xl bg-menta/70 p-6">
                    <h2 className="mb-4 font-sans text-sm font-bold text-gris">Paciente</h2>
                    <dl className="space-y-4">
                        <DatoCita etiqueta="Documento">{cita.paciente_tipo_doc ?? ""} {cita.paciente_num_doc ?? "No registrado"}</DatoCita>
                        <DatoCita etiqueta="Edad">{edad !== null ? `${edad} años` : "No registrada"}</DatoCita>
                        <DatoCita etiqueta="Celular">
                            {cita.paciente_telefono ? <a className="enlace" href={`tel:${cita.paciente_telefono.replace(/[^0-9+]/g, "")}`}>{cita.paciente_telefono}</a> : "No registrado"}
                        </DatoCita>
                        <DatoCita etiqueta="Correo"><span className="break-all">{cita.paciente_email}</span></DatoCita>
                        <DatoCita etiqueta="Citas en este consultorio">{historial.length + 1}</DatoCita>
                    </dl>
                </aside>
            </div>
        </>
    );
}
