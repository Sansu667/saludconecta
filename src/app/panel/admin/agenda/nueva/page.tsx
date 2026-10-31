import Link from "next/link";
import { FormularioCitaRecepcion } from "@/componentes/agenda/FormularioCitaRecepcion";
import { EncabezadoPagina, Vacio } from "@/componentes/panel/ui";
import { listarMedicosAgendables, nombreMedico } from "@/lib/modelos/medicos";
import { buscarPacientes, buscarUsuarioPorId, nombreCompleto } from "@/lib/modelos/usuarios";
import { requerirUsuario } from "@/lib/sesion";
import { esFechaValida } from "@/lib/tiempo";

export const metadata = { title: "Agendar cita" };

type Busqueda = { q?: string; paciente?: string; medico?: string; fecha?: string; hora?: string };

export default async function NuevaCitaRecepcion({ searchParams }: { searchParams: Promise<Busqueda> }) {
    const usuario = await requerirUsuario("admin");
    const parametros = await searchParams;
    const conservar = new URLSearchParams();
    for (const clave of ["medico", "fecha", "hora"] as const) if (parametros[clave]) conservar.set(clave, parametros[clave]!);
    const enlace = (extra: Record<string, string>) => {
        const p = new URLSearchParams(conservar);
        for (const [k, v] of Object.entries(extra)) p.set(k, v);
        return `/panel/admin/agenda/nueva?${p.toString()}`;
    };

    const medicos = await listarMedicosAgendables(usuario.consultorio_id!);
    if (medicos.length === 0) {
        return (
            <>
                <EncabezadoPagina titulo="Agendar una cita" />
                <Vacio titulo="Ningún profesional tiene horario todavía" accion={<Link href="/panel/admin/profesionales" className="boton boton-primario">Ir a profesionales</Link>}>
                    Configura el horario de al menos un profesional para poder agendar.
                </Vacio>
            </>
        );
    }

    // Paso 2: ya hay paciente elegido (o es nuevo).
    if (parametros.paciente) {
        const esNuevo = parametros.paciente === "nuevo";
        const paciente = esNuevo ? null : await buscarUsuarioPorId(Number(parametros.paciente));
        if (!esNuevo && (!paciente || paciente.rol !== "paciente")) {
            return <Vacio titulo="No encontramos a ese paciente" accion={<Link href={enlace({})} className="boton boton-primario">Buscar de nuevo</Link>} />;
        }
        const medicoInicial = Number(parametros.medico) || null;
        return (
            <>
                <EncabezadoPagina
                    titulo="Agendar una cita"
                    descripcion={paciente ? `Para ${nombreCompleto(paciente)}, ${paciente.tipo_doc ?? ""} ${paciente.num_doc ?? ""}.` : "Registra al paciente y elige el turno."}
                    acciones={<Link href={enlace({})} className="boton boton-secundario boton-pequeno">Cambiar paciente</Link>}
                />
                <FormularioCitaRecepcion
                    paciente={paciente ? { id: paciente.id, nombre: nombreCompleto(paciente), documento: `${paciente.tipo_doc ?? ""} ${paciente.num_doc ?? ""}` } : null}
                    medicos={medicos.map((m) => ({ id: m.id, nombre: nombreMedico(m), especialidad: m.especialidad }))}
                    medicoInicial={medicos.some((m) => m.id === medicoInicial) ? medicoInicial : null}
                    fechaInicial={parametros.fecha && esFechaValida(parametros.fecha) ? parametros.fecha : null}
                    horaInicial={parametros.hora && /^\d{2}:\d{2}$/.test(parametros.hora) ? parametros.hora : null}
                />
            </>
        );
    }

    // Paso 1: buscar o registrar al paciente.
    const termino = (parametros.q ?? "").trim();
    const resultados = termino.length >= 3 ? await buscarPacientes(usuario.consultorio_id!, termino) : [];
    return (
        <>
            <EncabezadoPagina titulo="Agendar una cita" descripcion="Primero, ¿para quién es? Busca por número de documento, nombre o correo." />
            <form className="mb-6 flex flex-col gap-2 sm:flex-row" role="search">
                {Array.from(conservar.entries()).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
                <label htmlFor="q" className="sr-only">Buscar paciente</label>
                <input id="q" name="q" defaultValue={termino} className="campo sm:max-w-md" placeholder="Documento, nombre o correo" autoFocus />
                <button type="submit" className="boton boton-primario">Buscar</button>
            </form>
            {termino.length >= 3 && (
                resultados.length === 0 ? (
                    <p className="mb-6 text-gris">No hay coincidencias. Si es su primera vez, regístralo como paciente nuevo.</p>
                ) : (
                    <ul className="mb-6 divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-white">
                        {resultados.map((p) => (
                            <li key={p.id}>
                                <Link href={enlace({ paciente: String(p.id) })} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-menta/50">
                                    <span>
                                        <span className="block font-bold">{nombreCompleto(p)}</span>
                                        <span className="text-sm text-gris">{p.tipo_doc} {p.num_doc}{p.telefono ? `, ${p.telefono}` : ""}</span>
                                    </span>
                                    <span className="text-sm font-bold text-pino">Elegir</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )
            )}
            <Link href={enlace({ paciente: "nuevo" })} className="boton boton-secundario">Registrar paciente nuevo</Link>
            <p className="mt-4 max-w-xl text-sm text-gris">
                Por privacidad, solo aparecen por nombre los pacientes que ya se han atendido aquí. A cualquier otro lo encuentras con su documento o correo exactos.
            </p>
        </>
    );
}
