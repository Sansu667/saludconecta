import Link from "next/link";
import { Marca } from "@/componentes/Marca";
import { NavegacionInferior, NavegacionLateral, type ElementoNav } from "@/componentes/panel/Navegacion";
import { salir } from "@/app/acciones/autenticacion";
import { buscarConsultorioPorId } from "@/lib/modelos/consultorios";
import { contarNoLeidas } from "@/lib/modelos/notificaciones";
import { nombreCompleto } from "@/lib/modelos/usuarios";
import { requerirUsuario } from "@/lib/sesion";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const ETIQUETA_ROL = { paciente: "Paciente", medico: "Profesional", admin: "Administración" } as const;

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
    const usuario = await requerirUsuario();
    const [noLeidas, consultorio] = await Promise.all([
        contarNoLeidas(usuario.id),
        usuario.consultorio_id ? buscarConsultorioPorId(usuario.consultorio_id) : Promise.resolve(null),
    ]);

    let lateral: ElementoNav[];
    let inferior: ElementoNav[];
    if (usuario.rol === "admin") {
        lateral = [
            { href: "/panel/admin", etiqueta: "Resumen", icono: "inicio", exacto: true },
            { href: "/panel/admin/agenda", etiqueta: "Agenda del día", icono: "agenda" },
            { href: "/panel/admin/reportes", etiqueta: "Citas y reportes", icono: "reporte" },
            { href: "/panel/admin/profesionales", etiqueta: "Profesionales", icono: "personas" },
            { href: "/panel/admin/consultorio", etiqueta: "Consultorio", icono: "edificio" },
            { href: "/panel/avisos", etiqueta: "Avisos", icono: "campana", contador: noLeidas },
            { href: "/panel/cuenta", etiqueta: "Mi cuenta", icono: "cuenta" },
        ];
        inferior = [lateral[0], { ...lateral[1], etiqueta: "Agenda" }, { ...lateral[2], etiqueta: "Reportes" }, { ...lateral[3], etiqueta: "Equipo" }, lateral[4]];
    } else if (usuario.rol === "medico") {
        lateral = [
            { href: "/panel/medico", etiqueta: "Mi agenda", icono: "agenda", exacto: true },
            { href: "/panel/medico/horario", etiqueta: "Horario y ausencias", icono: "reloj" },
            { href: "/panel/avisos", etiqueta: "Avisos", icono: "campana", contador: noLeidas },
            { href: "/panel/cuenta", etiqueta: "Mi cuenta", icono: "cuenta" },
        ];
        inferior = [lateral[0], { ...lateral[1], etiqueta: "Horario" }, lateral[2], { ...lateral[3], etiqueta: "Cuenta" }];
    } else {
        lateral = [
            { href: "/panel/paciente", etiqueta: "Inicio", icono: "inicio", exacto: true },
            { href: "/panel/paciente/agendar", etiqueta: "Agendar cita", icono: "nueva" },
            { href: "/panel/paciente/citas", etiqueta: "Mis citas", icono: "lista" },
            { href: "/panel/avisos", etiqueta: "Avisos", icono: "campana", contador: noLeidas },
            { href: "/panel/cuenta", etiqueta: "Mi cuenta", icono: "cuenta" },
        ];
        inferior = [lateral[0], { ...lateral[1], etiqueta: "Agendar" }, { ...lateral[2], etiqueta: "Citas" }, lateral[3], { ...lateral[4], etiqueta: "Cuenta" }];
    }

    return (
        <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
            <aside className="hidden flex-col bg-tinta px-4 py-6 text-papel lg:sticky lg:top-0 lg:flex lg:h-dvh">
                <div className="px-2"><Marca href="/panel" claro /></div>
                {consultorio && (
                    <p className="mt-6 rounded-lg bg-papel/10 px-3 py-2.5 text-sm leading-snug">
                        <span className="block text-papel/60">Consultorio</span>
                        <span className="font-bold">{consultorio.nombre}</span>
                    </p>
                )}
                <div className="mt-6 flex-1"><NavegacionLateral elementos={lateral} /></div>
                <div className="border-t border-papel/15 px-2 pt-4 text-sm">
                    <p className="font-bold">{nombreCompleto(usuario)}</p>
                    <p className="text-papel/60">{ETIQUETA_ROL[usuario.rol]}</p>
                    <form action={salir} className="mt-3">
                        <button type="submit" className="text-papel/75 underline underline-offset-4 hover:text-resaltador">Cerrar sesión</button>
                    </form>
                </div>
            </aside>

            <div className="flex min-w-0 flex-col">
                <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-linea bg-papel/95 px-4 backdrop-blur lg:hidden">
                    <Marca href="/panel" />
                    <form action={salir}>
                        <button type="submit" className="text-sm font-bold text-gris underline underline-offset-4">Salir</button>
                    </form>
                </header>
                {usuario.es_demo && (
                    <p className="border-b border-resaltador bg-resaltador-suave px-4 py-2 text-center text-sm">
                        Estás en la demo como {ETIQUETA_ROL[usuario.rol].toLowerCase()}. Los datos se reinician cada día. <Link href="/registro" className="font-bold underline underline-offset-2">Crear mi consultorio</Link>
                    </p>
                )}
                <main id="contenido" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
                    {children}
                </main>
            </div>
            <NavegacionInferior elementos={inferior} />
        </div>
    );
}
