"use client";

import { useActionState } from "react";
import { enviarContacto } from "@/app/acciones/sitio";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { AvisoFormulario, BotonEnvio, Campo, Selector } from "@/componentes/formulario";

export function FormularioContacto() {
    const [estado, accion] = useActionState(enviarContacto, ESTADO_INICIAL);
    if (estado.exito) {
        return (
            <div className="rounded-2xl bg-papel p-8 text-tinta">
                <p className="font-display text-2xl font-bold">Listo, {estado.valores?.nombre || "gracias"}.</p>
                <p className="mt-2">{estado.exito}</p>
            </div>
        );
    }
    return (
        <form action={accion} className="grid gap-4 rounded-2xl bg-papel p-6 text-tinta sm:grid-cols-2 sm:p-8" noValidate>
            <Campo etiqueta="Tu nombre" nombre="nombre" estado={estado} autoComplete="name" required />
            <Campo etiqueta="Correo" nombre="email" type="email" estado={estado} autoComplete="email" required />
            <Campo etiqueta="Teléfono o WhatsApp" nombre="telefono" type="tel" estado={estado} autoComplete="tel" />
            <Campo etiqueta="Consultorio o clínica" nombre="consultorio" estado={estado} autoComplete="organization" required />
            <Campo etiqueta="Ciudad" nombre="ciudad" estado={estado} autoComplete="address-level2" />
            <Selector
                etiqueta="Profesionales que atienden"
                nombre="medicos"
                estado={estado}
                opciones={[
                    { valor: "1", etiqueta: "Solo yo" },
                    { valor: "2-6", etiqueta: "Entre 2 y 6" },
                    { valor: "7-20", etiqueta: "Entre 7 y 20" },
                    { valor: "20+", etiqueta: "Más de 20 o varias sedes" },
                ]}
            />
            <div className="sm:col-span-2">
                <label htmlFor="mensaje" className="etiqueta">¿Qué te gustaría resolver? <span className="font-normal text-gris">(opcional)</span></label>
                <textarea id="mensaje" name="mensaje" rows={3} className="campo" defaultValue={estado.valores?.mensaje} />
            </div>
            <div className="hidden" aria-hidden="true">
                <label htmlFor="sitioWeb">No llenar</label>
                <input id="sitioWeb" name="sitioWeb" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="sm:col-span-2"><AvisoFormulario estado={estado} /></div>
            <div className="sm:col-span-2">
                <BotonEnvio pendiente="Enviando…">Quiero que me contacten</BotonEnvio>
            </div>
        </form>
    );
}
