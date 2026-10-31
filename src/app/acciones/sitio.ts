"use server";

import { z } from "zod";
import { type EstadoFormulario, erroresPorCampo, esquemaEmail, texto, valoresVisibles } from "@/lib/formularios";
import { guardarProspecto } from "@/lib/modelos/notificaciones";

const esquemaContacto = z.object({
    nombre: z.string().trim().min(2, "Escribe tu nombre.").max(120),
    email: esquemaEmail,
    telefono: z.string().trim().max(30),
    consultorio: z.string().trim().min(2, "Escribe el nombre del consultorio o clínica.").max(150),
    ciudad: z.string().trim().max(80),
    medicos: z.string().trim().max(20),
    mensaje: z.string().trim().max(2000),
});

/** Guarda la solicitud de contacto de un consultorio interesado. */
export async function enviarContacto(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    // Campo trampa: los humanos no lo ven, los robots lo llenan.
    if (texto(datos, "sitioWeb")) return { exito: "Gracias. Te escribiremos pronto." };
    const resultado = esquemaContacto.safeParse({
        nombre: texto(datos, "nombre"),
        email: texto(datos, "email"),
        telefono: texto(datos, "telefono"),
        consultorio: texto(datos, "consultorio"),
        ciudad: texto(datos, "ciudad"),
        medicos: texto(datos, "medicos"),
        mensaje: texto(datos, "mensaje"),
    });
    if (!resultado.success) {
        return { error: "Revisa los campos marcados.", campos: erroresPorCampo(resultado.error), valores: valoresVisibles(datos) };
    }
    await guardarProspecto(resultado.data);
    return {
        exito: "Recibimos tus datos. Te escribiremos en menos de un día hábil para mostrarte SaludConecta con tu propia agenda.",
        valores: { nombre: resultado.data.nombre.split(" ")[0] },
    };
}
