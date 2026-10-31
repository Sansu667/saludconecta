import Link from "next/link";
import { Marca } from "./Marca";

export function EncabezadoSitio() {
    return (
        <header className="sticky top-0 z-30 border-b border-linea/70 bg-papel/90 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                <Marca />
                <nav aria-label="Principal" className="hidden items-center gap-7 text-[0.97rem] md:flex">
                    <Link href="/#como-funciona" className="hover:text-pino">Cómo funciona</Link>
                    <Link href="/#precios" className="hover:text-pino">Precios</Link>
                    <Link href="/demo" className="hover:text-pino">Probar la demo</Link>
                    <Link href="/ingresar" className="hover:text-pino">Ingresar</Link>
                    <Link href="/registro" className="boton boton-primario boton-pequeno">Crear mi consultorio</Link>
                </nav>
                <details className="relative md:hidden">
                    <summary className="boton boton-secundario boton-pequeno list-none [&::-webkit-details-marker]:hidden">Menú</summary>
                    <div className="absolute right-0 mt-2 w-60 rounded-xl border border-linea bg-white p-2 shadow-lg">
                        <Link href="/#como-funciona" className="block rounded-lg px-3 py-2.5 hover:bg-menta">Cómo funciona</Link>
                        <Link href="/#precios" className="block rounded-lg px-3 py-2.5 hover:bg-menta">Precios</Link>
                        <Link href="/demo" className="block rounded-lg px-3 py-2.5 hover:bg-menta">Probar la demo</Link>
                        <Link href="/ingresar" className="block rounded-lg px-3 py-2.5 hover:bg-menta">Ingresar</Link>
                        <Link href="/registro" className="boton boton-primario mt-2 w-full">Crear mi consultorio</Link>
                    </div>
                </details>
            </div>
        </header>
    );
}

export function PieSitio() {
    const anio = new Date().getFullYear();
    return (
        <footer className="bg-tinta text-papel/80">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
                <div>
                    <Marca claro />
                    <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed">
                        Agenda en línea para consultorios y clínicas. Hecho en Colombia, pensado para la recepción que contesta el teléfono a las siete de la mañana.
                    </p>
                </div>
                <div>
                    <h2 className="font-sans text-sm font-bold text-papel">Producto</h2>
                    <ul className="mt-3 space-y-2 text-[0.95rem]">
                        <li><Link href="/#como-funciona" className="hover:text-resaltador">Cómo funciona</Link></li>
                        <li><Link href="/#precios" className="hover:text-resaltador">Precios</Link></li>
                        <li><Link href="/demo" className="hover:text-resaltador">Probar la demo</Link></li>
                        <li><Link href="/c/demo" className="hover:text-resaltador">Agendar en el consultorio demo</Link></li>
                    </ul>
                </div>
                <div>
                    <h2 className="font-sans text-sm font-bold text-papel">Legal y contacto</h2>
                    <ul className="mt-3 space-y-2 text-[0.95rem]">
                        <li><Link href="/privacidad" className="hover:text-resaltador">Política de tratamiento de datos</Link></li>
                        <li><Link href="/terminos" className="hover:text-resaltador">Términos de uso</Link></li>
                        <li><Link href="/#contacto" className="hover:text-resaltador">Hablar con nosotros</Link></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-papel/10">
                <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-papel/60 sm:px-6">
                    © {anio} SaludConecta. Proyecto de Edgar Santiago Suarez Alzate, Tecnólogo en Análisis y Desarrollo de Software, SENA.
                </p>
            </div>
        </footer>
    );
}
