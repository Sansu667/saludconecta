import { createHash } from "node:crypto";
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

/**
 * Clave de firma. Usa AUTH_SECRET si existe; si no, la deriva de la cadena de
 * conexión de la base de datos, que también es secreta y solo vive en el servidor.
 */
function obtenerClave(): Uint8Array {
    const secreto = process.env.AUTH_SECRET;
    if (secreto) return new TextEncoder().encode(secreto);
    const urlBaseDatos = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (urlBaseDatos) {
        return new Uint8Array(createHash("sha256").update(`saludconecta-sesion:${urlBaseDatos}`).digest());
    }
    if (process.env.VERCEL) throw new Error("Falta AUTH_SECRET o DATABASE_URL.");
    return new TextEncoder().encode("clave-de-desarrollo-local-no-usar-en-produccion");
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
