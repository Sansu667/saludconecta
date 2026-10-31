import Link from "next/link";
import { EncabezadoPagina, FilaCita, Vacio } from "@/componentes/panel/ui";
import { listarCitasPaciente } from "@/lib/modelos/citas";
import { requerirUsuario } from "@/lib/sesion";

export const metadata = { title: "Mis citas" };

export default async function CitasPaciente({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
    const usuario = await requerirUsuario("paciente");
    const { ver } = await searchParams;
    const tipo = ver === "historial" ? "historial" : "proximas";
    const citas = await listarCitasPaciente(usuario.id, tipo);

    return (
        <>
            <EncabezadoPagina titulo="Mis citas" acciones={<Link href="/panel/paciente/agendar" className="boton boton-primario">Agendar una cita</Link>} />
            <div className="mb-6 inline-flex rounded-full border-[1.5px] border-tinta p-1" role="tablist">
                <Link href="/panel/paciente/citas" role="tab" aria-selected={tipo === "proximas"} className={`rounded-full px-4 py-1.5 text-sm font-bold ${tipo === "proximas" ? "bg-tinta text-papel" : ""}`}>Próximas</Link>
                <Link href="/panel/paciente/citas?ver=historial" role="tab" aria-selected={tipo === "historial"} className={`rounded-full px-4 py-1.5 text-sm font-bold ${tipo === "historial" ? "bg-tinta text-papel" : ""}`}>Historial</Link>
            </div>
            {citas.length === 0 ? (
                <Vacio titulo={tipo === "proximas" ? "No tienes citas programadas" : "Aún no tienes historial"} accion={<Link href="/panel/paciente/agendar" className="boton boton-primario">Agendar una cita</Link>} />
            ) : (
                <ul className="space-y-3">
                    {citas.map((c) => <FilaCita key={c.id} cita={c} href={`/panel/paciente/cita/${c.id}`} mostrar="medico" />)}
                </ul>
            )}
        </>
    );
}
