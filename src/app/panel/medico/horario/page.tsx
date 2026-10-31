import { notFound } from "next/navigation";
import { SeccionHorario } from "@/componentes/agenda/SeccionHorario";
import { EncabezadoPagina } from "@/componentes/panel/ui";
import { buscarMedicoPorUsuario } from "@/lib/modelos/medicos";
import { requerirUsuario } from "@/lib/sesion";

export const metadata = { title: "Horario" };

export default async function HorarioMedico() {
    const usuario = await requerirUsuario("medico");
    const medico = await buscarMedicoPorUsuario(usuario.id);
    if (!medico) notFound();
    return (
        <>
            <EncabezadoPagina
                titulo="Horario y ausencias"
                descripcion="Los pacientes solo ven los turnos que caen dentro de estas franjas. Los cambios aplican de inmediato."
            />
            <SeccionHorario medico={medico} />
        </>
    );
}
