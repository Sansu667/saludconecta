import type { Metadata } from "next";
import Link from "next/link";
import { ingresarDemo } from "@/app/acciones/autenticacion";

export const metadata: Metadata = {
    title: "Probar la demo",
    description: "Entra a SaludConecta como paciente, médica o recepción de un consultorio de prueba.",
};

const ROLES = [
    {
        rol: "paciente",
        titulo: "Soy paciente",
        quien: "María Fernanda Gómez",
        texto: "Tiene dos citas próximas y un historial con diagnósticos. Agenda, cancela o mueve una cita.",
        boton: "Entrar como paciente",
    },
    {
        rol: "medico",
        titulo: "Soy médica",
        quien: "Dra. Laura Méndez, medicina general",
        texto: "Revisa la agenda del día, abre a un paciente, registra un diagnóstico y ajusta tu horario.",
        boton: "Entrar como médica",
    },
    {
        rol: "admin",
        titulo: "Soy recepción",
        quien: "Patricia Lopera, Centro Médico Aurora",
        texto: "Mira los reportes del mes, agenda una cita por teléfono y agrega un profesional nuevo.",
        boton: "Entrar como recepción",
    },
];

export default async function PaginaDemo({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams;
    return (
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <h1 className="max-w-3xl text-4xl font-extrabold sm:text-5xl">Entra al Centro Médico Aurora, un consultorio de prueba</h1>
            <p className="mt-5 max-w-2xl text-lg text-gris">
                Todo funciona de verdad: las citas se guardan, los turnos se ocupan y las notificaciones llegan. Los nombres son ficticios y la demo se reinicia cada madrugada, así que puedes tocar lo que quieras.
            </p>
            {error && (
                <p role="alert" className="mt-6 rounded-lg bg-alerta-suave px-4 py-3 font-bold text-alerta">
                    La demo se está reiniciando. Espera unos segundos e inténtalo otra vez.
                </p>
            )}
            <div className="mt-12 grid gap-5 md:grid-cols-3">
                {ROLES.map((r) => (
                    <form key={r.rol} action={ingresarDemo} className="hoja flex flex-col p-7">
                        <input type="hidden" name="rol" value={r.rol} />
                        <h2 className="text-2xl font-bold">{r.titulo}</h2>
                        <p className="mt-1 text-sm font-bold text-pino">{r.quien}</p>
                        <p className="mt-4 flex-1 text-gris">{r.texto}</p>
                        <button type="submit" className="boton boton-primario mt-7">{r.boton}</button>
                    </form>
                ))}
            </div>
            <p className="mt-10 text-gris">
                También puedes ver la página pública donde los pacientes reservan: <Link href="/c/demo" className="enlace">saludconecta/c/demo</Link>.
            </p>
        </div>
    );
}
