import Link from "next/link";
import { BarrasHorizontales, Cifra } from "@/componentes/panel/graficos";
import { EncabezadoPagina, InsigniaEstado, Vacio } from "@/componentes/panel/ui";
import { ETIQUETAS_ESTADO, calcularEstadisticas, reporteCitas, type EstadoCita } from "@/lib/modelos/citas";
import { listarEspecialidades } from "@/lib/modelos/consultorios";
import { listarMedicos } from "@/lib/modelos/medicos";
import { requerirUsuario } from "@/lib/sesion";
import { formatearFechaCorta, formatearHora } from "@/lib/tiempo";
import { filtrosAConsulta, leerFiltros, type ParametrosReporte } from "./filtros";

export const metadata = { title: "Citas y reportes" };

const LIMITE_TABLA = 200;

export default async function ReportesAdmin({ searchParams }: { searchParams: Promise<ParametrosReporte> }) {
    const usuario = await requerirUsuario("admin");
    const consultorioId = usuario.consultorio_id!;
    const filtros = leerFiltros(await searchParams);
    const [citas, medicos, especialidades, stats] = await Promise.all([
        reporteCitas(consultorioId, filtros, LIMITE_TABLA + 1),
        listarMedicos(consultorioId),
        listarEspecialidades(consultorioId),
        calcularEstadisticas(consultorioId, filtros.desde, filtros.hasta),
    ]);
    const porMedico = stats.porMedico.filter((m) => !filtros.medicoId || m.medico_id === filtros.medicoId);

    return (
        <>
            <EncabezadoPagina
                titulo="Citas y reportes"
                acciones={<a href={`/api/reportes/citas?${filtrosAConsulta(filtros)}`} className="boton boton-primario" download>Descargar en Excel (CSV)</a>}
            />

            <form className="hoja mb-8 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_1.2fr_1fr_auto] lg:items-end">
                <div>
                    <label htmlFor="desde" className="etiqueta">Desde</label>
                    <input id="desde" name="desde" type="date" defaultValue={filtros.desde} className="campo" />
                </div>
                <div>
                    <label htmlFor="hasta" className="etiqueta">Hasta</label>
                    <input id="hasta" name="hasta" type="date" defaultValue={filtros.hasta} className="campo" />
                </div>
                <div>
                    <label htmlFor="medico" className="etiqueta">Profesional</label>
                    <select id="medico" name="medico" defaultValue={filtros.medicoId ?? ""} className="campo">
                        <option value="">Todos</option>
                        {medicos.map((m) => <option key={m.id} value={m.id}>{m.nombres} {m.apellidos}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="especialidad" className="etiqueta">Especialidad</label>
                    <select id="especialidad" name="especialidad" defaultValue={filtros.especialidadId ?? ""} className="campo">
                        <option value="">Todas</option>
                        {especialidades.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="estado" className="etiqueta">Estado</label>
                    <select id="estado" name="estado" defaultValue={filtros.estado ?? ""} className="campo">
                        <option value="">Todos</option>
                        {(Object.keys(ETIQUETAS_ESTADO) as EstadoCita[]).map((e) => <option key={e} value={e}>{ETIQUETAS_ESTADO[e]}</option>)}
                    </select>
                </div>
                <button type="submit" className="boton boton-secundario">Aplicar</button>
            </form>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Cifra etiqueta="Programadas" valor={stats.resumen.programada} />
                <Cifra etiqueta="Atendidas" valor={stats.resumen.completada} />
                <Cifra etiqueta="Canceladas" valor={stats.resumen.cancelada} />
                <Cifra etiqueta="No asistieron" valor={stats.resumen.no_asistio} />
            </div>
            <p className="mt-2 text-sm text-gris">Las cifras cubren todo el consultorio en las fechas elegidas.</p>

            <section className="hoja mt-8 p-6" aria-labelledby="por-medico">
                <h2 id="por-medico" className="mb-5 text-xl font-bold">Citas atendidas por profesional</h2>
                <BarrasHorizontales datos={porMedico.map((m) => ({ etiqueta: m.nombre, valor: m.completada }))} unidad="atendidas" />
            </section>

            <section className="mt-8" aria-labelledby="detalle">
                <h2 id="detalle" className="mb-4 text-xl font-bold">Detalle de citas</h2>
                {citas.length === 0 ? (
                    <Vacio titulo="No hay citas con esos filtros" />
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-2xl border border-linea bg-white">
                            <table className="w-full min-w-[42rem] text-left text-[0.95rem]">
                                <thead className="border-b border-linea bg-menta/50 text-sm">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Fecha</th>
                                        <th scope="col" className="px-4 py-3">Paciente</th>
                                        <th scope="col" className="px-4 py-3">Profesional</th>
                                        <th scope="col" className="px-4 py-3">Especialidad</th>
                                        <th scope="col" className="px-4 py-3">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-linea">
                                    {citas.slice(0, LIMITE_TABLA).map((c) => (
                                        <tr key={c.id} className="hover:bg-menta/40">
                                            <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                                                <Link href={`/panel/admin/cita/${c.id}`} className="font-bold hover:text-pino">{formatearFechaCorta(c.inicio)}, {formatearHora(c.inicio)}</Link>
                                            </td>
                                            <td className="px-4 py-3">{c.paciente_nombres} {c.paciente_apellidos}</td>
                                            <td className="px-4 py-3">{c.medico_nombres} {c.medico_apellidos}</td>
                                            <td className="px-4 py-3 text-gris">{c.especialidad ?? ""}</td>
                                            <td className="px-4 py-3"><InsigniaEstado estado={c.estado} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {citas.length > LIMITE_TABLA && (
                            <p className="mt-3 text-sm text-gris">Se muestran las {LIMITE_TABLA} más recientes. El archivo descargable trae todas.</p>
                        )}
                    </>
                )}
            </section>
        </>
    );
}
