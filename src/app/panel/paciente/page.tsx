import Link from "next/link";
import { EncabezadoPagina, FilaCita, Vacio } from "@/componentes/panel/ui";
import { listarCitasPaciente } from "@/lib/modelos/citas";
import { generarRecordatorios, listarNotificaciones } from "@/lib/modelos/notificaciones";
import { requerirUsuario } from "@/lib/sesion";
import { formatearFechaLarga, formatearHora } from "@/lib/tiempo";

export const metadata = { title: "Inicio" };

export default async function InicioPaciente() {
    const usuario = await requerirUsuario("paciente");
    await generarRecordatorios(usuario.id);
    const [proximas, historial, avisos] = await Promise.all([
        listarCitasPaciente(usuario.id, "proximas"),
        listarCitasPaciente(usuario.id, "historial"),
        listarNotificaciones(usuario.id, 3),
    ]);
    const siguiente = proximas[0];
    const ultimaConIndicaciones = historial.find((c) => c.estado === "completada" && (c.diagnostico || c.tratamiento));

    return (
        <>
            <EncabezadoPagina
                titulo={`Hola, ${usuario.nombres.split(" ")[0]}`}
                acciones={<Link href="/panel/paciente/agendar" className="boton boton-primario">Agendar una cita</Link>}
            />

            {siguiente ? (
                <section aria-labelledby="proxima" className="overflow-hidden rounded-2xl bg-tinta text-papel">
                    <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-8">
                        <div>
                            <h2 id="proxima" className="font-sans text-sm font-bold text-papel/70">Tu próxima cita</h2>
                            <p className="mt-2 font-display text-3xl font-bold leading-tight first-letter:uppercase sm:text-4xl">
                                {formatearFechaLarga(siguiente.inicio)}
                            </p>
                            <p className="mt-1 font-display text-2xl text-resaltador">{formatearHora(siguiente.inicio)}</p>
                            <p className="mt-4 text-papel/85">
                                {siguiente.medico_nombres} {siguiente.medico_apellidos}, {siguiente.especialidad?.toLowerCase() ?? "consulta"}
                                <br />
                                {siguiente.consultorio_nombre}{siguiente.consultorio_direccion ? `, ${siguiente.consultorio_direccion}` : ""}
                            </p>
                        </div>
                        <Link href={`/panel/paciente/cita/${siguiente.id}`} className="boton boton-resaltado">Ver o cambiar</Link>
                    </div>
                </section>
            ) : (
                <Vacio titulo="No tienes citas próximas" accion={<Link href="/panel/paciente/agendar" className="boton boton-primario">Agendar una cita</Link>}>
                    Busca tu consultorio y reserva en menos de un minuto.
                </Vacio>
            )}

            <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
                <section aria-labelledby="otras">
                    <div className="mb-4 flex items-baseline justify-between">
                        <h2 id="otras" className="text-xl font-bold">Próximas</h2>
                        <Link href="/panel/paciente/citas" className="enlace text-sm">Ver todas</Link>
                    </div>
                    {proximas.length > 1 ? (
                        <ul className="space-y-3">
                            {proximas.slice(1, 5).map((c) => <FilaCita key={c.id} cita={c} href={`/panel/paciente/cita/${c.id}`} mostrar="medico" />)}
                        </ul>
                    ) : (
                        <p className="text-gris">{proximas.length === 1 ? "No tienes más citas programadas." : "Aquí aparecerán tus citas."}</p>
                    )}

                    {ultimaConIndicaciones && (
                        <div className="mt-8">
                            <h2 className="mb-3 text-xl font-bold">Indicaciones de tu última consulta</h2>
                            <Link href={`/panel/paciente/cita/${ultimaConIndicaciones.id}`} className="block rounded-xl border border-linea bg-white p-5 hover:border-pino">
                                <p className="text-sm text-gris">
                                    {ultimaConIndicaciones.medico_nombres} {ultimaConIndicaciones.medico_apellidos}, {formatearFechaLarga(ultimaConIndicaciones.inicio)}
                                </p>
                                {ultimaConIndicaciones.diagnostico && <p className="mt-2 font-bold">{ultimaConIndicaciones.diagnostico}</p>}
                                {ultimaConIndicaciones.tratamiento && <p className="mt-1 text-gris">{ultimaConIndicaciones.tratamiento}</p>}
                            </Link>
                        </div>
                    )}
                </section>

                <section aria-labelledby="avisos">
                    <div className="mb-4 flex items-baseline justify-between">
                        <h2 id="avisos" className="text-xl font-bold">Avisos recientes</h2>
                        <Link href="/panel/avisos" className="enlace text-sm">Ver todos</Link>
                    </div>
                    {avisos.length === 0 ? (
                        <p className="text-gris">Sin avisos por ahora.</p>
                    ) : (
                        <ul className="space-y-3">
                            {avisos.map((a) => (
                                <li key={a.id} className={`rounded-xl border p-4 ${a.leida ? "border-linea bg-white" : "border-resaltador bg-resaltador-suave/50"}`}>
                                    <p className="font-bold">{a.titulo}</p>
                                    {a.cuerpo && <p className="mt-1 text-sm text-gris">{a.cuerpo}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}
