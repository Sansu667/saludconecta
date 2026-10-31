import "server-only";
import type { Usuario } from "./modelos/usuarios";
import type { CitaDetalle } from "./modelos/citas";

/** Reglas de acceso a una cita según el rol. */
export function puedeVerCita(usuario: Usuario, cita: CitaDetalle): boolean {
    if (usuario.rol === "paciente") return cita.paciente_id === usuario.id;
    if (usuario.rol === "medico") return cita.medico_usuario_id === usuario.id;
    return cita.consultorio_id === usuario.consultorio_id;
}

/** Quién puede registrar diagnóstico: solo el médico de la cita. */
export function puedeRegistrarAtencion(usuario: Usuario, cita: CitaDetalle): boolean {
    return usuario.rol === "medico" && cita.medico_usuario_id === usuario.id;
}

/** Ruta del detalle de la cita para cada rol. */
export function rutaCita(rol: Usuario["rol"], citaId: number): string {
    if (rol === "paciente") return `/panel/paciente/cita/${citaId}`;
    if (rol === "medico") return `/panel/medico/cita/${citaId}`;
    return `/panel/admin/cita/${citaId}`;
}
