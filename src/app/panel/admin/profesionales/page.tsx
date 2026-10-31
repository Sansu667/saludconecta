import Link from "next/link";
import { FormularioNuevoProfesional } from "@/componentes/panel/FormulariosAdmin";
import { EncabezadoPagina } from "@/componentes/panel/ui";
import { listarEspecialidades } from "@/lib/modelos/consultorios";
import { listarMedicos, obtenerDisponibilidad } from "@/lib/modelos/medicos";
import { requerirUsuario } from "@/lib/sesion";

export const metadata = { title: "Profesionales" };

export default async function ProfesionalesAdmin() {
    const usuario = await requerirUsuario("admin");
    const [medicos, especialidades] = await Promise.all([listarMedicos(usuario.consultorio_id!), listarEspecialidades(usuario.consultorio_id!)]);
    const horarios = await Promise.all(medicos.map((m) => obtenerDisponibilidad(m.id)));

    return (
        <>
            <EncabezadoPagina titulo="Profesionales" descripcion="Cada profesional entra con su propio correo, ve su agenda y registra sus consultas." />
            {medicos.length > 0 && (
                <ul className="mb-10 divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-white">
                    {medicos.map((m, i) => {
                        const franjas = horarios[i];
                        const dias = new Set(franjas.map((f) => f.dia_semana)).size;
                        return (
                            <li key={m.id}>
                                <Link href={`/panel/admin/profesionales/${m.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-menta/50">
                                    <span>
                                        <span className="block font-bold">{m.nombres} {m.apellidos}</span>
                                        <span className="text-sm text-gris">{m.especialidad ?? "Sin especialidad"}, consulta de {m.duracion_cita_min} min</span>
                                    </span>
                                    <span className="text-right text-sm">
                                        {!m.activo ? (
                                            <span className="rounded-full bg-[#ece6dc] px-2.5 py-0.5 font-bold text-[#6b5a3e]">Inactivo</span>
                                        ) : dias === 0 ? (
                                            <span className="rounded-full bg-alerta-suave px-2.5 py-0.5 font-bold text-alerta">Sin horario</span>
                                        ) : (
                                            <span className="text-gris">Atiende {dias} {dias === 1 ? "día" : "días"} a la semana</span>
                                        )}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
            <section className="hoja p-6 sm:p-8" aria-labelledby="nuevo">
                <h2 id="nuevo" className="mb-5 text-2xl font-bold">{medicos.length === 0 ? "Agrega a tu primer profesional" : "Agregar un profesional"}</h2>
                <FormularioNuevoProfesional especialidades={especialidades} />
            </section>
        </>
    );
}
