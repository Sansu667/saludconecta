"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registrarConsultorio } from "@/app/acciones/autenticacion";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { AvisoFormulario, BotonEnvio, Campo } from "@/componentes/formulario";

export function FormularioRegistroConsultorio() {
    const [estado, accion] = useActionState(registrarConsultorio, ESTADO_INICIAL);
    return (
        <form action={accion} className="space-y-8" noValidate>
            <fieldset className="space-y-4">
                <legend className="mb-2 font-display text-xl font-bold">Tu consultorio</legend>
                <Campo etiqueta="Nombre del consultorio o clínica" nombre="consultorio" autoComplete="organization" estado={estado} required ayuda="Así lo verán tus pacientes." />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Campo etiqueta="Ciudad" nombre="ciudad" autoComplete="address-level2" estado={estado} required />
                    <Campo etiqueta="Teléfono del consultorio" nombre="telefonoConsultorio" type="tel" estado={estado} required />
                </div>
            </fieldset>
            <fieldset className="space-y-4">
                <legend className="mb-2 font-display text-xl font-bold">Tu cuenta de administrador</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Campo etiqueta="Nombres" nombre="nombres" autoComplete="given-name" estado={estado} required />
                    <Campo etiqueta="Apellidos" nombre="apellidos" autoComplete="family-name" estado={estado} required />
                </div>
                <Campo etiqueta="Correo" nombre="email" type="email" autoComplete="email" estado={estado} required />
                <Campo etiqueta="Contraseña" nombre="contrasena" type="password" autoComplete="new-password" estado={estado} ayuda="Mínimo 8 caracteres." required />
                <div>
                    <label className="flex items-start gap-3 text-[0.95rem]">
                        <input type="checkbox" name="aceptaTerminos" value="si" defaultChecked={estado.valores?.aceptaTerminos === "si"} className="mt-1 size-5 shrink-0 accent-[var(--color-pino)]" />
                        <span>
                            Acepto los <Link href="/terminos" target="_blank" className="enlace">términos de uso</Link> y la{" "}
                            <Link href="/privacidad" target="_blank" className="enlace">política de tratamiento de datos</Link>, y declaro que el consultorio es responsable de los datos de sus pacientes.
                        </span>
                    </label>
                    {estado.campos?.aceptaTerminos && <p className="mt-1 text-sm font-bold text-alerta">{estado.campos.aceptaTerminos}</p>}
                </div>
            </fieldset>
            <AvisoFormulario estado={estado} />
            <BotonEnvio className="boton boton-primario w-full py-3.5 text-lg sm:w-auto" pendiente="Creando el consultorio…">Crear mi consultorio</BotonEnvio>
        </form>
    );
}
