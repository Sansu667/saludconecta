import Link from "next/link";
import { Agendador } from "@/componentes/agenda/Agendador";
import { EncabezadoPagina, Vacio } from "@/componentes/panel/ui";
import { buscarConsultorioPorSlug, listarConsultoriosConAgenda } from "@/lib/modelos/consultorios";
import { listarMedicosAgendables, nombreMedico } from "@/lib/modelos/medicos";
import { nombreCompleto } from "@/lib/modelos/usuarios";
import { requerirUsuario } from "@/lib/sesion";

export const metadata = { title: "Agendar cita" };

export default async function AgendarPaciente({ searchParams }: { searchParams: Promise<{ c?: string; q?: string }> }) {
    const usuario = await requerirUsuario("paciente");
    const { c, q } = await searchParams;
    const consultorio = c ? await buscarConsultorioPorSlug(c) : null;

    if (consultorio) {
        const medicos = await listarMedicosAgendables(consultorio.id);
        return (
            <>
                <EncabezadoPagina
                    titulo={consultorio.nombre}
                    descripcion={[consultorio.direccion, consultorio.ciudad].filter(Boolean).join(", ") || undefined}
                    acciones={<Link href="/panel/paciente/agendar" className="boton boton-secundario boton-pequeno">Elegir otro consultorio</Link>}
                />
                {medicos.length === 0 ? (
                    <Vacio titulo="Este consultorio aún no abrió su agenda">Puedes pedir tu cita por teléfono{consultorio.telefono ? ` al ${consultorio.telefono}` : ""}.</Vacio>
                ) : (
                    <Agendador
                        desdePanel
                        paciente={nombreCompleto(usuario)}
                        medicos={medicos.map((m) => ({ id: m.id, nombre: nombreMedico(m), especialidad: m.especialidad, duracion: m.duracion_cita_min, biografia: m.biografia }))}
                    />
                )}
            </>
        );
    }

    const consultorios = await listarConsultoriosConAgenda(q ?? "");
    return (
        <>
            <EncabezadoPagina titulo="¿Dónde quieres tu cita?" descripcion="Busca tu consultorio por nombre o ciudad. Si te enviaron un enlace, ábrelo directamente." />
            <form className="mb-8 flex gap-2" role="search">
                <label htmlFor="q" className="sr-only">Buscar consultorio</label>
                <input id="q" name="q" defaultValue={q} className="campo max-w-md" placeholder="Nombre del consultorio o ciudad" />
                <button type="submit" className="boton boton-primario">Buscar</button>
            </form>
            {consultorios.length === 0 ? (
                <Vacio titulo="No encontramos consultorios con ese nombre">Revisa cómo lo escribiste o pídele el enlace a tu consultorio.</Vacio>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                    {consultorios.map((co) => (
                        <li key={co.id}>
                            <Link href={`/panel/paciente/agendar?c=${co.slug}`} className="block h-full rounded-xl border border-linea bg-white p-5 transition-colors hover:border-pino">
                                <p className="font-display text-xl font-bold">{co.nombre}</p>
                                <p className="mt-1 text-sm text-gris">
                                    {co.ciudad ?? "Colombia"}, {co.medicos} {co.medicos === 1 ? "profesional" : "profesionales"}
                                    {co.es_demo ? ", consultorio de demostración" : ""}
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
