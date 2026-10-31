import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Agendador } from "@/componentes/agenda/Agendador";
import { buscarConsultorioPorSlug } from "@/lib/modelos/consultorios";
import { listarMedicosAgendables, nombreMedico } from "@/lib/modelos/medicos";
import { nombreCompleto } from "@/lib/modelos/usuarios";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const dynamic = "force-dynamic";

type Parametros = { params: Promise<{ slug: string }>; searchParams: Promise<{ medico?: string }> };

export async function generateMetadata({ params }: Parametros): Promise<Metadata> {
    const { slug } = await params;
    const consultorio = await buscarConsultorioPorSlug(slug);
    if (!consultorio) return { title: "Consultorio no encontrado" };
    return {
        title: `Agenda tu cita en ${consultorio.nombre}`,
        description: consultorio.descripcion ?? `Reserva tu cita en ${consultorio.nombre}${consultorio.ciudad ? `, ${consultorio.ciudad}` : ""}.`,
    };
}

export default async function PaginaConsultorio({ params, searchParams }: Parametros) {
    const { slug } = await params;
    const { medico } = await searchParams;
    const consultorio = await buscarConsultorioPorSlug(slug);
    if (!consultorio) notFound();
    const [medicos, usuario] = await Promise.all([listarMedicosAgendables(consultorio.id), obtenerUsuarioActual()]);

    const etiquetasRol: Record<string, string> = { medico: "médico", admin: "administración" };

    return (
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
            {consultorio.es_demo && (
                <p className="mb-8 rounded-lg border-l-4 border-resaltador bg-resaltador-suave/60 px-4 py-3 text-[0.95rem]">
                    Este es el consultorio de demostración. Las citas funcionan de verdad, pero los datos se borran cada día: no escribas información real de salud.
                </p>
            )}
            <header className="border-b border-linea pb-8">
                <p className="text-sm font-bold text-pino">Agenda en línea</p>
                <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{consultorio.nombre}</h1>
                {consultorio.descripcion && <p className="mt-4 max-w-2xl text-lg text-gris">{consultorio.descripcion}</p>}
                <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[0.95rem]">
                    {(consultorio.direccion || consultorio.ciudad) && (
                        <p><span className="font-bold">Dirección:</span> {[consultorio.direccion, consultorio.ciudad].filter(Boolean).join(", ")}</p>
                    )}
                    {consultorio.telefono && (
                        <p><span className="font-bold">Teléfono:</span> <a href={`tel:${consultorio.telefono.replace(/[^0-9+]/g, "")}`} className="enlace">{consultorio.telefono}</a></p>
                    )}
                </div>
            </header>

            <div className="mt-10">
                {medicos.length === 0 ? (
                    <div className="hoja p-8">
                        <h2 className="text-2xl font-bold">Todavía no hay agenda abierta</h2>
                        <p className="mt-2 text-gris">Este consultorio está terminando de configurar sus horarios. Mientras tanto, puedes pedir tu cita por teléfono.</p>
                    </div>
                ) : (
                    <Agendador
                        medicos={medicos.map((m) => ({
                            id: m.id,
                            nombre: nombreMedico(m),
                            especialidad: m.especialidad,
                            duracion: m.duracion_cita_min,
                            biografia: m.biografia,
                        }))}
                        paciente={usuario?.rol === "paciente" ? nombreCompleto(usuario) : null}
                        rolPersonal={usuario && usuario.rol !== "paciente" ? etiquetasRol[usuario.rol] : null}
                        medicoInicial={medico ? Number(medico) || null : null}
                    />
                )}
            </div>
        </div>
    );
}
