import Link from "next/link";
import { HojaDelDia } from "@/componentes/agenda/HojaDelDia";
import { TiraSemana, lunesDe } from "@/componentes/agenda/TiraSemana";
import { EncabezadoPagina, Vacio } from "@/componentes/panel/ui";
import { listarCitasMedico } from "@/lib/modelos/citas";
import { listarBloqueos, listarMedicos, obtenerDisponibilidad } from "@/lib/modelos/medicos";
import { requerirUsuario } from "@/lib/sesion";
import { esFechaValida, fechaBogota, hoyBogota, proximoDiaCon, sumarDias } from "@/lib/tiempo";

export const metadata = { title: "Agenda del día" };

export default async function AgendaAdmin({ searchParams }: { searchParams: Promise<{ fecha?: string; medico?: string }> }) {
    const usuario = await requerirUsuario("admin");
    const { fecha: fechaParam, medico: medicoParam } = await searchParams;
    const medicos = (await listarMedicos(usuario.consultorio_id!)).filter((m) => m.activo);

    if (medicos.length === 0) {
        return (
            <>
                <EncabezadoPagina titulo="Agenda del día" />
                <Vacio titulo="Aún no hay profesionales" accion={<Link href="/panel/admin/profesionales" className="boton boton-primario">Agregar un profesional</Link>}>
                    Crea la cuenta de cada profesional y su horario para ver aquí su agenda.
                </Vacio>
            </>
        );
    }

    const medico = medicos.find((m) => m.id === Number(medicoParam)) ?? medicos[0];
    const horario = await obtenerDisponibilidad(medico.id);
    const fecha = fechaParam && esFechaValida(fechaParam) ? fechaParam : proximoDiaCon(hoyBogota(), horario.map((h) => h.dia_semana));
    const lunes = lunesDe(fecha);
    const [citasSemana, bloqueos] = await Promise.all([
        listarCitasMedico(medico.id, lunes, sumarDias(lunes, 6)),
        listarBloqueos(medico.id, fecha),
    ]);
    const conteos: Record<string, number> = {};
    for (const c of citasSemana) {
        if (c.estado === "cancelada") continue;
        const f = fechaBogota(c.inicio);
        conteos[f] = (conteos[f] ?? 0) + 1;
    }
    const bloqueo = bloqueos.find((b) => b.fecha === fecha);

    return (
        <>
            <EncabezadoPagina
                titulo="Agenda del día"
                acciones={<Link href={`/panel/admin/agenda/nueva?medico=${medico.id}`} className="boton boton-primario">Agendar una cita</Link>}
            />
            <nav aria-label="Profesional" className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-2">
                {medicos.map((m) => (
                    <Link
                        key={m.id}
                        href={`/panel/admin/agenda?medico=${m.id}${fechaParam ? `&fecha=${fecha}` : ""}`}
                        aria-current={m.id === medico.id ? "true" : undefined}
                        className={`shrink-0 rounded-full border-[1.5px] px-4 py-2 text-sm font-bold ${m.id === medico.id ? "border-tinta bg-tinta text-papel" : "border-linea bg-white hover:border-pino"}`}
                    >
                        {m.nombres} {m.apellidos.split(" ")[0]}
                        <span className={`ml-1.5 font-normal ${m.id === medico.id ? "text-papel/70" : "text-gris"}`}>{m.especialidad ?? ""}</span>
                    </Link>
                ))}
            </nav>
            <TiraSemana fecha={fecha} conteos={conteos} ruta={(f) => `/panel/admin/agenda?medico=${medico.id}&fecha=${f}`} />
            <HojaDelDia
                fecha={fecha}
                citas={citasSemana.filter((c) => fechaBogota(c.inicio) === fecha)}
                horario={horario}
                duracion={medico.duracion_cita_min}
                bloqueado={bloqueo ? bloqueo.motivo ?? "-" : null}
                rutaCita={(id) => `/panel/admin/cita/${id}`}
                enlaceAgendar={(hora) => `/panel/admin/agenda/nueva?medico=${medico.id}&fecha=${fecha}&hora=${hora}`}
            />
        </>
    );
}
