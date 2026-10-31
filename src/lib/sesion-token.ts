import { SignJWT, jwtVerify } from "jose";

/**
 * Firma y verificación del token de sesión. Este archivo no depende de la
 * base de datos para que también lo pueda usar el proxy de rutas.
 */
export const NOMBRE_COOKIE_SESION = "sc_sesion";
export const DURACION_SESION_SEGUNDOS = 60 * 60 * 24 * 7;

export type Rol = "paciente" | "medico" | "admin";

export interface CargaSesion {
    uid: number;
    rol: Rol;
    cid: number | null;
}

function obtenerClave(): Uint8Array {
    const secreto = process.env.AUTH_SECRET;
    if (!secreto) {
        if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
            throw new Error("Falta la variable AUTH_SECRET.");
        }
        return new TextEncoder().encode("clave-de-desarrollo-local-no-usar-en-produccion");
    }
    return new TextEncoder().encode(secreto);
}

/** Crea un token firmado (HS256) con la identidad y el rol del usuario. */
export async function firmarSesion(carga: CargaSesion): Promise<string> {
    return new SignJWT({ rol: carga.rol, cid: carga.cid })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(String(carga.uid))
        .setIssuedAt()
        .setExpirationTime(`${DURACION_SESION_SEGUNDOS}s`)
        .sign(obtenerClave());
}

/** Verifica el token y devuelve su contenido, o null si no es válido. */
export async function verificarSesion(token: string | undefined): Promise<CargaSesion | null> {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, obtenerClave(), { algorithms: ["HS256"] });
        const uid = Number(payload.sub);
        const rol = payload.rol as Rol;
        if (!uid || !["paciente", "medico", "admin"].includes(rol)) return null;
        return { uid, rol, cid: (payload.cid as number | null) ?? null };
    } catch {
        return null;
    }
}
