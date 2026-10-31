import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
    DURACION_SESION_SEGUNDOS, NOMBRE_COOKIE_SESION, firmarSesion, verificarSesion, type Rol,
} from "./sesion-token";
import { buscarUsuarioPorId, type Usuario } from "./modelos/usuarios";

/** Abre la sesión del usuario guardando el token en una cookie httpOnly. */
export async function iniciarSesion(usuario: { id: number; rol: Rol; consultorio_id: number | null }): Promise<void> {
    const token = await firmarSesion({ uid: usuario.id, rol: usuario.rol, cid: usuario.consultorio_id });
    const almacen = await cookies();
    almacen.set(NOMBRE_COOKIE_SESION, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: DURACION_SESION_SEGUNDOS,
    });
}

export async function cerrarSesion(): Promise<void> {
    const almacen = await cookies();
    almacen.delete(NOMBRE_COOKIE_SESION);
}

/**
 * Usuario de la sesión actual, leído de la base de datos en cada petición
 * para que un usuario eliminado pierda el acceso de inmediato.
 */
export const obtenerUsuarioActual = cache(async (): Promise<Usuario | null> => {
    const almacen = await cookies();
    const carga = await verificarSesion(almacen.get(NOMBRE_COOKIE_SESION)?.value);
    if (!carga) return null;
    const usuario = await buscarUsuarioPorId(carga.uid);
    if (!usuario || usuario.rol !== carga.rol) return null;
    return usuario;
});

/** Exige una sesión con alguno de los roles indicados; si no, redirige. */
export async function requerirUsuario(...roles: Rol[]): Promise<Usuario> {
    const usuario = await obtenerUsuarioActual();
    if (!usuario) redirect("/ingresar");
    if (roles.length > 0 && !roles.includes(usuario.rol)) redirect(rutaInicioPorRol(usuario.rol));
    return usuario;
}

export function rutaInicioPorRol(rol: Rol): string {
    if (rol === "admin") return "/panel/admin";
    if (rol === "medico") return "/panel/medico";
    return "/panel/paciente";
}
