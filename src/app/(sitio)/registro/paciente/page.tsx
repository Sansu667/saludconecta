import type { Metadata } from "next";
import Link from "next/link";
import { FormularioRegistroPaciente } from "@/componentes/auth/FormularioRegistroPaciente";

export const metadata: Metadata = { title: "Crear cuenta de paciente" };

export default async function PaginaRegistroPaciente({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
    const { siguiente } = await searchParams;
    return (
        <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
            <h1 className="text-4xl font-extrabold">Crea tu cuenta de paciente</h1>
            <p className="mt-3 max-w-xl text-gris">
                Con una sola cuenta agendas en cualquier consultorio que use SaludConecta y guardas el historial de tus citas.
            </p>
            <div className="hoja mt-8 p-6 sm:p-8">
                <FormularioRegistroPaciente siguiente={siguiente} />
            </div>
            <p className="mt-6 text-[0.95rem]">¿Ya tienes cuenta? <Link href="/ingresar" className="enlace">Ingresa</Link></p>
        </div>
    );
}
