"use client";

import Link from "next/link";
import { TIPOS_DOCUMENTO, type EstadoFormulario } from "@/lib/formularios";
import { Campo, Selector } from "@/componentes/formulario";

/** Campos del registro de un paciente, compartidos por el registro y el agendamiento. */
export function CamposPaciente({ estado }: { estado: EstadoFormulario }) {
    const errorDatos = estado.campos?.aceptaDatos;
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombres" nombre="nombres" autoComplete="given-name" estado={estado} required />
            <Campo etiqueta="Apellidos" nombre="apellidos" autoComplete="family-name" estado={estado} required />
            <Selector etiqueta="Tipo de documento" nombre="tipoDoc" estado={estado} opciones={TIPOS_DOCUMENTO.map((t) => ({ valor: t.valor, etiqueta: t.etiqueta }))} />
            <Campo etiqueta="Número de documento" nombre="numDoc" inputMode="text" estado={estado} required />
            <Campo etiqueta="Celular" nombre="telefono" type="tel" autoComplete="tel" estado={estado} required />
            <Campo etiqueta="Fecha de nacimiento" nombre="fechaNac" type="date" estado={estado} ayuda="Opcional, ayuda al médico." />
            <Campo etiqueta="Correo" nombre="email" type="email" autoComplete="email" estado={estado} required className="sm:col-span-2" />
            <Campo
                etiqueta="Crea una contraseña"
                nombre="contrasena"
                type="password"
                autoComplete="new-password"
                estado={estado}
                ayuda="Mínimo 8 caracteres."
                required
                className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
                <label className="flex items-start gap-3 text-[0.95rem]">
                    <input type="checkbox" name="aceptaDatos" value="si" defaultChecked={estado.valores?.aceptaDatos === "si"} className="mt-1 size-5 shrink-0 accent-[var(--color-pino)]" required />
                    <span>
                        Autorizo el tratamiento de mis datos personales y de salud para gestionar mis citas, según la{" "}
                        <Link href="/privacidad" target="_blank" className="enlace">política de tratamiento de datos</Link>.
                    </span>
                </label>
                {errorDatos && <p className="mt-1 text-sm font-bold text-alerta">{errorDatos}</p>}
            </div>
        </div>
    );
}
