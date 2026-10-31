import { quitarEspecialidad } from "@/app/acciones/admin";
import { CopiarEnlace } from "@/componentes/panel/CopiarEnlace";
import { BotonRestablecer, FormularioConsultorio, FormularioEspecialidad } from "@/componentes/panel/FormulariosAdmin";
import { EncabezadoPagina } from "@/componentes/panel/ui";
import { buscarConsultorioPorId, listarEspecialidades } from "@/lib/modelos/consultorios";
import { buscarPacientes, nombreCompleto } from "@/lib/modelos/usuarios";
import { requerirUsuario } from "@/lib/sesion";

export const metadata = { title: "Consultorio" };

const NOMBRES_PLAN: Record<string, string> = { basico: "Básico", consultorio: "Consultorio", clinica: "Clínica" };

export default async function ConsultorioAdmin({ searchParams }: { searchParams: Promise<{ doc?: string }> }) {
    const usuario = await requerirUsuario("admin");
    const { doc } = await searchParams;
    const [consultorio, especialidades] = await Promise.all([
        buscarConsultorioPorId(usuario.consultorio_id!),
        listarEspecialidades(usuario.consultorio_id!),
    ]);
    if (!consultorio) return null;
    const pacientes = doc && doc.trim().length >= 4 ? (await buscarPacientes(consultorio.id, doc)).filter((p) => p.num_doc === doc.trim() || p.email === doc.trim().toLowerCase()) : [];

    return (
        <>
            <EncabezadoPagina titulo="Consultorio" descripcion={`Plan ${NOMBRES_PLAN[consultorio.plan] ?? consultorio.plan}.`} />

            <section className="mb-8 rounded-2xl bg-tinta p-6 text-papel">
                <h2 className="font-sans text-sm font-bold text-papel/75">Enlace de reservas</h2>
                <div className="mt-3"><CopiarEnlace ruta={`/c/${consultorio.slug}`} /></div>
            </section>

            <section className="hoja mb-8 p-6 sm:p-8" aria-labelledby="datos">
                <h2 id="datos" className="mb-5 text-2xl font-bold">Datos que ven los pacientes</h2>
                <FormularioConsultorio consultorio={consultorio} />
            </section>

            <section className="hoja mb-8 p-6 sm:p-8" aria-labelledby="especialidades">
                <h2 id="especialidades" className="mb-2 text-2xl font-bold">Especialidades</h2>
                <p className="mb-5 text-gris">Los pacientes filtran por especialidad al reservar.</p>
                {especialidades.length > 0 && (
                    <ul className="mb-6 flex flex-wrap gap-2">
                        {especialidades.map((e) => (
                            <li key={e.id} className="flex items-center gap-2 rounded-full border border-linea bg-papel py-1.5 pl-4 pr-2">
                                <span className="font-bold">{e.nombre}</span>
                                <span className="text-sm text-gris">{e.medicos}</span>
                                {e.medicos === 0 && (
                                    <form action={quitarEspecialidad}>
                                        <input type="hidden" name="especialidadId" value={e.id} />
                                        <button type="submit" className="grid size-6 place-items-center rounded-full text-gris hover:bg-alerta-suave hover:text-alerta" aria-label={`Quitar ${e.nombre}`}>×</button>
                                    </form>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
                <FormularioEspecialidad />
            </section>

            <section className="hoja p-6 sm:p-8" aria-labelledby="pacientes">
                <h2 id="pacientes" className="mb-2 text-2xl font-bold">Contraseña de un paciente</h2>
                <p className="mb-5 text-gris">Si un paciente que se atiende aquí olvidó su contraseña, búscalo por documento o correo exacto y asígnale una temporal.</p>
                <form className="flex flex-col gap-2 sm:flex-row">
                    <label htmlFor="doc" className="sr-only">Documento o correo</label>
                    <input id="doc" name="doc" defaultValue={doc} className="campo sm:max-w-sm" placeholder="Documento o correo" />
                    <button type="submit" className="boton boton-secundario">Buscar</button>
                </form>
                {doc && (
                    pacientes.length === 0 ? (
                        <p className="mt-4 text-gris">No hay un paciente con ese documento o correo.</p>
                    ) : (
                        <ul className="mt-5 space-y-4">
                            {pacientes.map((p) => (
                                <li key={p.id} className="rounded-xl border border-linea p-4">
                                    <p className="font-bold">{nombreCompleto(p)}</p>
                                    <p className="mb-3 text-sm text-gris">{p.tipo_doc} {p.num_doc}, {p.email}</p>
                                    <BotonRestablecer usuarioId={p.id} />
                                </li>
                            ))}
                        </ul>
                    )
                )}
            </section>
        </>
    );
}
