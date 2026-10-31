import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioIngreso } from "@/componentes/auth/FormularioIngreso";
import { obtenerUsuarioActual, rutaInicioPorRol } from "@/lib/sesion";

export const metadata: Metadata = { title: "Ingresar" };

export default async function PaginaIngresar({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
    const { siguiente } = await searchParams;
    const usuario = await obtenerUsuarioActual();
    if (usuario) redirect(rutaInicioPorRol(usuario.rol));
    return (
        <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
            <h1 className="text-4xl font-extrabold">Ingresar</h1>
            <p className="mt-3 text-gris">Pacientes, médicos y recepción entran por aquí con su correo.</p>
            <div className="hoja mt-8 p-6 sm:p-8">
                <FormularioIngreso siguiente={siguiente} />
            </div>
            <div className="mt-6 space-y-2 text-[0.95rem]">
                <p>¿Eres paciente y no tienes cuenta? <Link href="/registro/paciente" className="enlace">Regístrate</Link></p>
                <p>¿Tienes un consultorio? <Link href="/registro" className="enlace">Crea su cuenta</Link></p>
                <p className="text-gris">¿Olvidaste tu contraseña? Pídele a la recepción de tu consultorio que te asigne una temporal.</p>
            </div>
        </div>
    );
}
