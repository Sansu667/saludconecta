import type { NextConfig } from "next";

const ENCABEZADOS_SEGURIDAD = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const configuracion: NextConfig = {
    poweredByHeader: false,
    serverExternalPackages: ["@electric-sql/pglite"],
    async headers() {
        return [
            { source: "/:path*", headers: ENCABEZADOS_SEGURIDAD },
            {
                source: "/panel/:path*",
                headers: [{ key: "Cache-Control", value: "private, no-store" }],
            },
        ];
    },
};

export default configuracion;
