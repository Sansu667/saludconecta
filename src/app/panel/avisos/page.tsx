import Link from "next/link";
import { leerTodosLosAvisos } from "@/app/acciones/cuenta";
import { EncabezadoPagina, Vacio } from "@/componentes/panel/ui";
import { generarRecordatorios, listarNotificaciones } from "@/lib/modelos/notificaciones";
import { requerirUsuario } from "@/lib/sesion";
import { formatearFechaCorta, formatearHora } from "@/lib/tiempo";

export const metadata = { title: "Avisos" };

export default async function PaginaAvisos() {
    const usuario = await requerirUsuario();
    if (usuario.rol === "paciente") await generarRecordatorios(usuario.id);
    const avisos = await listarNotificaciones(usuario.id, 60);
    const hayNuevos = avisos.some((a) => !a.leida);

    return (
        <>
            <EncabezadoPagina
                titulo="Avisos"
                descripcion="Confirmaciones, cambios de citas y recordatorios."
                acciones={hayNuevos ? (
                    <form action={leerTodosLosAvisos}><button type="submit" className="boton boton-secundario boton-pequeno">Marcar todo como leído</button></form>
                ) : undefined}
            />
            {avisos.length === 0 ? (
                <Vacio titulo="Sin avisos">Cuando alguien agende, cancele o mueva una cita, te lo contamos aquí.</Vacio>
            ) : (
                <ul className="divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-white">
                    {avisos.map((a) => {
                        const contenido = (
                            <>
                                <span className="flex items-start justify-between gap-4">
                                    <span className="flex items-center gap-2 font-bold">
                                        {!a.leida && <span className="size-2.5 shrink-0 rounded-full bg-resaltador ring-2 ring-tinta/20" aria-label="Nuevo" />}
                                        {a.titulo}
                                    </span>
                                    <span className="shrink-0 text-xs text-gris tabular-nums">{formatearFechaCorta(a.creado_en)}, {formatearHora(a.creado_en)}</span>
                                </span>
                                {a.cuerpo && <span className="mt-1 block text-[0.95rem] text-gris">{a.cuerpo}</span>}
                            </>
                        );
                        return (
                            <li key={a.id} className={a.leida ? "" : "bg-resaltador-suave/35"}>
                                {a.enlace ? (
                                    <Link href={a.enlace} className="block px-5 py-4 hover:bg-menta/60">{contenido}</Link>
                                ) : (
                                    <div className="px-5 py-4">{contenido}</div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}
