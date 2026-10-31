"use client";

import { useFormStatus } from "react-dom";
import type { EstadoFormulario } from "@/lib/formularios";

interface PropsCampo extends React.InputHTMLAttributes<HTMLInputElement> {
    etiqueta: string;
    nombre: string;
    estado?: EstadoFormulario;
    ayuda?: string;
}

/** Campo de texto con etiqueta, ayuda y error asociado accesible. */
export function Campo({ etiqueta, nombre, estado, ayuda, className, defaultValue, ...resto }: PropsCampo) {
    const error = estado?.campos?.[nombre];
    const valor = defaultValue ?? estado?.valores?.[nombre];
    const idAyuda = `${nombre}-ayuda`;
    return (
        <div className={className}>
            <label htmlFor={nombre} className="etiqueta">{etiqueta}</label>
            <input
                id={nombre}
                name={nombre}
                className="campo"
                defaultValue={valor}
                aria-invalid={error ? true : undefined}
                aria-describedby={error || ayuda ? idAyuda : undefined}
                {...resto}
            />
            {error ? (
                <p id={idAyuda} className="mt-1 text-sm font-bold text-alerta">{error}</p>
            ) : ayuda ? (
                <p id={idAyuda} className="ayuda">{ayuda}</p>
            ) : null}
        </div>
    );
}

interface PropsSelector extends React.SelectHTMLAttributes<HTMLSelectElement> {
    etiqueta: string;
    nombre: string;
    estado?: EstadoFormulario;
    opciones: Array<{ valor: string; etiqueta: string }>;
}

export function Selector({ etiqueta, nombre, estado, opciones, className, defaultValue, ...resto }: PropsSelector) {
    const error = estado?.campos?.[nombre];
    return (
        <div className={className}>
            <label htmlFor={nombre} className="etiqueta">{etiqueta}</label>
            <select
                id={nombre}
                name={nombre}
                className="campo"
                defaultValue={defaultValue ?? estado?.valores?.[nombre]}
                aria-invalid={error ? true : undefined}
                {...resto}
            >
                {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
            </select>
            {error && <p className="mt-1 text-sm font-bold text-alerta">{error}</p>}
        </div>
    );
}

/** Botón de envío que se desactiva mientras el formulario está en curso. */
export function BotonEnvio({
    children, pendiente, className = "boton boton-primario", ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendiente?: string }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className={className} disabled={pending || resto.disabled} aria-busy={pending} {...resto}>
            {pending ? pendiente ?? "Un momento…" : children}
        </button>
    );
}

/** Mensaje de resultado de un formulario. */
export function AvisoFormulario({ estado }: { estado: EstadoFormulario }) {
    if (estado.error) {
        return (
            <p role="alert" className="rounded-lg border-l-4 border-alerta bg-alerta-suave px-4 py-3 text-sm font-bold text-alerta">
                {estado.error}
            </p>
        );
    }
    if (estado.exito) {
        return (
            <p role="status" className="rounded-lg border-l-4 border-pino bg-menta px-4 py-3 text-sm font-bold text-pino">
                {estado.exito}
            </p>
        );
    }
    return null;
}
