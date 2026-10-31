import { BotonQuitarAusencia, EditorHorario, FormularioAusencia } from "./EditorHorario";
import { listarBloqueos, obtenerDisponibilidad, type Medico } from "@/lib/modelos/medicos";
import { formatearFechaLarga, hoyBogota } from "@/lib/tiempo";

/** Horario semanal y ausencias de un médico, para su panel o el de administración. */
export async function SeccionHorario({ medico }: { medico: Medico }) {
    const hoy = hoyBogota();
    const [disponibilidad, bloqueos] = await Promise.all([obtenerDisponibilidad(medico.id), listarBloqueos(medico.id, hoy)]);
    return (
        <div className="space-y-10">
            <section aria-labelledby="semana">
                <h2 id="semana" className="mb-4 text-2xl font-bold">Horario de cada semana</h2>
                <EditorHorario
                    medicoId={medico.id}
                    duracion={medico.duracion_cita_min}
                    inicial={disponibilidad.map((d) => ({ dia: d.dia_semana, inicio: d.hora_inicio, fin: d.hora_fin }))}
                />
            </section>
            <section aria-labelledby="ausencias">
                <h2 id="ausencias" className="mb-1 text-2xl font-bold">Días sin consulta</h2>
                <p className="mb-5 text-gris">Vacaciones, congresos o cualquier día en que no se atiende.</p>
                {bloqueos.length > 0 && (
                    <ul className="mb-6 divide-y divide-linea rounded-2xl border border-linea bg-white">
                        {bloqueos.map((b) => (
                            <li key={b.id} className="flex items-center justify-between gap-4 px-5 py-3">
                                <span>
                                    <span className="font-bold first-letter:uppercase">{formatearFechaLarga(b.fecha)}</span>
                                    {b.motivo && <span className="text-gris">, {b.motivo}</span>}
                                </span>
                                <BotonQuitarAusencia medicoId={medico.id} bloqueoId={b.id} />
                            </li>
                        ))}
                    </ul>
                )}
                <div className="hoja p-5 sm:p-6">
                    <FormularioAusencia medicoId={medico.id} hoy={hoy} />
                </div>
            </section>
        </div>
    );
}
