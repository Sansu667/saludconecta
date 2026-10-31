import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Política de tratamiento de datos personales" };

export default function PaginaPrivacidad() {
    return (
        <article className="mx-auto max-w-[68ch] px-4 py-14 sm:py-20 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
            <h1 className="text-4xl font-extrabold">Política de tratamiento de datos personales</h1>
            <p className="text-gris">Vigente desde el 30 de octubre de 2026.</p>

            <p>
                Esta política explica cómo SaludConecta recoge, usa, guarda y protege los datos personales de pacientes, profesionales y personal administrativo, en cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015).
            </p>

            <h2>Quién responde por tus datos</h2>
            <p>
                Cada consultorio o clínica que usa SaludConecta es el <strong>responsable</strong> del tratamiento de los datos de sus pacientes: decide para qué los usa y debe atender tus solicitudes. SaludConecta actúa como <strong>encargado</strong>: guarda y procesa la información por cuenta del consultorio y solo para prestar el servicio de agenda.
            </p>

            <h2>Qué datos tratamos</h2>
            <ul>
                <li>Datos de identificación y contacto: nombres, apellidos, tipo y número de documento, correo, celular y fecha de nacimiento.</li>
                <li>Datos de las citas: consultorio, profesional, fecha, hora, motivo de consulta y estado.</li>
                <li>Datos de salud que registra el profesional: diagnóstico, tratamiento o indicaciones y notas de la consulta. Son datos sensibles.</li>
                <li>Datos técnicos de seguridad: intentos de inicio de sesión y registro de acciones sobre las citas.</li>
            </ul>

            <h2>Para qué los usamos</h2>
            <ul>
                <li>Agendar, reprogramar, cancelar y recordar tus citas.</li>
                <li>Permitir que el profesional que te atiende vea tus consultas anteriores en ese mismo consultorio.</li>
                <li>Generar reportes agregados para la administración del consultorio.</li>
                <li>Proteger las cuentas y prevenir accesos indebidos.</li>
            </ul>
            <p>No vendemos ni compartimos tus datos con terceros para publicidad.</p>

            <h2>Datos sensibles</h2>
            <p>
                Los datos de salud son sensibles. No estás obligado a autorizar su tratamiento; sin embargo, sin ellos el consultorio no puede gestionar tu atención a través de la plataforma. Al registrarte das tu autorización previa, expresa e informada marcando la casilla correspondiente, y queda constancia de la fecha.
            </p>

            <h2>Tus derechos</h2>
            <ul>
                <li>Conocer, actualizar y rectificar tus datos.</li>
                <li>Pedir prueba de la autorización que diste.</li>
                <li>Saber qué uso se ha dado a tus datos.</li>
                <li>Revocar la autorización o pedir la supresión cuando no exista un deber legal o contractual de conservarlos. Ten en cuenta que la información de atención en salud puede tener plazos legales de conservación.</li>
                <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
            </ul>
            <p>
                Puedes actualizar tus datos de contacto desde tu cuenta. Para las demás solicitudes, dirígete al consultorio donde te atiendes o escríbenos por el <Link href="/#contacto" className="enlace">formulario de contacto</Link>. Las consultas se responden en máximo diez días hábiles y los reclamos en máximo quince, como lo establece la ley.
            </p>

            <h2>Cómo protegemos la información</h2>
            <ul>
                <li>Conexión cifrada (HTTPS) en todo el sitio.</li>
                <li>Contraseñas almacenadas con un algoritmo de hash seguro (bcrypt); nadie puede leerlas.</li>
                <li>Acceso por roles: cada consultorio solo ve a sus pacientes y cada profesional solo las citas de su consultorio.</li>
                <li>Bloqueo temporal tras varios intentos fallidos de inicio de sesión.</li>
                <li>Registro de auditoría de las acciones sobre las citas.</li>
            </ul>

            <h2>Cambios a esta política</h2>
            <p>Si cambiamos algo importante, lo avisaremos dentro de la plataforma antes de que entre en vigencia.</p>
        </article>
    );
}
