import { NextResponse, type NextRequest } from "next/server";
import { ETIQUETAS_ESTADO, reporteCitas } from "@/lib/modelos/citas";
import { auditar } from "@/lib/modelos/notificaciones";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { fechaBogota, horaBogota } from "@/lib/tiempo";
import { leerFiltros } from "@/app/panel/admin/reportes/filtros";

export const dynamic = "force-dynamic";

/** Evita que Excel interprete una celda como fórmula (inyección CSV). */
function celda(valor: unknown): string {
    let texto = valor === null || valor === undefined ? "" : String(valor);
    if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
    return `"${texto.replace(/"/g, '""')}"`;
}

/** Descarga del reporte de citas en CSV, con separador ; para Excel en español. */
export async function GET(request: NextRequest) {
    const usuario = await obtenerUsuarioActual();
    if (!usuario || usuario.rol !== "admin" || !usuario.consultorio_id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const p = request.nextUrl.searchParams;
    const filtros = leerFiltros({
        desde: p.get("desde") ?? undefined,
        hasta: p.get("hasta") ?? undefined,
        medico: p.get("medico") ?? undefined,
        especialidad: p.get("especialidad") ?? undefined,
        estado: p.get("estado") ?? undefined,
    });
    const citas = await reporteCitas(usuario.consultorio_id, filtros, 20000);
    const encabezado = ["Fecha", "Hora", "Paciente", "Documento", "Celular", "Profesional", "Especialidad", "Estado", "Motivo", "Cancelada por"];
    const filas = citas.map((c) => [
        fechaBogota(c.inicio),
        horaBogota(c.inicio),
        `${c.paciente_nombres} ${c.paciente_apellidos}`,
        `${c.paciente_tipo_doc ?? ""} ${c.paciente_num_doc ?? ""}`.trim(),
        c.paciente_telefono,
        `${c.medico_nombres} ${c.medico_apellidos}`,
        c.especialidad,
        ETIQUETAS_ESTADO[c.estado],
        c.motivo,
        c.cancelada_por,
    ]);
    const csv = "﻿" + [encabezado, ...filas].map((fila) => fila.map(celda).join(";")).join("\r\n");
    await auditar(usuario.id, "exportar_reporte", "consultorio", usuario.consultorio_id, `${filtros.desde} a ${filtros.hasta}`);
    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="citas-${filtros.desde}-a-${filtros.hasta}.csv"`,
            "Cache-Control": "private, no-store",
        },
    });
}
