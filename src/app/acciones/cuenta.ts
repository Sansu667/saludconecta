"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type EstadoFormulario, erroresPorCampo, esquemaContrasena, texto, valoresVisibles } from "@/lib/formularios";
import { actualizarPerfil, buscarUsuarioConHash, cambiarContrasena, verificarContrasena } from "@/lib/modelos/usuarios";
import { auditar, marcarTodasLeidas } from "@/lib/modelos/notificaciones";
import { requerirUsuario } from "@/lib/sesion";

const esquemaPerfil = z.object({
    nombres: z.string().trim().min(2, "Escribe tus nombres.").max(100),
    apellidos: z.string().trim().min(2, "Escribe tus apellidos.").max(100),
    telefono: z.string().trim().regex(/^[0-9 +()-]{7,20}$/, "Escribe un teléfono válido."),
});

export async function guardarPerfil(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const usuario = await requerirUsuario();
    const resultado = esquemaPerfil.safeParse({
        nombres: texto(datos, "nombres"),
        apellidos: texto(datos, "apellidos"),
        telefono: texto(datos, "telefono"),
    });
    if (!resultado.success) return { error: "Revisa los campos marcados.", campos: erroresPorCampo(resultado.error), valores: valoresVisibles(datos) };
    await actualizarPerfil(usuario.id, { ...resultado.data, fechaNac: texto(datos, "fechaNac") || null });
    revalidatePath("/panel", "layout");
    return { exito: "Datos actualizados." };
}

export async function guardarContrasena(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const usuario = await requerirUsuario();
    if (usuario.es_demo) return { error: "En la demo no se puede cambiar la contraseña, para que otras personas puedan seguir entrando." };
    const actual = String(datos.get("contrasenaActual") ?? "");
    const nueva = esquemaContrasena.safeParse(String(datos.get("contrasenaNueva") ?? ""));
    if (!nueva.success) return { error: nueva.error.issues[0].message, campos: { contrasenaNueva: nueva.error.issues[0].message } };
    const conHash = await buscarUsuarioConHash(usuario.email);
    if (!conHash || !(await verificarContrasena(actual, conHash.contrasena_hash))) {
        return { error: "La contraseña actual no es correcta.", campos: { contrasenaActual: "No coincide." } };
    }
    await cambiarContrasena(usuario.id, nueva.data);
    await auditar(usuario.id, "cambiar_contrasena", "usuario", usuario.id);
    return { exito: "Contraseña actualizada." };
}

export async function leerTodosLosAvisos(): Promise<void> {
    const usuario = await requerirUsuario();
    await marcarTodasLeidas(usuario.id);
    revalidatePath("/panel", "layout");
}
