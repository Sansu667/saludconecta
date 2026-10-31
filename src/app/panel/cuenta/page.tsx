import { EncabezadoPagina } from "@/componentes/panel/ui";
import { FormularioContrasena, FormularioPerfil } from "@/componentes/panel/FormulariosCuenta";
import { requerirUsuario } from "@/lib/sesion";

export const metadata = { title: "Mi cuenta" };

export default async function PaginaCuenta() {
    const usuario = await requerirUsuario();
    return (
        <>
            <EncabezadoPagina titulo="Mi cuenta" descripcion={`Ingresas con ${usuario.email}.`} />
            <section className="hoja p-6 sm:p-8">
                <h2 className="mb-5 text-xl font-bold">Datos de contacto</h2>
                <FormularioPerfil
                    nombres={usuario.nombres}
                    apellidos={usuario.apellidos}
                    telefono={usuario.telefono ?? ""}
                    fechaNac={usuario.fecha_nac ?? ""}
                    conFecha={usuario.rol === "paciente"}
                />
                {usuario.num_doc && (
                    <p className="mt-6 text-sm text-gris">
                        Documento {usuario.tipo_doc} {usuario.num_doc}. Para corregirlo, pídeselo a la recepción de tu consultorio.
                    </p>
                )}
            </section>
            <section className="hoja mt-6 p-6 sm:p-8">
                <h2 className="mb-5 text-xl font-bold">Contraseña</h2>
                <FormularioContrasena />
            </section>
        </>
    );
}
