/**
 * Gráficos de una sola serie, en HTML para que se lean bien en el celular.
 * Un solo color (pino), etiquetas en tinta y cada barra con su valor al pasar
 * el cursor o tocarla. No hay leyenda porque el título nombra la serie.
 */

export function BarrasHorizontales({ datos, unidad = "citas" }: { datos: Array<{ etiqueta: string; valor: number }>; unidad?: string }) {
    const maximo = Math.max(1, ...datos.map((d) => d.valor));
    if (datos.length === 0) return <p className="text-gris">Sin datos en este periodo.</p>;
    return (
        <ul className="space-y-3">
            {datos.map((d) => (
                <li key={d.etiqueta} className="grid grid-cols-[minmax(7rem,10rem)_1fr_2.5rem] items-center gap-3" title={`${d.etiqueta}: ${d.valor} ${unidad}`}>
                    <span className="truncate text-sm">{d.etiqueta}</span>
                    <span className="h-3.5 rounded-r-[4px] bg-pino" style={{ width: `${Math.max(2, (d.valor / maximo) * 100)}%` }} aria-hidden="true" />
                    <span className="text-right text-sm font-bold tabular-nums">{d.valor}</span>
                </li>
            ))}
        </ul>
    );
}

export function BarrasDiarias({ datos, etiquetaDia }: { datos: Array<{ fecha: string; valor: number }>; etiquetaDia: (fecha: string) => string }) {
    const maximo = Math.max(1, ...datos.map((d) => d.valor));
    const marcas = [0, Math.floor(datos.length / 2), datos.length - 1];
    return (
        <figure>
            <div className="flex h-36 items-end gap-[2px] border-b border-linea" role="img" aria-label={`Citas por día: ${datos.map((d) => `${etiquetaDia(d.fecha)} ${d.valor}`).join(", ")}`}>
                {datos.map((d) => (
                    <div key={d.fecha} className="group relative flex h-full flex-1 items-end" title={`${etiquetaDia(d.fecha)}: ${d.valor} citas`}>
                        <div className="w-full rounded-t-[4px] bg-pino transition-colors group-hover:bg-tinta" style={{ height: `${d.valor === 0 ? 0 : Math.max(3, (d.valor / maximo) * 100)}%` }} />
                    </div>
                ))}
            </div>
            <figcaption className="mt-1.5 flex justify-between text-xs text-gris">
                {marcas.map((i) => <span key={i}>{datos[i] ? etiquetaDia(datos[i].fecha) : ""}</span>)}
            </figcaption>
        </figure>
    );
}

export function Cifra({ valor, etiqueta, detalle }: { valor: string | number; etiqueta: string; detalle?: string }) {
    return (
        <div className="rounded-2xl border border-linea bg-white p-5">
            <p className="text-sm text-gris">{etiqueta}</p>
            <p className="mt-1 font-display text-4xl font-bold tabular-nums">{valor}</p>
            {detalle && <p className="mt-1 text-sm text-gris">{detalle}</p>}
        </div>
    );
}
