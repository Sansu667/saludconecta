"use client";

import { useActionState } from "react";
import { registrarPaciente } from "@/app/acciones/autenticacion";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { AvisoFormulario, BotonEnvio } from "@/componentes/formulario";
import { CamposPaciente } from "./CamposPaciente";

export function FormularioRegistroPaciente({ siguiente }: { siguiente?: string }) {
    const [estado, accion] = useActionState(registrarPaciente, ESTADO_INICIAL);
    return (
        <form action={accion} className="space-y-6" noValidate>
            <input type="hidden" name="siguiente" value={siguiente ?? ""} />
            <CamposPaciente estado={estado} />
            <AvisoFormulario estado={estado} />
            <BotonEnvio className="boton boton-primario w-full sm:w-auto" pendiente="Creando tu cuenta…">Crear mi cuenta</BotonEnvio>
        </form>
    );
}
