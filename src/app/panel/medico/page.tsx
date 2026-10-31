import { notFound } from "next/navigation";
import Link from "next/link";
import { HojaDelDia } from "@/componentes/agenda/HojaDelDia";
import { TiraSemana, lunesDe } from "@/componentes/agenda/TiraSemana";
import { EncabezadoPagina } from "@/componentes/panel/ui";
import { listarCitasMedico } from "@/lib/modelos/citas";
import { buscarMedicoPorUsuario, listarBloqueos, obtenerDisponibilidad } from "@/lib/modelos/medicos";
import { requerirUsuario } from "@/lib/sesion";
import { esFechaValida, fechaBogota, hoyBogota, proximoDiaCon, sumarDias } from "@/lib/tiempo";

export const metadata = { title: "Mi agenda" };

export default async function AgendaMedico({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
    const usuario = await requerirUsuario("medico");
    const medico = await buscarMedicoPorUsuario(usuario.id);
    if (!medico) notFound();
    const { fecha: fechaParam } = await searchParams;
    const horario = await obtenerDisponibilidad(medico.id);
    // Sin fecha elegida, abre el día de hoy o, si hoy no atiende, el siguiente día con consulta.
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
    const citasDia = citasSemana.filter((c) => fechaBogota(c.inicio) === fecha);
    const bloqueo = bloqueos.find((b) => b.fecha === fecha);
    const pendientes = citasDia.filter((c) => c.estado === "programada" && c.inicio.getTime() < Date.now()).length;

    return (
        <>
            <EncabezadoPagina
                titulo={`Agenda de ${usuario.nombres.split(" ")[0]}`}
                descripcion={`${medico.especialidad ?? "Consulta"}, turnos de ${medico.duracion_cita_min} minutos.`}
                acciones={horario.length === 0 ? <Link href="/panel/medico/horario" className="boton boton-primario">Configurar mi horario</Link> : undefined}
            />
            {horario.length === 0 && (
                <p className="mb-6 rounded-xl border-l-4 border-resaltador bg-resaltador-suave/60 px-4 py-3">
                    Aún no tienes horario. Hasta que lo configures, los pacientes no podrán reservar contigo.
                </p>
            )}
            {pendientes > 0 && (
                <p className="mb-6 rounded-xl border-l-4 border-pino bg-menta px-4 py-3">
                    Tienes {pendientes} {pendientes === 1 ? "consulta" : "consultas"} de este día sin cerrar. Ábrelas para registrar la atención o la inasistencia.
                </p>
            )}
            <TiraSemana fecha={fecha} conteos={conteos} ruta={(f) => `/panel/medico?fecha=${f}`} />
            <HojaDelDia
                fecha={fecha}
                citas={citasDia}
                horario={horario}
                duracion={medico.duracion_cita_min}
                bloqueado={bloqueo ? bloqueo.motivo ?? "-" : null}
                rutaCita={(id) => `/panel/medico/cita/${id}`}
            />
        </>
    );
}
