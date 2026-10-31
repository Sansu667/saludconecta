"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ElementoNav {
    href: string;
    etiqueta: string;
    icono: keyof typeof ICONOS;
    contador?: number;
    exacto?: boolean;
}

/** Iconos de trazo simple, dibujados a mano para el producto. */
const ICONOS = {
    inicio: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
    agenda: (
        <>
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M4 10h16M9 3v4M15 3v4" />
            <rect x="7.5" y="13" width="5" height="3" rx="0.6" fill="currentColor" stroke="none" />
        </>
    ),
    nueva: <path d="M12 5v14M5 12h14" />,
    lista: <path d="M8 7h11M8 12h11M8 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01" />,
    reloj: (
        <>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v4l2.5 2.5" />
        </>
    ),
    personas: (
        <>
            <circle cx="9" cy="9" r="3" />
            <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5M16 6.5a2.6 2.6 0 0 1 0 5M17.5 14.6c1.6.5 2.6 1.9 3 4.4" />
        </>
    ),
    reporte: <path d="M5 20V10M10 20V4M15 20v-7M20 20v-4" />,
    edificio: <path d="M5 20V6l7-2 7 2v14M9 9h1M14 9h1M9 13h1M14 13h1M10 20v-3h4v3" />,
    campana: <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5h4" />,
    cuenta: (
        <>
            <circle cx="12" cy="9" r="3.5" />
            <path d="M5 20c.8-3.6 3.7-5.5 7-5.5s6.2 1.9 7 5.5" />
        </>
    ),
};

function Icono({ nombre }: { nombre: keyof typeof ICONOS }) {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONOS[nombre]}
        </svg>
    );
}

function estaActivo(ruta: string, elemento: ElementoNav): boolean {
    return elemento.exacto ? ruta === elemento.href : ruta === elemento.href || ruta.startsWith(`${elemento.href}/`);
}

export function NavegacionLateral({ elementos }: { elementos: ElementoNav[] }) {
    const ruta = usePathname();
    return (
        <nav aria-label="Panel" className="space-y-1">
            {elementos.map((e) => {
                const activo = estaActivo(ruta, e);
                return (
                    <Link
                        key={e.href}
                        href={e.href}
                        aria-current={activo ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-bold transition-colors ${
                            activo ? "bg-papel text-tinta" : "text-papel/75 hover:bg-papel/10 hover:text-papel"
                        }`}
                    >
                        <Icono nombre={e.icono} />
                        <span className="flex-1">{e.etiqueta}</span>
                        {e.contador ? (
                            <span className="rounded-full bg-resaltador px-2 py-0.5 text-xs text-tinta">{e.contador}</span>
                        ) : null}
                    </Link>
                );
            })}
        </nav>
    );
}

export function NavegacionInferior({ elementos }: { elementos: ElementoNav[] }) {
    const ruta = usePathname();
    return (
        <nav aria-label="Panel" className="fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
            <ul className="flex">
                {elementos.map((e) => {
                    const activo = estaActivo(ruta, e);
                    return (
                        <li key={e.href} className="flex-1">
                            <Link
                                href={e.href}
                                aria-current={activo ? "page" : undefined}
                                className={`relative flex flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-[0.7rem] font-bold ${activo ? "text-tinta" : "text-gris-suave"}`}
                            >
                                {activo && <span aria-hidden="true" className="absolute top-0 h-1 w-8 rounded-b bg-resaltador" />}
                                <Icono nombre={e.icono} />
                                <span className="leading-tight">{e.etiqueta}</span>
                                {e.contador ? (
                                    <span className="absolute right-[calc(50%-1.2rem)] top-1.5 size-2.5 rounded-full bg-alerta" aria-label={`${e.contador} sin leer`} />
                                ) : null}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
