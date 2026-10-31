import Link from "next/link";
import { ETIQUETAS_ESTADO, type CitaDetalle, type EstadoCita } from "@/lib/modelos/citas";
import { formatearFechaCorta, formatearFechaLarga, formatearHora, NOMBRES_DIAS_CORTOS, diaSemana, fechaBogota } from "@/lib/tiempo";

export function EncabezadoPagina({ titulo, descripcion, acciones }: { titulo: string; descripcion?: React.ReactNode; acciones?: React.ReactNode }) {
    return (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-3xl font-extrabold sm:text-[2.4rem]">{titulo}</h1>
                {descripcion && <p className="mt-2 max-w-2xl text-gris">{descripcion}</p>}
            </div>
            {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
        </div>
    );
}

const ESTILO_ESTADO: Record<EstadoCita, string> = {
    programada: "bg-resaltador text-tinta",
    completada: "bg-menta-fuerte text-pino",
    cancelada: "bg-alerta-suave text-alerta line-through decoration-1",
    no_asistio: "bg-[#ece6dc] text-[#6b5a3e]",
};

export function InsigniaEstado({ estado }: { estado: EstadoCita }) {
    return (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${ESTILO_ESTADO[estado]}`}>
            {ETIQUETAS_ESTADO[estado]}
        </span>
    );
}

export function Vacio({ titulo, children, accion }: { titulo: string; children?: React.ReactNode; accion?: React.ReactNode }) {
    return (
        <div className="rounded-2xl border-[1.5px] border-dashed border-linea px-6 py-10 text-center">
            <p className="font-display text-xl font-bold">{titulo}</p>
            {children && <div className="mx-auto mt-2 max-w-md text-gris">{children}</div>}
            {accion && <div className="mt-5">{accion}</div>}
        </div>
    );
}

/** Fila de cita con la fecha como bloque de agenda a la izquierda. */
export function FilaCita({ cita, href, mostrar }: { cita: CitaDetalle; href: string; mostrar: "medico" | "paciente" }) {
    const fecha = fechaBogota(cita.inicio);
    const persona = mostrar === "medico"
        ? `${cita.medico_nombres} ${cita.medico_apellidos}`
        : `${cita.paciente_nombres} ${cita.paciente_apellidos}`;
    const detalle = mostrar === "medico" ? `${cita.especialidad ?? "Consulta"}, ${cita.consultorio_nombre}` : cita.motivo ?? "Sin motivo indicado";
    return (
        <li>
            <Link href={href} className="group flex items-stretch gap-4 rounded-xl border border-linea bg-white p-3 transition-colors hover:border-pino sm:p-4">
                <span className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-lg py-1.5 leading-tight ${cita.estado === "programada" ? "bg-resaltador-suave" : "bg-menta/70"}`}>
                    <span className="text-xs text-gris">{NOMBRES_DIAS_CORTOS[diaSemana(fecha)]}</span>
                    <span className="font-display text-2xl font-bold">{Number(fecha.slice(8))}</span>
                    <span className="text-xs text-gris">{formatearFechaCorta(fecha).split(" ")[1]}</span>
                </span>
                <span className="min-w-0 flex-1 py-0.5">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-bold tabular-nums">{formatearHora(cita.inicio)}</span>
                        <InsigniaEstado estado={cita.estado} />
                    </span>
                    <span className="mt-1 block truncate font-bold group-hover:text-pino">{persona}</span>
                    <span className="block truncate text-sm text-gris">{detalle}</span>
                </span>
            </Link>
        </li>
    );
}

export function DatoCita({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-sm text-gris">{etiqueta}</dt>
            <dd className="mt-0.5 font-bold">{children}</dd>
        </div>
    );
}

export function CuandoCita({ cita }: { cita: CitaDetalle }) {
    return (
        <>
            <span className="first-letter:uppercase">{formatearFechaLarga(cita.inicio)}</span>, {formatearHora(cita.inicio)} a {formatearHora(cita.fin)}
        </>
    );
}
