import Link from "next/link";
import { InsigniaEstado } from "@/componentes/panel/ui";
import type { CitaDetalle } from "@/lib/modelos/citas";
import type { BloqueHorario } from "@/lib/modelos/medicos";
import { calcularEdad, construirInstante, diaSemana, formatearHora, horaBogota, horaDeMinutos, minutosDeHora } from "@/lib/tiempo";

type Entrada =
    | { tipo: "cita"; minuto: number; cita: CitaDetalle }
    | { tipo: "libre"; minuto: number; hora: string };

/**
 * La hoja de agenda de un día, como en el cuaderno de recepción:
 * cada turno del horario en orden, resaltado si está tomado.
 */
export function HojaDelDia({
    fecha, citas, horario, duracion, bloqueado, rutaCita, mostrarMedico = false, enlaceAgendar,
}: {
    fecha: string;
    citas: CitaDetalle[];
    horario: BloqueHorario[];
    duracion: number;
    bloqueado: string | null;
    rutaCita: (id: number) => string;
    mostrarMedico?: boolean;
    enlaceAgendar?: (hora: string) => string;
}) {
    const activas = citas.filter((c) => c.estado !== "cancelada");
    const canceladas = citas.filter((c) => c.estado === "cancelada");
    const entradas: Entrada[] = activas.map((c) => ({ tipo: "cita", minuto: minutosDeHora(horaBogota(c.inicio)), cita: c }));
    const ahora = Date.now();

    if (!bloqueado) {
        for (const bloque of horario.filter((b) => b.dia_semana === diaSemana(fecha))) {
            for (let m = minutosDeHora(bloque.hora_inicio); m + duracion <= minutosDeHora(bloque.hora_fin); m += duracion) {
                const inicio = construirInstante(fecha, horaDeMinutos(m)).getTime();
                const fin = inicio + duracion * 60000;
                const ocupado = activas.some((c) => inicio < c.fin.getTime() && fin > c.inicio.getTime());
                if (!ocupado && inicio > ahora) entradas.push({ tipo: "libre", minuto: m, hora: horaDeMinutos(m) });
            }
        }
    }
    entradas.sort((a, b) => a.minuto - b.minuto);

    if (bloqueado) {
        return <p className="rounded-2xl bg-menta px-5 py-6 text-center">Día sin consulta{bloqueado !== "-" ? `: ${bloqueado}` : ""}.</p>;
    }
    if (entradas.length === 0 && canceladas.length === 0) {
        return <p className="rounded-2xl border-[1.5px] border-dashed border-linea px-5 py-8 text-center text-gris">No hay horario ni citas este día.</p>;
    }

    return (
        <div>
            <ol className="overflow-hidden rounded-2xl border border-linea bg-white">
                {entradas.map((e) =>
                    e.tipo === "cita" ? (
                        <li key={`c-${e.cita.id}`} className="border-b border-linea last:border-b-0">
                            <Link href={rutaCita(e.cita.id)} className="grid grid-cols-[5.6rem_1fr] items-center gap-3 px-3 py-3 hover:bg-menta/50 sm:grid-cols-[6rem_1fr_auto] sm:px-5">
                                <span className="whitespace-nowrap font-bold tabular-nums">{formatearHora(e.cita.inicio)}</span>
                                <span className={`min-w-0 rounded-md px-3 py-2 ${e.cita.estado === "programada" ? "bg-resaltador-suave" : "bg-menta/70"}`}>
                                    <span className="block truncate font-bold">
                                        {e.cita.paciente_nombres} {e.cita.paciente_apellidos}
                                        {calcularEdad(e.cita.paciente_fecha_nac) !== null && (
                                            <span className="font-normal text-gris">, {calcularEdad(e.cita.paciente_fecha_nac)} años</span>
                                        )}
                                    </span>
                                    <span className="block truncate text-sm text-gris">
                                        {mostrarMedico ? `${e.cita.medico_nombres} ${e.cita.medico_apellidos}. ` : ""}{e.cita.motivo ?? "Sin motivo indicado"}
                                    </span>
                                </span>
                                <span className="col-start-2 sm:col-start-auto"><InsigniaEstado estado={e.cita.estado} /></span>
                            </Link>
                        </li>
                    ) : (
                        <li key={`l-${e.minuto}`} className="grid grid-cols-[5.6rem_1fr] items-center gap-3 border-b border-linea px-3 py-2 text-gris last:border-b-0 sm:grid-cols-[6rem_1fr] sm:px-5">
                            <span className="whitespace-nowrap tabular-nums">{formatearHora(e.hora)}</span>
                            {enlaceAgendar ? (
                                <Link href={enlaceAgendar(e.hora)} className="rounded-md border border-dashed border-linea px-3 py-1.5 text-sm hover:border-pino hover:text-pino">Libre, agendar aquí</Link>
                            ) : (
                                <span className="text-sm">Libre</span>
                            )}
                        </li>
                    ),
                )}
            </ol>
            {canceladas.length > 0 && (
                <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-bold text-gris">{canceladas.length} {canceladas.length === 1 ? "cita cancelada" : "citas canceladas"} este día</summary>
                    <ul className="mt-2 space-y-1 text-sm">
                        {canceladas.map((c) => (
                            <li key={c.id}>
                                <Link href={rutaCita(c.id)} className="text-gris hover:text-tinta">
                                    {formatearHora(c.inicio)}, {c.paciente_nombres} {c.paciente_apellidos}
                                    {c.cancelada_por ? ` (canceló ${c.cancelada_por === "paciente" ? "el paciente" : c.cancelada_por === "medico" ? "el médico" : "recepción"})` : ""}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}
