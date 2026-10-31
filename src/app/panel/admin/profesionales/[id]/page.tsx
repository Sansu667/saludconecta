import Link from "next/link";
import { notFound } from "next/navigation";
import { SeccionHorario } from "@/componentes/agenda/SeccionHorario";
import { BotonRestablecer, FormularioPerfilProfesional } from "@/componentes/panel/FormulariosAdmin";
import { EncabezadoPagina } from "@/componentes/panel/ui";
import { listarEspecialidades } from "@/lib/modelos/consultorios";
import { buscarMedicoPorId } from "@/lib/modelos/medicos";
import { requerirUsuario } from "@/lib/sesion";

export const metadata = { title: "Profesional" };

export default async function ProfesionalAdmin({ params }: { params: Promise<{ id: string }> }) {
    const usuario = await requerirUsuario("admin");
    const { id } = await params;
    const medico = await buscarMedicoPorId(Number(id));
    if (!medico || medico.consultorio_id !== usuario.consultorio_id) notFound();
    const especialidades = await listarEspecialidades(usuario.consultorio_id!);

    return (
        <>
            <Link href="/panel/admin/profesionales" className="enlace text-sm">Volver a profesionales</Link>
            <div className="mt-4">
                <EncabezadoPagina
                    titulo={`${medico.nombres} ${medico.apellidos}`}
                    descripcion={`Entra con ${medico.email}.`}
                    acciones={<Link href={`/panel/admin/agenda?medico=${medico.id}`} className="boton boton-secundario boton-pequeno">Ver su agenda</Link>}
                />
            </div>
            <section className="hoja mb-10 p-6 sm:p-8" aria-labelledby="perfil">
                <h2 id="perfil" className="mb-5 text-2xl font-bold">Perfil</h2>
                <FormularioPerfilProfesional medico={medico} especialidades={especialidades} />
                <div className="mt-8 border-t border-linea pt-6">
                    <h3 className="mb-1 font-bold">¿Olvidó su contraseña?</h3>
                    <p className="mb-3 text-sm text-gris">Genera una temporal y compártela por un canal privado.</p>
                    <BotonRestablecer usuarioId={medico.usuario_id} />
                </div>
            </section>
            <SeccionHorario medico={medico} />
        </>
    );
}
