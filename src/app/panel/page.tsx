import { redirect } from "next/navigation";
import { requerirUsuario, rutaInicioPorRol } from "@/lib/sesion";

export default async function PaginaPanel() {
    const usuario = await requerirUsuario();
    redirect(rutaInicioPorRol(usuario.rol));
}
