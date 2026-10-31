import "server-only";
import { neon } from "@neondatabase/serverless";
import { SENTENCIAS_ESQUEMA, VERSION_ESQUEMA } from "./esquema";

/**
 * Capa de acceso a datos.
 *
 * En producción usa Neon (PostgreSQL serverless sobre HTTP). En desarrollo,
 * cuando no hay DATABASE_URL, levanta un PostgreSQL embebido (PGlite) en la
 * carpeta .pglite para poder trabajar sin instalar nada.
 */

type Ejecutor = (texto: string, parametros: unknown[]) => Promise<Record<string, unknown>[]>;

interface EstadoGlobalDb {
    ejecutor?: Promise<Ejecutor>;
    listo?: Promise<void>;
}

const estadoGlobal = globalThis as unknown as { __saludConectaDb?: EstadoGlobalDb };
const estado: EstadoGlobalDb = (estadoGlobal.__saludConectaDb ??= {});

function obtenerUrlBaseDatos(): string | undefined {
    return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

async function crearEjecutor(): Promise<Ejecutor> {
    const url = obtenerUrlBaseDatos();
    if (url) {
        const sql = neon(url);
        return async (texto, parametros) => {
            const filas = await sql.query(texto, parametros);
            return filas as Record<string, unknown>[];
        };
    }
    const { PGlite } = await import("@electric-sql/pglite");
    const db = new PGlite(process.env.PGLITE_DIR || "./.pglite");
    await db.waitReady;
    return async (texto, parametros) => {
        const resultado = await db.query(texto, parametros as unknown[]);
        return resultado.rows as Record<string, unknown>[];
    };
}

function obtenerEjecutor(): Promise<Ejecutor> {
    estado.ejecutor ??= crearEjecutor();
    return estado.ejecutor;
}

/**
 * Crea las tablas si hace falta y carga la clínica de demostración.
 * Se ejecuta una sola vez por instancia del servidor.
 */
async function prepararBaseDatos(): Promise<void> {
    const ejecutar = await obtenerEjecutor();
    let versionActual: string | null = null;
    try {
        const filas = await ejecutar("SELECT valor FROM meta WHERE clave = 'version_esquema'", []);
        versionActual = (filas[0]?.valor as string) ?? null;
    } catch {
        versionActual = null;
    }
    if (versionActual !== VERSION_ESQUEMA) {
        for (const sentencia of SENTENCIAS_ESQUEMA) {
            await ejecutar(sentencia, []);
        }
        await ejecutar(
            `INSERT INTO meta (clave, valor) VALUES ('version_esquema', $1)
             ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor`,
            [VERSION_ESQUEMA],
        );
    }
    const demo = await ejecutar("SELECT id FROM consultorios WHERE slug = 'demo'", []);
    if (demo.length === 0) {
        const { sembrarDemo } = await import("./demo");
        await sembrarDemo();
    }
}

/**
 * Ejecuta una consulta parametrizada ($1, $2...) y devuelve las filas.
 * @param texto Sentencia SQL con marcadores posicionales.
 * @param parametros Valores para los marcadores.
 * @return Filas resultantes tipadas como T.
 */
export async function consultar<T = Record<string, unknown>>(
    texto: string,
    parametros: unknown[] = [],
): Promise<T[]> {
    if (!estado.listo) {
        estado.listo = prepararBaseDatos().catch((error) => {
            estado.listo = undefined;
            throw error;
        });
    }
    await estado.listo;
    const ejecutar = await obtenerEjecutor();
    return (await ejecutar(texto, parametros)) as T[];
}

/**
 * Igual que consultar, pero sin esperar la preparación inicial.
 * Solo la usa el sembrado de datos, que corre dentro de esa preparación.
 */
export async function consultarSinPreparar<T = Record<string, unknown>>(
    texto: string,
    parametros: unknown[] = [],
): Promise<T[]> {
    const ejecutar = await obtenerEjecutor();
    return (await ejecutar(texto, parametros)) as T[];
}

/** Devuelve la primera fila o null. */
export async function consultarUno<T = Record<string, unknown>>(
    texto: string,
    parametros: unknown[] = [],
): Promise<T | null> {
    const filas = await consultar<T>(texto, parametros);
    return filas[0] ?? null;
}

/** Indica si un error de PostgreSQL es una violación de unicidad. */
export function esViolacionUnicidad(error: unknown): boolean {
    const codigo = (error as { code?: string })?.code;
    if (codigo === "23505") return true;
    const mensaje = String((error as { message?: string })?.message ?? "");
    return mensaje.includes("duplicate key") || mensaje.includes("23505");
}
