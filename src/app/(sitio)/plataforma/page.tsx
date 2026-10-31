import type { Metadata } from "next";
import { tieneAccesoPlataforma } from "@/app/acciones/sitio";
import { FormularioPlataforma } from "@/componentes/FormularioPlataforma";
import { listarProspectos, resumenPlataforma } from "@/lib/modelos/notificaciones";
import { formatearFechaCorta, formatearHora } from "@/lib/tiempo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Plataforma", robots: { index: false, follow: false } };

/** Panel privado del dueño de SaludConecta: cifras y consultorios que pidieron contacto. */
export default async function PaginaPlataforma() {
    if (!(await tieneAccesoPlataforma())) {
        return (
            <div className="mx-auto max-w-sm px-4 py-20">
                <h1 className="mb-6 text-3xl font-extrabold">Plataforma</h1>
                <FormularioPlataforma />
            </div>
        );
    }
    const [prospectos, resumen] = await Promise.all([listarProspectos(), resumenPlataforma()]);
    return (
        <div className="mx-auto max-w-5xl px-4 py-14">
            <h1 className="text-4xl font-extrabold">Plataforma</h1>
            <div className="mt-8 grid grid-cols-3 gap-3">
                {[["Consultorios", resumen.consultorios], ["Pacientes", resumen.pacientes], ["Citas", resumen.citas]].map(([e, v]) => (
                    <div key={e} className="hoja p-5"><p className="text-sm text-gris">{e}</p><p className="font-display text-4xl font-bold">{v}</p></div>
                ))}
            </div>
            <p className="mt-2 text-sm text-gris">Sin contar la demo.</p>
            <h2 className="mb-4 mt-12 text-2xl font-bold">Solicitudes de contacto</h2>
            {prospectos.length === 0 ? <p className="text-gris">Aún no hay solicitudes.</p> : (
                <ul className="space-y-3">
                    {prospectos.map((p) => (
                        <li key={p.id} className="hoja p-5">
                            <p className="font-bold">{p.consultorio} <span className="font-normal text-gris">({p.ciudad || "sin ciudad"}, {p.medicos} profesionales)</span></p>
                            <p className="mt-1">{p.nombre}, <a className="enlace" href={`mailto:${p.email}`}>{p.email}</a>{p.telefono ? `, ${p.telefono}` : ""}</p>
                            {p.mensaje && <p className="mt-2 text-gris">{p.mensaje}</p>}
                            <p className="mt-2 text-xs text-gris">{formatearFechaCorta(new Date(p.creado_en))}, {formatearHora(new Date(p.creado_en))}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
