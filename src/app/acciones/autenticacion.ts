"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
    type EstadoFormulario, destinoSeguro, erroresPorCampo, esquemaContrasena, esquemaEmail, esquemaPaciente, texto, valoresVisibles,
} from "@/lib/formularios";
import {
    MAXIMO_INTENTOS_LOGIN, VENTANA_INTENTOS_MINUTOS, buscarUsuarioConHash, contarIntentosFallidos, crearPaciente,
    crearUsuarioPersonal, existeEmail, registrarIntentoLogin, verificarContrasena,
} from "@/lib/modelos/usuarios";
import { crearConsultorio, slugDisponible } from "@/lib/modelos/consultorios";
import { auditar, notificar } from "@/lib/modelos/notificaciones";
import { cerrarSesion, iniciarSesion, rutaInicioPorRol } from "@/lib/sesion";
import { CONTRASENA_DEMO, CORREOS_DEMO } from "@/lib/db/demo";

/** Controlador del inicio de sesión. */
export async function ingresar(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const email = texto(datos, "email").toLowerCase();
    const contrasena = String(datos.get("contrasena") ?? "");
    const valores = { email };
    if (!email || !contrasena) return { error: "Escribe tu correo y tu contraseña.", valores };

    if ((await contarIntentosFallidos(email)) >= MAXIMO_INTENTOS_LOGIN) {
        return {
            error: `Hubo demasiados intentos fallidos con este correo. Por seguridad, espera ${VENTANA_INTENTOS_MINUTOS} minutos e inténtalo de nuevo.`,
            valores,
        };
    }

    const usuario = await buscarUsuarioConHash(email);
    const valido = usuario ? await verificarContrasena(contrasena, usuario.contrasena_hash) : false;
    await registrarIntentoLogin(email, valido);
    if (!usuario || !valido) {
        return { error: "El correo o la contraseña no coinciden. Revisa e inténtalo otra vez.", valores };
    }

    await iniciarSesion(usuario);
    await auditar(usuario.id, "inicio_sesion");
    redirect(destinoSeguro(texto(datos, "siguiente"), rutaInicioPorRol(usuario.rol)));
}

/** Controlador del registro de pacientes. */
export async function registrarPaciente(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const valores = valoresVisibles(datos);
    const resultado = esquemaPaciente.safeParse({
        nombres: texto(datos, "nombres"),
        apellidos: texto(datos, "apellidos"),
        tipoDoc: texto(datos, "tipoDoc"),
        numDoc: texto(datos, "numDoc"),
        email: texto(datos, "email"),
        telefono: texto(datos, "telefono"),
        contrasena: String(datos.get("contrasena") ?? ""),
        aceptaDatos: texto(datos, "aceptaDatos"),
    });
    if (!resultado.success) {
        return { error: "Revisa los campos marcados.", campos: erroresPorCampo(resultado.error), valores };
    }
    if (await existeEmail(resultado.data.email)) {
        return { error: "Ya existe una cuenta con ese correo. Inicia sesión.", campos: { email: "Este correo ya está registrado." }, valores };
    }
    const id = await crearPaciente({ ...resultado.data, fechaNac: texto(datos, "fechaNac") || null });
    await iniciarSesion({ id, rol: "paciente", consultorio_id: null });
    await auditar(id, "registro_paciente", "usuario", id);
    await notificar(id, "Tu cuenta está lista", "Ya puedes agendar citas en cualquier consultorio que use SaludConecta.", "/panel/paciente/agendar");
    redirect(destinoSeguro(texto(datos, "siguiente"), "/panel/paciente"));
}

const esquemaConsultorio = z.object({
    consultorio: z.string().trim().min(3, "Escribe el nombre del consultorio o clínica.").max(120),
    ciudad: z.string().trim().min(2, "Escribe la ciudad.").max(80),
    telefonoConsultorio: z.string().trim().regex(/^[0-9 +()-]{7,20}$/, "Escribe un teléfono de contacto."),
    nombres: z.string().trim().min(2, "Escribe tus nombres.").max(100),
    apellidos: z.string().trim().min(2, "Escribe tus apellidos.").max(100),
    email: esquemaEmail,
    contrasena: esquemaContrasena,
    aceptaTerminos: z.literal("si", { message: "Debes aceptar los términos para crear la cuenta." }),
});

/** Controlador del alta de un consultorio nuevo con su administrador. */
export async function registrarConsultorio(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const valores = valoresVisibles(datos);
    const resultado = esquemaConsultorio.safeParse({
        consultorio: texto(datos, "consultorio"),
        ciudad: texto(datos, "ciudad"),
        telefonoConsultorio: texto(datos, "telefonoConsultorio"),
        nombres: texto(datos, "nombres"),
        apellidos: texto(datos, "apellidos"),
        email: texto(datos, "email"),
        contrasena: String(datos.get("contrasena") ?? ""),
        aceptaTerminos: texto(datos, "aceptaTerminos"),
    });
    if (!resultado.success) {
        return { error: "Revisa los campos marcados.", campos: erroresPorCampo(resultado.error), valores };
    }
    const d = resultado.data;
    if (await existeEmail(d.email)) {
        return { error: "Ya existe una cuenta con ese correo.", campos: { email: "Este correo ya está registrado." }, valores };
    }
    const slug = await slugDisponible(d.consultorio);
    const consultorioId = await crearConsultorio({ nombre: d.consultorio, slug, ciudad: d.ciudad, telefono: d.telefonoConsultorio });
    const usuarioId = await crearUsuarioPersonal({
        consultorioId, rol: "admin", nombres: d.nombres, apellidos: d.apellidos, email: d.email, contrasena: d.contrasena,
    });
    await iniciarSesion({ id: usuarioId, rol: "admin", consultorio_id: consultorioId });
    await auditar(usuarioId, "registro_consultorio", "consultorio", consultorioId);
    await notificar(
        usuarioId,
        "Bienvenido a SaludConecta",
        "Tu consultorio ya existe. Sigue los tres pasos del inicio para recibir la primera cita.",
        "/panel/admin",
    );
    redirect("/panel/admin?nuevo=1");
}

/** Entra a la demo con el rol elegido, sin escribir credenciales. */
export async function ingresarDemo(datos: FormData): Promise<void> {
    const rol = texto(datos, "rol") as keyof typeof CORREOS_DEMO;
    const email = CORREOS_DEMO[rol];
    if (!email) redirect("/demo");
    const usuario = await buscarUsuarioConHash(email);
    if (!usuario || !(await verificarContrasena(CONTRASENA_DEMO, usuario.contrasena_hash))) {
        redirect("/demo?error=1");
    }
    await iniciarSesion(usuario);
    redirect(rutaInicioPorRol(usuario.rol));
}

export async function salir(): Promise<void> {
    await cerrarSesion();
    redirect("/");
}
