import type { Metadata, Viewport } from "next";
import "./globals.css";

const URL_SITIO = process.env.NEXT_PUBLIC_URL_SITIO || "https://saludconecta.vercel.app";

export const metadata: Metadata = {
    metadataBase: new URL(URL_SITIO),
    title: {
        default: "SaludConecta · Agenda médica en línea para consultorios y clínicas",
        template: "%s · SaludConecta",
    },
    description:
        "Tus pacientes reservan su cita desde el celular, reciben recordatorio y llegan. Agenda en línea, historial de atención y reportes para consultorios y clínicas en Colombia.",
    applicationName: "SaludConecta",
    openGraph: {
        type: "website",
        locale: "es_CO",
        siteName: "SaludConecta",
        title: "SaludConecta · Agenda médica en línea",
        description: "Agenda en línea, recordatorios e historial de atención para consultorios y clínicas.",
    },
    icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
    themeColor: "#0e2f2c",
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es-CO">
            <body className="min-h-dvh antialiased">{children}</body>
        </html>
    );
}
