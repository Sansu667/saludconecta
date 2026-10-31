"use client";

import { useEffect, useState } from "react";

/** Muestra el enlace público del consultorio con un botón para copiarlo. */
export function CopiarEnlace({ ruta }: { ruta: string }) {
    const [copiado, setCopiado] = useState(false);
    const [base, setBase] = useState("");
    const enlace = `${base}${ruta}`;

    useEffect(() => {
        setBase(window.location.origin);
    }, []);

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="block flex-1 truncate rounded-lg bg-papel px-3 py-2.5 text-[0.95rem] text-tinta">{enlace || ruta}</code>
            <div className="flex gap-2">
                <button
                    type="button"
                    className="boton boton-resaltado boton-pequeno"
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(enlace);
                            setCopiado(true);
                            setTimeout(() => setCopiado(false), 2000);
                        } catch {
                            setCopiado(false);
                        }
                    }}
                >
                    {copiado ? "Copiado" : "Copiar enlace"}
                </button>
                <a href={ruta} target="_blank" rel="noreferrer" className="boton boton-secundario boton-pequeno border-papel text-papel hover:bg-papel/10">Abrir</a>
            </div>
        </div>
    );
}
