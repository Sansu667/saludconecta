import { NextResponse, type NextRequest } from "next/server";
import { reiniciarDemo } from "@/lib/db/demo";
import { consultar } from "@/lib/db";
import { generarRecordatorios } from "@/lib/modelos/notificaciones";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Tarea diaria (Vercel Cron): crea los recordatorios del día siguiente,
 * reinicia el consultorio de demostración y limpia registros viejos.
 */
export async function GET(request: NextRequest) {
    const secreto = process.env.CRON_SECRET;
    if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    await consultar("SELECT 1");
    await reiniciarDemo();
    const recordatorios = await generarRecordatorios(null);
    await consultar("DELETE FROM intentos_login WHERE creado_en < NOW() - INTERVAL '30 days'");
    return NextResponse.json({ ok: true, recordatorios });
}
