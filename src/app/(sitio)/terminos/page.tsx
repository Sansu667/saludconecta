import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Términos de uso" };

export default function PaginaTerminos() {
    return (
        <article className="mx-auto max-w-[68ch] px-4 py-14 sm:py-20 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
            <h1 className="text-4xl font-extrabold">Términos de uso</h1>
            <p className="text-gris">Vigentes desde el 30 de octubre de 2026.</p>

            <h2>Qué es SaludConecta</h2>
            <p>
                SaludConecta es una herramienta en línea para que consultorios y clínicas gestionen sus citas: agenda pública, recordatorios, registro breve de cada atención y reportes. No presta servicios de salud ni reemplaza la historia clínica completa que exige la normativa colombiana.
            </p>

            <h2>Cuentas</h2>
            <ul>
                <li>Cada persona usa su propia cuenta y es responsable de mantener su contraseña en secreto.</li>
                <li>El consultorio responde por los profesionales y el personal a quienes da acceso, y por la veracidad de la información que publica.</li>
                <li>Podemos suspender cuentas que se usen para suplantar a otras personas o para fines distintos a la gestión de citas.</li>
            </ul>

            <h2>Citas</h2>
            <ul>
                <li>La confirmación de una cita depende del consultorio, que puede cancelarla o moverla por razones de fuerza mayor; el paciente recibirá un aviso en la plataforma.</li>
                <li>El paciente puede cancelar o reprogramar desde su cuenta hasta dos horas antes de la cita. Después de ese plazo debe comunicarse con el consultorio.</li>
                <li>En una urgencia, no uses SaludConecta: acude al servicio de urgencias más cercano o llama a la línea 123.</li>
            </ul>

            <h2>Planes y pagos</h2>
            <p>
                El plan Básico es gratuito. Los planes pagos inician con un periodo de prueba; antes de cualquier cobro te contactaremos para acordar el medio de pago. Puedes dejar de usar el servicio cuando quieras.
            </p>

            <h2>Datos personales</h2>
            <p>
                El tratamiento de datos se rige por la <Link href="/privacidad" className="enlace">política de tratamiento de datos personales</Link>.
            </p>

            <h2>Demo</h2>
            <p>
                El consultorio de demostración usa datos ficticios y se reinicia todos los días. No ingreses datos reales de salud en él.
            </p>
        </article>
    );
}
