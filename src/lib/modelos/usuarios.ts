import "server-only";
import bcrypt from "bcryptjs";
import { consultar, consultarUno } from "../db";
import type { Rol } from "../sesion-token";

export const COSTO_HASH = 10;
export const MAXIMO_INTENTOS_LOGIN = 5;
export const VENTANA_INTENTOS_MINUTOS = 15;

export interface Usuario {
    id: number;
    consultorio_id: number | null;
    rol: Rol;
    nombres: string;
    apellidos: string;
    email: string;
    tipo_doc: string | null;
    num_doc: string | null;
    telefono: string | null;
    fecha_nac: string | null;
    es_demo: boolean;
}

const COLUMNAS = `id, consultorio_id, rol, nombres, apellidos, email, tipo_doc, num_doc, telefono,
    fecha_nac::text AS fecha_nac, es_demo`;

export function normalizarEmail(email: string): string {
    return email.trim().toLowerCase();
}

/** Busca un usuario por id. */
export async function buscarUsuarioPorId(id: number): Promise<Usuario | null> {
    return consultarUno<Usuario>(`SELECT ${COLUMNAS} FROM usuarios WHERE id = $1`, [id]);
}

/** Busca un usuario por correo, incluyendo el hash para validar la contraseña. */
export async function buscarUsuarioConHash(email: string): Promise<(Usuario & { contrasena_hash: string }) | null> {
    return consultarUno(`SELECT ${COLUMNAS}, contrasena_hash FROM usuarios WHERE email = $1`, [normalizarEmail(email)]);
}

/** Indica si el correo ya está registrado. */
export async function existeEmail(email: string): Promise<boolean> {
    const fila = await consultarUno("SELECT 1 FROM usuarios WHERE email = $1", [normalizarEmail(email)]);
    return fila !== null;
}

export interface DatosPaciente {
    nombres: string;
    apellidos: string;
    email: string;
    contrasena: string;
    tipoDoc: string;
    numDoc: string;
    telefono: string;
    fechaNac?: string | null;
}

/** Registra un paciente nuevo y devuelve su id. */
export async function crearPaciente(datos: DatosPaciente): Promise<number> {
    const hash = await bcrypt.hash(datos.contrasena, COSTO_HASH);
    const [fila] = await consultar<{ id: number }>(
        `INSERT INTO usuarios (rol, nombres, apellidos, email, contrasena_hash, tipo_doc, num_doc, telefono, fecha_nac, acepto_datos_en)
         VALUES ('paciente', $1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id`,
        [
            datos.nombres.trim(),
            datos.apellidos.trim(),
            normalizarEmail(datos.email),
            hash,
            datos.tipoDoc,
            datos.numDoc.trim(),
            datos.telefono.trim(),
            datos.fechaNac || null,
        ],
    );
    return fila.id;
}

/** Crea un usuario del personal (médico o administrador) de un consultorio. */
export async function crearUsuarioPersonal(datos: {
    consultorioId: number;
    rol: "medico" | "admin";
    nombres: string;
    apellidos: string;
    email: string;
    contrasena: string;
    telefono?: string;
    numDoc?: string;
}): Promise<number> {
    const hash = await bcrypt.hash(datos.contrasena, COSTO_HASH);
    const [fila] = await consultar<{ id: number }>(
        `INSERT INTO usuarios (consultorio_id, rol, nombres, apellidos, email, contrasena_hash, telefono, num_doc, tipo_doc, acepto_datos_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CC', NOW()) RETURNING id`,
        [
            datos.consultorioId,
            datos.rol,
            datos.nombres.trim(),
            datos.apellidos.trim(),
            normalizarEmail(datos.email),
            hash,
            datos.telefono?.trim() || null,
            datos.numDoc?.trim() || null,
        ],
    );
    return fila.id;
}

/** Compara una contraseña con su hash bcrypt. */
export async function verificarContrasena(contrasena: string, hash: string): Promise<boolean> {
    return bcrypt.compare(contrasena, hash);
}

/** Reemplaza la contraseña de un usuario. */
export async function cambiarContrasena(usuarioId: number, nueva: string): Promise<void> {
    const hash = await bcrypt.hash(nueva, COSTO_HASH);
    await consultar("UPDATE usuarios SET contrasena_hash = $1 WHERE id = $2", [hash, usuarioId]);
}

/** Actualiza los datos de contacto del usuario. */
export async function actualizarPerfil(usuarioId: number, datos: { nombres: string; apellidos: string; telefono: string; fechaNac?: string | null }): Promise<void> {
    await consultar(
        "UPDATE usuarios SET nombres = $1, apellidos = $2, telefono = $3, fecha_nac = COALESCE($4::date, fecha_nac) WHERE id = $5",
        [datos.nombres.trim(), datos.apellidos.trim(), datos.telefono.trim(), datos.fechaNac || null, usuarioId],
    );
}

/** Deja constancia de un intento de inicio de sesión. */
export async function registrarIntentoLogin(email: string, exitoso: boolean): Promise<void> {
    await consultar("INSERT INTO intentos_login (email, exitoso) VALUES ($1, $2)", [normalizarEmail(email), exitoso]);
}

/** Cuántos intentos fallidos lleva el correo en la ventana reciente. */
export async function contarIntentosFallidos(email: string): Promise<number> {
    const fila = await consultarUno<{ total: number }>(
        `SELECT COUNT(*)::int AS total FROM intentos_login
         WHERE email = $1 AND exitoso = FALSE AND creado_en > NOW() - ($2 || ' minutes')::interval`,
        [normalizarEmail(email), String(VENTANA_INTENTOS_MINUTOS)],
    );
    return fila?.total ?? 0;
}

/**
 * Busca pacientes para recepción. Por privacidad, un consultorio solo ve por
 * nombre a los pacientes que ya atendió; a cualquier otro paciente lo encuentra
 * únicamente con su documento o correo exactos.
 */
export async function buscarPacientes(consultorioId: number, termino: string, limite = 10): Promise<Usuario[]> {
    const limpio = termino.trim().toLowerCase();
    const patron = `%${limpio}%`;
    return consultar<Usuario>(
        `SELECT ${COLUMNAS} FROM usuarios u
         WHERE u.rol = 'paciente' AND (
             u.num_doc = $2 OR u.email = $2
             OR (
                 EXISTS (SELECT 1 FROM citas c WHERE c.paciente_id = u.id AND c.consultorio_id = $3)
                 AND (u.num_doc ILIKE $1 OR LOWER(u.nombres || ' ' || u.apellidos) LIKE $1)
             )
         )
         ORDER BY u.nombres LIMIT $4`,
        [patron, limpio, consultorioId, limite],
    );
}

/** Indica si el paciente tiene o tuvo citas en el consultorio. */
export async function pacienteDelConsultorio(pacienteId: number, consultorioId: number): Promise<boolean> {
    const fila = await consultarUno("SELECT 1 FROM citas WHERE paciente_id = $1 AND consultorio_id = $2 LIMIT 1", [pacienteId, consultorioId]);
    return fila !== null;
}

/** Nombre completo para mostrar. */
export function nombreCompleto(usuario: { nombres: string; apellidos: string }): string {
    return `${usuario.nombres} ${usuario.apellidos}`.trim();
}
