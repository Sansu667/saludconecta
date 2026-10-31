import Link from "next/link";
import { CopiarEnlace } from "@/componentes/panel/CopiarEnlace";
import { BarrasDiarias, BarrasHorizontales, Cifra } from "@/componentes/panel/graficos";
import { EncabezadoPagina } from "@/componentes/panel/ui";
import { calcularEstadisticas, listarCitasMedico } from "@/lib/modelos/citas";
import { buscarConsultorioPorId, listarEspecialidades } from "@/lib/modelos/consultorios";
import { listarMedicos, obtenerDisponibilidad } from "@/lib/modelos/medicos";
import { requerirUsuario } from "@/lib/sesion";
import { formatearFechaCorta, formatearHora, hoyBogota, sumarDias } from "@/lib/tiempo";

export const metadata = { title: "Resumen" };

export default async function ResumenAdmin() {
    const usuario = await requerirUsuario("admin");
    const consultorioId = usuario.consultorio_id!;
    const hoy = hoyBogota();
    const desde = sumarDias(hoy, -29);

    const [consultorio, especialidades, medicos, stats] = await Promise.all([
        buscarConsultorioPorId(consultorioId),
        listarEspecialidades(consultorioId),
        listarMedicos(consultorioId),
        calcularEstadisticas(consultorioId, desde, hoy),
    ]);
    const horarios = await Promise.all(medicos.map((m) => obtenerDisponibilidad(m.id)));
    const conHorario = horarios.filter((h) => h.length > 0).length;
    const deHoy = (await Promise.all(medicos.filter((m) => m.activo).map(async (m) => ({ m, citas: await listarCitasMedico(m.id, hoy, hoy) }))))
        .map(({ m, citas }) => ({ m, citas: citas.filter((c) => c.estado !== "cancelada") }));

    const pasos = [
        { hecho: especialidades.length > 0, texto: "Agrega las especialidades que atiendes", href: "/panel/admin/consultorio" },
        { hecho: medicos.length > 0, texto: "Crea las cuentas de tus profesionales", href: "/panel/admin/profesionales" },
        { hecho: conHorario > 0, texto: "Configura el horario de cada profesional", href: "/panel/admin/profesionales" },
    ];
    const listo = pasos.every((p) => p.hecho);

    const cerradas = stats.resumen.completada + stats.resumen.no_asistio;
    const inasistencia = cerradas > 0 ? Math.round((stats.resumen.no_asistio / cerradas) * 100) : 0;
    const serieDiaria = Array.from({ length: 30 }, (_, i) => {
        const fecha = sumarDias(desde, i);
        return { fecha, valor: stats.porDia.find((d) => d.fecha === fecha)?.total ?? 0 };
    });

    return (
        <>
            <EncabezadoPagina
                titulo={consultorio?.nombre ?? "Resumen"}
                descripcion="Lo que pasó en los últimos 30 días y lo que viene hoy."
                acciones={<Link href="/panel/admin/agenda/nueva" className="boton boton-primario">Agendar una cita</Link>}
            />

            {!listo && (
                <section className="mb-8 rounded-2xl border-2 border-tinta bg-resaltador-suave p-6" aria-labelledby="primeros-pasos">
                    <h2 id="primeros-pasos" className="text-2xl font-bold">Tres pasos para recibir la primera reserva</h2>
                    <ol className="mt-4 space-y-3">
                        {pasos.map((p, i) => (
                            <li key={p.texto} className="flex items-center gap-3">
                                <span className={`grid size-8 shrink-0 place-items-center rounded-full font-display font-bold ${p.hecho ? "bg-pino text-papel" : "border-2 border-tinta bg-white"}`}>
                                    {p.hecho ? <span aria-label="Hecho">✓</span> : i + 1}
                                </span>
                                {p.hecho ? <span className="text-gris line-through">{p.texto}</span> : <Link href={p.href} className="enlace font-bold">{p.texto}</Link>}
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {consultorio && (
                <section className="mb-8 rounded-2xl bg-tinta p-6 text-papel" aria-labelledby="enlace">
                    <h2 id="enlace" className="font-sans text-sm font-bold text-papel/75">Enlace de reservas de tu consultorio</h2>
                    <p className="mb-4 mt-1 text-papel/85">Ponlo en tu WhatsApp Business, Instagram o perfil de Google.</p>
                    <CopiarEnlace ruta={`/c/${consultorio.slug}`} />
                </section>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Cifra etiqueta="Citas en 30 días" valor={stats.resumen.total - stats.resumen.cancelada} detalle={`${stats.resumen.cancelada} canceladas aparte`} />
                <Cifra etiqueta="Atendidas" valor={stats.resumen.completada} />
                <Cifra etiqueta="Inasistencia" valor={`${inasistencia} %`} detalle={`${stats.resumen.no_asistio} de ${cerradas} cerradas`} />
                <Cifra etiqueta="Pacientes distintos" valor={stats.pacientesUnicos} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <section className="hoja p-6" aria-labelledby="por-dia">
                    <h2 id="por-dia" className="mb-5 text-xl font-bold">Citas por día</h2>
                    <BarrasDiarias datos={serieDiaria} etiquetaDia={formatearFechaCorta} />
                </section>
                <section className="hoja p-6" aria-labelledby="por-especialidad">
                    <h2 id="por-especialidad" className="mb-5 text-xl font-bold">Citas por especialidad</h2>
                    <BarrasHorizontales datos={stats.porEspecialidad.map((e) => ({ etiqueta: e.nombre, valor: e.total }))} />
                </section>
            </div>

            <section className="mt-8" aria-labelledby="hoy">
                <div className="mb-4 flex items-baseline justify-between">
                    <h2 id="hoy" className="text-xl font-bold">Hoy en el consultorio</h2>
                    <Link href="/panel/admin/agenda" className="enlace text-sm">Ver la agenda completa</Link>
                </div>
                {deHoy.length === 0 ? (
                    <p className="text-gris">Cuando tengas profesionales activos, aquí verás sus citas del día.</p>
                ) : (
                    <ul className="divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-white">
                        {deHoy.map(({ m, citas }) => {
                            const proxima = citas.find((c) => c.inicio.getTime() > Date.now() && c.estado === "programada");
                            return (
                                <li key={m.id}>
                                    <Link href={`/panel/admin/agenda?medico=${m.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-menta/50">
                                        <span>
                                            <span className="block font-bold">{m.nombres} {m.apellidos}</span>
                                            <span className="text-sm text-gris">{m.especialidad ?? "Sin especialidad"}</span>
                                        </span>
                                        <span className="text-right text-sm">
                                            <span className="block font-bold">{citas.length} {citas.length === 1 ? "cita" : "citas"}</span>
                                            <span className="text-gris">{proxima ? `Siguiente: ${formatearHora(proxima.inicio)}` : "Sin más citas hoy"}</span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </>
    );
}
