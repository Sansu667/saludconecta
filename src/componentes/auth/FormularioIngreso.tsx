"use client";

import { useActionState } from "react";
import { ingresar } from "@/app/acciones/autenticacion";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { AvisoFormulario, BotonEnvio, Campo } from "@/componentes/formulario";

export function FormularioIngreso({ siguiente }: { siguiente?: string }) {
    const [estado, accion] = useActionState(ingresar, ESTADO_INICIAL);
    return (
        <form action={accion} className="space-y-5" noValidate>
            <input type="hidden" name="siguiente" value={siguiente ?? ""} />
            <Campo etiqueta="Correo" nombre="email" type="email" autoComplete="email" estado={estado} required autoFocus />
            <Campo etiqueta="Contraseña" nombre="contrasena" type="password" autoComplete="current-password" estado={estado} required />
            <AvisoFormulario estado={estado} />
            <BotonEnvio className="boton boton-primario w-full" pendiente="Entrando…">Entrar</BotonEnvio>
        </form>
    );
}
