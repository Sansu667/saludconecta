"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
    actualizarProfesional, agregarEspecialidad, crearProfesional, guardarConsultorio, restablecerContrasena,
} from "@/app/acciones/admin";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { AvisoFormulario, BotonEnvio, Campo } from "@/componentes/formulario";

type Especialidad = { id: number; nombre: string };

export function FormularioNuevoProfesional({ especialidades }: { especialidades: Especialidad[] }) {
    const [estado, accion] = useActionState(crearProfesional, ESTADO_INICIAL);
    if (estado.exito) {
        return (
            <div className="space-y-4">
                <p role="status" className="rounded-xl border-2 border-tinta bg-resaltador-suave p-4">{estado.exito}</p>
                <div className="flex flex-wrap gap-2">
                    <Link href={`/panel/admin/profesionales/${estado.valores?.medicoId}`} className="boton boton-primario">Configurar su horario</Link>
                    <button type="button" className="boton boton-secundario" onClick={() => window.location.reload()}>Agregar otro</button>
                </div>
            </div>
        );
    }
    return (
        <form action={accion} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Campo etiqueta="Nombres" nombre="nombres" estado={estado} />
            <Campo etiqueta="Apellidos" nombre="apellidos" estado={estado} />
            <Campo etiqueta="Correo con el que entrará" nombre="email" type="email" estado={estado} className="sm:col-span-2" />
            <div>
                <label htmlFor="especialidadId" className="etiqueta">Especialidad</label>
                <select id="especialidadId" name="especialidadId" className="campo" defaultValue={estado.valores?.especialidadId}>
                    <option value="">Sin especialidad</option>
                    {especialidades.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
            </div>
            <Campo etiqueta="O escribe una nueva" nombre="especialidadNueva" estado={estado} placeholder="Por ejemplo: Dermatología" />
            <Campo etiqueta="Registro profesional (RETHUS)" nombre="numRegistro" estado={estado} />
            <Campo etiqueta="Duración de la consulta (minutos)" nombre="duracion" type="number" min={10} max={180} step={5} defaultValue={estado.valores?.duracion ?? "30"} estado={estado} />
            <div className="space-y-4 sm:col-span-2">
                <AvisoFormulario estado={estado} />
                <BotonEnvio pendiente="Creando…">Crear cuenta del profesional</BotonEnvio>
            </div>
        </form>
    );
}

export function FormularioPerfilProfesional({ medico, especialidades }: {
    medico: { id: number; especialidad_id: number | null; num_registro: string | null; duracion_cita_min: number; biografia: string | null; activo: boolean };
    especialidades: Especialidad[];
}) {
    const [estado, accion] = useActionState(actualizarProfesional, ESTADO_INICIAL);
    return (
        <form action={accion} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="medicoId" value={medico.id} />
            <div>
                <label htmlFor="especialidadId" className="etiqueta">Especialidad</label>
                <select id="especialidadId" name="especialidadId" className="campo" defaultValue={medico.especialidad_id ?? ""}>
                    <option value="">Sin especialidad</option>
                    {especialidades.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
            </div>
            <Campo etiqueta="Registro profesional" nombre="numRegistro" defaultValue={medico.num_registro ?? ""} estado={estado} />
            <Campo etiqueta="Duración de la consulta (minutos)" nombre="duracion" type="number" min={10} max={180} step={5} defaultValue={String(medico.duracion_cita_min)} estado={estado}
                ayuda="Si la cambias, revisa que las franjas del horario sigan cuadrando." />
            <div>
                <label htmlFor="activo" className="etiqueta">Estado</label>
                <select id="activo" name="activo" className="campo" defaultValue={medico.activo ? "si" : "no"}>
                    <option value="si">Activo, recibe citas</option>
                    <option value="no">Inactivo, no aparece para reservar</option>
                </select>
            </div>
            <div className="sm:col-span-2">
                <label htmlFor="biografia" className="etiqueta">Presentación para los pacientes</label>
                <textarea id="biografia" name="biografia" rows={3} maxLength={600} className="campo" defaultValue={medico.biografia ?? ""}
                    placeholder="Formación, enfoque y qué tipo de consulta atiende." />
            </div>
            <div className="space-y-4 sm:col-span-2">
                <AvisoFormulario estado={estado} />
                <BotonEnvio pendiente="Guardando…">Guardar perfil</BotonEnvio>
            </div>
        </form>
    );
}

export function BotonRestablecer({ usuarioId, texto = "Asignar contraseña temporal" }: { usuarioId: number; texto?: string }) {
    const [estado, accion] = useActionState(restablecerContrasena, ESTADO_INICIAL);
    return (
        <form action={accion} className="space-y-3">
            <input type="hidden" name="usuarioId" value={usuarioId} />
            <AvisoFormulario estado={estado} />
            {!estado.exito && <BotonEnvio className="boton boton-secundario boton-pequeno" pendiente="Generando…">{texto}</BotonEnvio>}
        </form>
    );
}

export function FormularioConsultorio({ consultorio }: {
    consultorio: { nombre: string; ciudad: string | null; direccion: string | null; telefono: string | null; descripcion: string | null };
}) {
    const [estado, accion] = useActionState(guardarConsultorio, ESTADO_INICIAL);
    const v = (campo: keyof typeof consultorio) => estado.valores?.[campo] ?? consultorio[campo] ?? "";
    return (
        <form action={accion} className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre" nombre="nombre" defaultValue={v("nombre")} estado={estado} className="sm:col-span-2" />
            <Campo etiqueta="Ciudad" nombre="ciudad" defaultValue={v("ciudad")} estado={estado} />
            <Campo etiqueta="Teléfono" nombre="telefono" type="tel" defaultValue={v("telefono")} estado={estado} />
            <Campo etiqueta="Dirección" nombre="direccion" defaultValue={v("direccion")} estado={estado} className="sm:col-span-2" />
            <div className="sm:col-span-2">
                <label htmlFor="descripcion" className="etiqueta">Descripción para los pacientes</label>
                <textarea id="descripcion" name="descripcion" rows={3} maxLength={600} className="campo" defaultValue={v("descripcion")}
                    placeholder="Qué atienden, horarios generales, parqueadero, cómo llegar." />
            </div>
            <div className="space-y-4 sm:col-span-2">
                <AvisoFormulario estado={estado} />
                <BotonEnvio pendiente="Guardando…">Guardar</BotonEnvio>
            </div>
        </form>
    );
}

export function FormularioEspecialidad() {
    const [estado, accion] = useActionState(agregarEspecialidad, ESTADO_INICIAL);
    return (
        <form action={accion} className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="nombreEspecialidad" className="sr-only">Nueva especialidad</label>
                <input id="nombreEspecialidad" name="nombre" className="campo sm:max-w-sm" placeholder="Por ejemplo: Nutrición" maxLength={100} />
                <BotonEnvio className="boton boton-secundario" pendiente="Agregando…">Agregar especialidad</BotonEnvio>
            </div>
            <AvisoFormulario estado={estado} />
        </form>
    );
}
