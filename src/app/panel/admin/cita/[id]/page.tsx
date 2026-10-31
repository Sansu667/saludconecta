import { notFound } from "next/navigation";
import { DetalleCitaPersonal } from "@/componentes/agenda/DetalleCitaPersonal";
import { obtenerCita } from "@/lib/modelos/citas";
import { puedeVerCita } from "@/lib/permisos";
import { requerirUsuario } from "@/lib/sesion";
import { fechaBogota } from "@/lib/tiempo";

export const metadata = { title: "Cita" };

export default async function CitaAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ movida?: string; nueva?: string; cancelada?: string }> }) {
    const usuario = await requerirUsuario("admin");
    const { id } = await params;
    const { movida, nueva, cancelada } = await searchParams;
    const cita = await obtenerCita(Number(id));
    if (!cita || !puedeVerCita(usuario, cita)) notFound();
    return (
        <DetalleCitaPersonal
            usuario={usuario}
            cita={cita}
            volver={`/panel/admin/agenda?fecha=${fechaBogota(cita.inicio)}&medico=${cita.medico_id}`}
            aviso={cancelada ? "Cita cancelada. Les avisamos al paciente y al médico." : nueva ? "Cita agendada. El paciente y el médico ya tienen el aviso." : movida ? "Cita movida. Les avisamos al paciente y al médico." : null}
        />
    );
}
