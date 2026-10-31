import Link from "next/link";

/** Símbolo de la marca: una columna de agenda con un turno resaltado. */
export function SimboloMarca({ tamano = 28 }: { tamano?: number }) {
    return (
        <svg width={tamano} height={tamano} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="#0e2f2c" />
            <rect x="7" y="7" width="18" height="4.5" rx="1.5" fill="#fafbf9" opacity="0.35" />
            <rect x="7" y="13.75" width="18" height="4.5" rx="1.5" fill="#f5dc4a" />
            <rect x="7" y="20.5" width="18" height="4.5" rx="1.5" fill="#fafbf9" opacity="0.35" />
        </svg>
    );
}

export function Marca({ href = "/", claro = false }: { href?: string; claro?: boolean }) {
    return (
        <Link href={href} className="inline-flex items-center gap-2.5 rounded-md" aria-label="SaludConecta, inicio">
            <SimboloMarca />
            <span className={`font-display text-[1.32rem] font-bold tracking-tight ${claro ? "text-papel" : "text-tinta"}`}>
                SaludConecta
            </span>
        </Link>
    );
}
