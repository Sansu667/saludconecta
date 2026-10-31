import { NextResponse, type NextRequest } from "next/server";
import { NOMBRE_COOKIE_SESION, verificarSesion } from "./lib/sesion-token";

/**
 * Primera barrera de seguridad: nadie entra al panel sin una sesión válida.
 * Cada página y acción vuelve a verificar el rol contra la base de datos.
 */
export async function proxy(request: NextRequest) {
    const sesion = await verificarSesion(request.cookies.get(NOMBRE_COOKIE_SESION)?.value);
    if (!sesion) {
        const destino = new URL("/ingresar", request.url);
        destino.searchParams.set("siguiente", request.nextUrl.pathname);
        const respuesta = NextResponse.redirect(destino);
        respuesta.cookies.delete(NOMBRE_COOKIE_SESION);
        return respuesta;
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/panel/:path*"],
};
