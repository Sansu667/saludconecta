import Link from "next/link";
import { notFound } from "next/navigation";
import { AccionesCita } from "@/componentes/agenda/AccionesCita";
import { CuandoCita, DatoCita, InsigniaEstado } from "@/componentes/panel/ui";
import { HORAS_MINIMAS_CAMBIO_PACIENTE, obtenerCita, pacientePuedeCambiar } from "@/lib/modelos/citas";
import { puedeVerCita } from "@/lib/permisos";
import { requerirUsuario } from "@/lib/sesion";

export const metadata = { title: "Detalle de la cita" };

export default async function CitaPaciente({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nueva?: string; movida?: string; cancelada?: string }> }) {
    const usuario = await requerirUsuario("paciente");
    const { id } = await params;
    const { nueva, movida, cancelada } = await searchParams;
    const cita = await obtenerCita(Number(id));
    if (!cita || !puedeVerCita(usuario, cita)) notFound();

    const programada = cita.estado === "programada" && cita.fin.getTime() > Date.now();
    const puedeCambiar = pacientePuedeCambiar(cita);

    return (
        <>
            <Link href="/panel/paciente/citas" className="enlace text-sm">Volver a mis citas</Link>

            {(nueva || movida) && programada && (
                <div role="status" className="mt-5 rounded-2xl border-2 border-tinta bg-resaltador p-5">
                    <p className="font-display text-2xl font-bold">{nueva ? "Tu cita quedó reservada" : "Movimos tu cita"}</p>
                    <p className="mt-1">Te recordaremos un día antes. Si no puedes ir, cancélala aquí para liberar el turno.</p>
                </div>
            )}

            {cancelada && cita.estado === "cancelada" && (
                <p role="status" className="mt-5 rounded-2xl border-l-4 border-pino bg-menta p-4 font-bold">
                    Cancelaste la cita y el turno quedó libre para otra persona.
                </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold sm:text-4xl">Cita con {cita.medico_nombres} {cita.medico_apellidos}</h1>
                <InsigniaEstado estado={cita.estado} />
            </div>

            <dl className="hoja mt-6 grid gap-5 p-6 sm:grid-cols-2">
                <DatoCita etiqueta="Cuándo"><CuandoCita cita={cita} /></DatoCita>
                <DatoCita etiqueta="Especialidad">{cita.especialidad ?? "Consulta"}</DatoCita>
                <DatoCita etiqueta="Dónde">
                    {cita.consultorio_nombre}
                    {cita.consultorio_direccion && <span className="block font-normal text-gris">{cita.consultorio_direccion}</span>}
                </DatoCita>
                <DatoCita etiqueta="Teléfono del consultorio">{cita.consultorio_telefono ?? "No registrado"}</DatoCita>
                <div className="sm:col-span-2"><DatoCita etiqueta="Motivo">{cita.motivo ?? "Sin motivo indicado"}</DatoCita></div>
            </dl>

            {cita.estado === "completada" && (
                <section className="mt-8" aria-labelledby="resultado">
                    <h2 id="resultado" className="text-2xl font-bold">Lo que dejó registrado tu médico</h2>
                    <div className="mt-4 space-y-4 rounded-2xl border-l-4 border-pino bg-white p-6">
                        <div>
                            <p className="text-sm text-gris">Diagnóstico</p>
                            <p className="mt-1 font-bold">{cita.diagnostico ?? "No registrado"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gris">Indicaciones y tratamiento</p>
                            <p className="mt-1 whitespace-pre-line">{cita.tratamiento ?? "Sin indicaciones registradas"}</p>
                        </div>
                    </div>
                </section>
            )}

            {programada && (
                <section className="mt-8" aria-labelledby="cambios">
                    <h2 id="cambios" className="mb-4 text-2xl font-bold">¿Necesitas cambiarla?</h2>
                    <AccionesCita
                        citaId={cita.id}
                        medicoId={cita.medico_id}
                        bloqueadoPorPlazo={puedeCambiar ? null : `Faltan menos de ${HORAS_MINIMAS_CAMBIO_PACIENTE} horas para la cita. Si no puedes asistir, llama al consultorio${cita.consultorio_telefono ? ` al ${cita.consultorio_telefono}` : ""}.`}
                    />
                </section>
            )}

            {cita.estado === "cancelada" && (
                <p className="mt-8">
                    <Link href={`/panel/paciente/agendar?c=${cita.consultorio_slug}`} className="boton boton-primario">Reservar otro turno</Link>
                </p>
            )}
        </>
    );
}
