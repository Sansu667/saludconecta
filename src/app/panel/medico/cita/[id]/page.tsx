import { notFound } from "next/navigation";
import { DetalleCitaPersonal } from "@/componentes/agenda/DetalleCitaPersonal";
import { obtenerCita } from "@/lib/modelos/citas";
import { puedeVerCita } from "@/lib/permisos";
import { requerirUsuario } from "@/lib/sesion";
import { fechaBogota } from "@/lib/tiempo";

export const metadata = { title: "Cita" };

export default async function CitaMedico({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ movida?: string }> }) {
    const usuario = await requerirUsuario("medico");
    const { id } = await params;
    const { movida } = await searchParams;
    const cita = await obtenerCita(Number(id));
    if (!cita || !puedeVerCita(usuario, cita)) notFound();
    return (
        <DetalleCitaPersonal
            usuario={usuario}
            cita={cita}
            volver={`/panel/medico?fecha=${fechaBogota(cita.inicio)}`}
            aviso={movida ? "Cita movida. Le avisamos al paciente." : null}
        />
    );
}
