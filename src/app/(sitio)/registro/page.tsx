import type { Metadata } from "next";
import Link from "next/link";
import { FormularioRegistroConsultorio } from "@/componentes/auth/FormularioRegistroConsultorio";

export const metadata: Metadata = { title: "Crear mi consultorio" };

export default function PaginaRegistroConsultorio() {
    return (
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
                <h1 className="text-4xl font-extrabold sm:text-5xl">Abre la agenda de tu consultorio en internet</h1>
                <p className="mt-5 text-lg text-gris">
                    Creas la cuenta, agregas a tus profesionales con su horario y recibes un enlace para compartir. El plan Básico es gratis para un profesional.
                </p>
                <ol className="mt-8 space-y-4">
                    {[
                        "Crea el consultorio con este formulario.",
                        "Agrega especialidades, médicos y sus horarios.",
                        "Comparte el enlace con tus pacientes.",
                    ].map((paso, i) => (
                        <li key={paso} className="flex items-start gap-4">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-resaltador font-display font-bold">{i + 1}</span>
                            <span className="pt-1">{paso}</span>
                        </li>
                    ))}
                </ol>
                <p className="mt-10 text-[0.95rem] text-gris">
                    ¿Eres paciente? <Link href="/registro/paciente" className="enlace">Crea tu cuenta de paciente aquí</Link>.
                </p>
            </div>
            <div className="hoja p-6 sm:p-9">
                <FormularioRegistroConsultorio />
            </div>
        </div>
    );
}
