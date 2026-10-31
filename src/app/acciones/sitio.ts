"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type EstadoFormulario, erroresPorCampo, esquemaEmail, texto, valoresVisibles } from "@/lib/formularios";
import { guardarProspecto } from "@/lib/modelos/notificaciones";
import { contarIntentosFallidos, registrarIntentoLogin } from "@/lib/modelos/usuarios";

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

const COOKIE_PLATAFORMA = "sc_plataforma";

function huellaClave(clave: string): string {
    return createHash("sha256").update(`saludconecta:${clave}`).digest("hex");
}

/** Indica si la cookie actual abre el panel de plataforma. */
export async function tieneAccesoPlataforma(): Promise<boolean> {
    const clave = process.env.PLATAFORMA_CLAVE;
    if (!clave) return false;
    const valor = (await cookies()).get(COOKIE_PLATAFORMA)?.value ?? "";
    const esperado = huellaClave(clave);
    return valor.length === esperado.length && timingSafeEqual(Buffer.from(valor), Buffer.from(esperado));
}

/** Abre el panel de plataforma (solicitudes de contacto) con la clave del dueño. */
export async function entrarPlataforma(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const clave = process.env.PLATAFORMA_CLAVE;
    const escrita = String(datos.get("clave") ?? "");
    if (!clave) return { error: "Falta configurar PLATAFORMA_CLAVE en Vercel." };
    if ((await contarIntentosFallidos("plataforma")) >= 5) return { error: "Demasiados intentos. Espera 15 minutos." };
    const a = Buffer.from(huellaClave(escrita));
    const b = Buffer.from(huellaClave(clave));
    const valida = timingSafeEqual(a, b);
    await registrarIntentoLogin("plataforma", valida);
    if (!valida) return { error: "Clave incorrecta." };
    (await cookies()).set(COOKIE_PLATAFORMA, huellaClave(clave), {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/plataforma", maxAge: 60 * 60 * 12,
    });
    redirect("/plataforma");
}
