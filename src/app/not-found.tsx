import Link from "next/link";
import { Marca } from "@/componentes/Marca";

export default function NoEncontrado() {
    return (
        <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
            <Marca />
            <h1 className="mt-10 text-5xl font-extrabold">Este turno no existe</h1>
            <p className="mt-4 text-lg text-gris">La página que buscas no está, o no tienes acceso a ella. Revisa el enlace o vuelve al inicio.</p>
            <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/" className="boton boton-primario">Ir al inicio</Link>
                <Link href="/panel" className="boton boton-secundario">Ir a mi panel</Link>
            </div>
        </div>
    );
}
