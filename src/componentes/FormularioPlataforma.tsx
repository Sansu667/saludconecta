"use client";

import { useActionState } from "react";
import { entrarPlataforma } from "@/app/acciones/sitio";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { AvisoFormulario, BotonEnvio } from "@/componentes/formulario";

export function FormularioPlataforma() {
    const [estado, accion] = useActionState(entrarPlataforma, ESTADO_INICIAL);
    return (
        <form action={accion} className="space-y-4">
            <label htmlFor="clave" className="etiqueta">Clave de plataforma</label>
            <input id="clave" name="clave" type="password" className="campo" autoComplete="off" />
            <AvisoFormulario estado={estado} />
            <BotonEnvio>Entrar</BotonEnvio>
        </form>
    );
}
