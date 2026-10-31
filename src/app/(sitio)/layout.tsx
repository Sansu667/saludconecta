import { EncabezadoSitio, PieSitio } from "@/componentes/sitio";

export default function LayoutSitio({ children }: { children: React.ReactNode }) {
    return (
        <>
            <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-resaltador focus:px-4 focus:py-2">
                Saltar al contenido
            </a>
            <EncabezadoSitio />
            <main id="contenido">{children}</main>
            <PieSitio />
        </>
    );
}
