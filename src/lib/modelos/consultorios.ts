import "server-only";
import { consultar, consultarUno } from "../db";

export interface Consultorio {
    id: number;
    nombre: string;
    slug: string;
    ciudad: string | null;
    direccion: string | null;
    telefono: string | null;
    descripcion: string | null;
    plan: string;
    es_demo: boolean;
}

const COLUMNAS = "id, nombre, slug, ciudad, direccion, telefono, descripcion, plan, es_demo";

export const SLUGS_RESERVADOS = new Set([
    "admin", "api", "panel", "ingresar", "registro", "demo", "precios", "privacidad", "terminos", "plataforma", "c", "salir",
]);

/** Convierte un nombre en un identificador para la URL pública. */
export function generarSlug(texto: string): string {
    return texto
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50) || "consultorio";
}

export async function buscarConsultorioPorSlug(slug: string): Promise<Consultorio | null> {
    return consultarUno<Consultorio>(`SELECT ${COLUMNAS} FROM consultorios WHERE slug = $1`, [slug]);
}

export async function buscarConsultorioPorId(id: number): Promise<Consultorio | null> {
    return consultarUno<Consultorio>(`SELECT ${COLUMNAS} FROM consultorios WHERE id = $1`, [id]);
}

/** Busca un slug libre a partir de una base, añadiendo un número si hace falta. */
export async function slugDisponible(base: string): Promise<string> {
    const raiz = generarSlug(base);
    for (let intento = 0; intento < 50; intento += 1) {
        const candidato = intento === 0 ? raiz : `${raiz}-${intento + 1}`;
        if (SLUGS_RESERVADOS.has(candidato)) continue;
        const existe = await consultarUno("SELECT 1 FROM consultorios WHERE slug = $1", [candidato]);
        if (!existe) return candidato;
    }
    return `${raiz}-${Date.now().toString(36)}`;
}

/** Crea un consultorio y devuelve su id. */
export async function crearConsultorio(datos: { nombre: string; slug: string; ciudad: string; telefono: string }): Promise<number> {
    const [fila] = await consultar<{ id: number }>(
        "INSERT INTO consultorios (nombre, slug, ciudad, telefono) VALUES ($1, $2, $3, $4) RETURNING id",
        [datos.nombre.trim(), datos.slug, datos.ciudad.trim(), datos.telefono.trim()],
    );
    return fila.id;
}

/** Actualiza los datos públicos del consultorio. */
export async function actualizarConsultorio(
    id: number,
    datos: { nombre: string; ciudad: string; direccion: string; telefono: string; descripcion: string },
): Promise<void> {
    await consultar(
        "UPDATE consultorios SET nombre = $1, ciudad = $2, direccion = $3, telefono = $4, descripcion = $5 WHERE id = $6",
        [datos.nombre.trim(), datos.ciudad.trim(), datos.direccion.trim(), datos.telefono.trim(), datos.descripcion.trim(), id],
    );
}

/** Lista consultorios con al menos un médico activo con horario. */
export async function listarConsultoriosConAgenda(termino = ""): Promise<Array<Consultorio & { medicos: number }>> {
    return consultar(
        `SELECT c.id, c.nombre, c.slug, c.ciudad, c.direccion, c.telefono, c.descripcion, c.plan, c.es_demo,
                COUNT(DISTINCT m.id)::int AS medicos
         FROM consultorios c
         JOIN medicos m ON m.consultorio_id = c.id AND m.activo
         JOIN disponibilidad d ON d.medico_id = m.id
         WHERE ($1 = '' OR LOWER(c.nombre || ' ' || COALESCE(c.ciudad, '')) LIKE '%' || LOWER($1) || '%')
         GROUP BY c.id
         ORDER BY c.es_demo DESC, c.nombre
         LIMIT 30`,
        [termino.trim()],
    );
}

export interface Especialidad {
    id: number;
    nombre: string;
    medicos: number;
}

export async function listarEspecialidades(consultorioId: number): Promise<Especialidad[]> {
    return consultar<Especialidad>(
        `SELECT e.id, e.nombre, COUNT(m.id) FILTER (WHERE m.activo)::int AS medicos
         FROM especialidades e LEFT JOIN medicos m ON m.especialidad_id = e.id
         WHERE e.consultorio_id = $1
         GROUP BY e.id ORDER BY e.nombre`,
        [consultorioId],
    );
}

export async function crearEspecialidad(consultorioId: number, nombre: string): Promise<void> {
    await consultar(
        "INSERT INTO especialidades (consultorio_id, nombre) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [consultorioId, nombre.trim()],
    );
}

export async function eliminarEspecialidad(consultorioId: number, id: number): Promise<void> {
    await consultar("DELETE FROM especialidades WHERE id = $1 AND consultorio_id = $2", [id, consultorioId]);
}

/** Crea o devuelve el id de una especialidad por nombre. */
export async function asegurarEspecialidad(consultorioId: number, nombre: string): Promise<number> {
    await crearEspecialidad(consultorioId, nombre);
    const fila = await consultarUno<{ id: number }>(
        "SELECT id FROM especialidades WHERE consultorio_id = $1 AND nombre = $2",
        [consultorioId, nombre.trim()],
    );
    return fila!.id;
}
