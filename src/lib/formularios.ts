import { z } from "zod";

/** Estado que devuelven las acciones de formulario a la vista. */
export interface EstadoFormulario {
    error?: string;
    exito?: string;
    campos?: Record<string, string>;
    valores?: Record<string, string>;
}

export const ESTADO_INICIAL: EstadoFormulario = {};

/** Convierte los errores de Zod en un mensaje por campo. */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
    const campos: Record<string, string> = {};
    for (const problema of error.issues) {
        const clave = String(problema.path[0] ?? "general");
        if (!campos[clave]) campos[clave] = problema.message;
    }
    return campos;
}

/** Copia los valores de texto del formulario para volver a pintarlos (nunca contraseñas). */
export function valoresVisibles(datos: FormData): Record<string, string> {
    const valores: Record<string, string> = {};
    for (const [clave, valor] of datos.entries()) {
        if (typeof valor === "string" && !clave.toLowerCase().includes("contrasena") && !clave.startsWith("$")) {
            valores[clave] = valor;
        }
    }
    return valores;
}

export function texto(datos: FormData, clave: string): string {
    const valor = datos.get(clave);
    return typeof valor === "string" ? valor.trim() : "";
}

export const TIPOS_DOCUMENTO = [
    { valor: "CC", etiqueta: "Cédula de ciudadanía" },
    { valor: "TI", etiqueta: "Tarjeta de identidad" },
    { valor: "RC", etiqueta: "Registro civil" },
    { valor: "CE", etiqueta: "Cédula de extranjería" },
    { valor: "PA", etiqueta: "Pasaporte" },
    { valor: "PPT", etiqueta: "Permiso por protección temporal" },
];

export const esquemaContrasena = z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(72, "La contraseña es demasiado larga.");

export const esquemaEmail = z.string().trim().toLowerCase().email("Escribe un correo válido, por ejemplo nombre@correo.com.").max(150);

export const esquemaPaciente = z.object({
    nombres: z.string().trim().min(2, "Escribe tus nombres.").max(100),
    apellidos: z.string().trim().min(2, "Escribe tus apellidos.").max(100),
    tipoDoc: z.enum(TIPOS_DOCUMENTO.map((t) => t.valor) as [string, ...string[]], { message: "Elige el tipo de documento." }),
    numDoc: z.string().trim().regex(/^[A-Za-z0-9-]{4,20}$/, "Escribe el número de documento sin puntos ni espacios."),
    email: esquemaEmail,
    telefono: z.string().trim().regex(/^[0-9 +()-]{7,20}$/, "Escribe un teléfono de contacto."),
    contrasena: esquemaContrasena,
    aceptaDatos: z.literal("si", { message: "Necesitamos tu autorización para tratar tus datos y poder agendar." }),
});

/** Destino seguro tras iniciar sesión: solo rutas internas. */
export function destinoSeguro(destino: string | null | undefined, porDefecto: string): string {
    if (!destino || !destino.startsWith("/") || destino.startsWith("//") || destino.includes("\\")) return porDefecto;
    return destino;
}
