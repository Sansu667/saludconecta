"use client";

import { useActionState } from "react";
import { guardarContrasena, guardarPerfil } from "@/app/acciones/cuenta";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { AvisoFormulario, BotonEnvio, Campo } from "@/componentes/formulario";

export function FormularioPerfil({ nombres, apellidos, telefono, fechaNac, conFecha }: {
    nombres: string; apellidos: string; telefono: string; fechaNac: string; conFecha: boolean;
}) {
    const [estado, accion] = useActionState(guardarPerfil, ESTADO_INICIAL);
    return (
        <form action={accion} className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombres" nombre="nombres" defaultValue={estado.valores?.nombres ?? nombres} estado={estado} />
            <Campo etiqueta="Apellidos" nombre="apellidos" defaultValue={estado.valores?.apellidos ?? apellidos} estado={estado} />
            <Campo etiqueta="Celular" nombre="telefono" type="tel" defaultValue={estado.valores?.telefono ?? telefono} estado={estado} />
            {conFecha && <Campo etiqueta="Fecha de nacimiento" nombre="fechaNac" type="date" defaultValue={fechaNac} estado={estado} />}
            <div className="sm:col-span-2 space-y-4">
                <AvisoFormulario estado={estado} />
                <BotonEnvio pendiente="Guardando…">Guardar cambios</BotonEnvio>
            </div>
        </form>
    );
}

export function FormularioContrasena() {
    const [estado, accion] = useActionState(guardarContrasena, ESTADO_INICIAL);
    return (
        <form action={accion} className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Contraseña actual" nombre="contrasenaActual" type="password" autoComplete="current-password" estado={estado} />
            <Campo etiqueta="Contraseña nueva" nombre="contrasenaNueva" type="password" autoComplete="new-password" ayuda="Mínimo 8 caracteres." estado={estado} />
            <div className="sm:col-span-2 space-y-4">
                <AvisoFormulario estado={estado} />
                <BotonEnvio className="boton boton-secundario" pendiente="Cambiando…">Cambiar contraseña</BotonEnvio>
            </div>
        </form>
    );
}
