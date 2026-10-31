import Link from "next/link";
import { AgendaViva, type DiaVitrina } from "@/componentes/landing/AgendaViva";
import { FormularioContacto } from "@/componentes/landing/FormularioContacto";
import { NOMBRES_DIAS, NOMBRES_DIAS_CORTOS, diaSemana, hoyBogota, sumarDias } from "@/lib/tiempo";

export const revalidate = 3600;

const DOMINIO = (process.env.NEXT_PUBLIC_URL_SITIO?.replace(/^https?:\/\//, "") || process.env.VERCEL_PROJECT_PRODUCTION_URL || "saludconecta").replace(/\/$/, "");

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function diasVitrina(): DiaVitrina[] {
    const dias: DiaVitrina[] = [];
    let fecha = sumarDias(hoyBogota(), 1);
    while (dias.length < 5) {
        const d = diaSemana(fecha);
        if (d !== 0 && d !== 6) {
            const [, mes, dia] = fecha.split("-").map(Number);
            dias.push({ corto: NOMBRES_DIAS_CORTOS[d], numero: dia, largo: `${NOMBRES_DIAS[d]} ${dia} de ${MESES[mes - 1]}` });
        }
        fecha = sumarDias(fecha, 1);
    }
    return dias;
}

const DIA_EN_RECEPCION: Array<{ hora: string; antes: string; despues: string }> = [
    {
        hora: "6:58 a. m.",
        antes: "Suena el teléfono antes de abrir. Es alguien que quiere cita para hoy y nadie ha llegado a revisar el cuaderno.",
        despues: "Esa misma persona reservó anoche a las once, desde la cama, en el último turno libre de la mañana.",
    },
    {
        hora: "9:40 a. m.",
        antes: "Dos pacientes llegan para el mismo turno con la odontóloga. Alguien escribió encima de un borrón.",
        despues: "La agenda no deja tomar un turno ocupado. Si dos personas tocan el mismo, el segundo ve otro horario.",
    },
    {
        hora: "11:15 a. m.",
        antes: "Tres sillas vacías. Nadie les recordó la cita y la doctora espera con la bata puesta.",
        despues: "Cada paciente recibió su recordatorio el día anterior y, si no podía, liberó el turno con un toque.",
    },
    {
        hora: "7:30 p. m.",
        antes: "Llega un WhatsApp al celular personal de la recepcionista: ¿mañana tienen cupo con pediatría?",
        despues: "El enlace del consultorio responde solo, con los cupos reales de pediatría para mañana.",
    },
];

const PERSONAS = [
    {
        quien: "Tus pacientes",
        resumen: "Reservan desde el celular sin descargar nada.",
        puntos: [
            "Eligen especialidad, profesional, día y hora en una sola página.",
            "Cancelan o mueven su cita hasta dos horas antes, sin llamar.",
            "Reciben el recordatorio y ven el diagnóstico y las indicaciones de cada consulta.",
        ],
    },
    {
        quien: "Tus médicos",
        resumen: "Ven su día y escriben lo esencial de cada consulta.",
        puntos: [
            "Arman su horario semanal y bloquean días de vacaciones o congresos.",
            "Abren a cada paciente con sus consultas anteriores en este consultorio.",
            "Registran diagnóstico, tratamiento y notas privadas, o marcan inasistencia.",
        ],
    },
    {
        quien: "Tu recepción y administración",
        resumen: "Controlan la agenda de todos y saben qué está pasando.",
        puntos: [
            "Agendan por teléfono para quien no usa internet, en el mismo calendario.",
            "Ven citas por profesional, especialidad y fecha, con la tasa de inasistencia.",
            "Descargan los reportes en Excel (CSV) para la contabilidad o la junta.",
        ],
    },
];

const PREGUNTAS = [
    {
        p: "¿Mis pacientes tienen que descargar una aplicación?",
        r: "No. Abren el enlace de tu consultorio en el navegador del celular o del computador, como cualquier página web.",
    },
    {
        p: "¿Puedo seguir dando citas por teléfono?",
        r: "Sí. La recepción agenda desde el panel en el mismo calendario, así que nunca se cruzan las citas del teléfono con las de internet.",
    },
    {
        p: "¿Reemplaza mi historia clínica electrónica?",
        r: "No. SaludConecta guarda el motivo, el diagnóstico y las indicaciones de cada cita para darle continuidad a la atención, pero no sustituye la historia clínica completa que exige la normativa colombiana.",
    },
    {
        p: "¿Qué pasa con los datos de mis pacientes?",
        r: "Cada paciente autoriza el tratamiento de sus datos al registrarse, como pide la Ley 1581 de 2012. Las contraseñas se guardan cifradas, la conexión va por HTTPS y cada persona solo ve lo que le corresponde según su rol.",
    },
    {
        p: "¿Cuánto me demoro en empezar?",
        r: "Lo que tardes en escribir los nombres de tus profesionales y sus horarios. Al terminar tienes un enlace listo para poner en tu perfil de WhatsApp o Instagram.",
    },
];

export default function PaginaInicio() {
    return (
        <>
            {/* Hero: la agenda misma es la promesa. */}
            <section className="relative overflow-hidden">
                <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.02fr_1fr] lg:gap-16">
                    <div>
                        <h1 className="max-w-[13ch] text-[2.75rem] font-extrabold leading-[0.98] sm:text-6xl lg:text-[4.4rem]">
                            Que tus pacientes agenden solos, a cualquier hora.
                        </h1>
                        <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-gris sm:text-xl">
                            SaludConecta le da a tu consultorio una página de citas en línea. El paciente escoge médico y hora desde el celular, le llega su recordatorio y aparece. Tú ves la agenda del día y la historia de cada persona en un solo lugar.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Link href="/registro" className="boton boton-primario px-6 py-3.5 text-lg">Crear mi consultorio gratis</Link>
                            <Link href="/demo" className="boton boton-secundario px-6 py-3.5 text-lg">Entrar a la demo</Link>
                        </div>
                        <p className="mt-4 text-sm text-gris">Sin tarjeta de crédito. Un profesional gratis para siempre.</p>
                    </div>
                    <AgendaViva dias={diasVitrina()} />
                </div>
            </section>

            {/* Un día en recepción: antes y después, hora por hora. */}
            <section className="border-y border-linea bg-white">
                <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
                    <h2 className="max-w-2xl text-3xl font-bold sm:text-[2.6rem]">Un martes cualquiera en la recepción de un consultorio</h2>
                    <p className="mt-4 max-w-2xl text-lg text-gris">
                        La agenda de papel funciona hasta que el teléfono suena más rápido de lo que alguien alcanza a contestar. Esto cambia cuando la agenda está abierta en internet.
                    </p>
                    <div className="mt-12 hidden grid-cols-[7.5rem_1fr_1fr] gap-x-8 border-b border-linea pb-3 text-sm font-bold text-gris md:grid">
                        <span>Hora</span>
                        <span>Con el cuaderno y el teléfono</span>
                        <span>Con SaludConecta</span>
                    </div>
                    <ol className="mt-8 md:mt-0">
                        {DIA_EN_RECEPCION.map((momento) => (
                            <li key={momento.hora} className="grid gap-3 border-b border-linea py-7 md:grid-cols-[7.5rem_1fr_1fr] md:gap-x-8">
                                <p className="font-display text-xl font-bold tabular-nums text-pino">{momento.hora}</p>
                                <p className="text-gris">
                                    <span className="mb-1 block text-sm font-bold text-gris-suave md:hidden">Con el cuaderno</span>
                                    {momento.antes}
                                </p>
                                <p className="border-l-4 border-resaltador pl-4">
                                    <span className="mb-1 block text-sm font-bold text-pino md:hidden">Con SaludConecta</span>
                                    {momento.despues}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Tres personas, tres paneles. */}
            <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
                <h2 className="max-w-2xl text-3xl font-bold sm:text-[2.6rem]">Cada quien entra a lo suyo</h2>
                <p className="mt-4 max-w-2xl text-lg text-gris">
                    El paciente, el médico y la recepción usan la misma agenda, pero cada uno ve una pantalla distinta, con solo lo que necesita.
                </p>
                <div className="mt-12 divide-y divide-linea border-y border-linea">
                    {PERSONAS.map((persona) => (
                        <div key={persona.quien} className="grid gap-4 py-9 md:grid-cols-[1fr_1.4fr] md:gap-12">
                            <div>
                                <h3 className="text-2xl font-bold">{persona.quien}</h3>
                                <p className="mt-2 text-lg text-gris">{persona.resumen}</p>
                            </div>
                            <ul className="space-y-3">
                                {persona.puntos.map((punto) => (
                                    <li key={punto} className="flex gap-3">
                                        <span aria-hidden="true" className="mt-[0.55rem] h-2 w-4 shrink-0 rounded-sm bg-resaltador" />
                                        <span>{punto}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pasos reales, en orden. */}
            <section id="como-funciona" className="scroll-mt-20 bg-tinta text-papel">
                <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
                    <h2 className="max-w-2xl text-3xl font-bold sm:text-[2.6rem]">De cero a la primera cita en línea</h2>
                    <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
                        <li>
                            <p className="font-display text-5xl font-extrabold text-resaltador">1</p>
                            <h3 className="mt-3 text-xl font-bold">Crea tu consultorio</h3>
                            <p className="mt-2 text-papel/75">Nombre, ciudad y tu correo. Quedas como administrador.</p>
                        </li>
                        <li>
                            <p className="font-display text-5xl font-extrabold text-resaltador">2</p>
                            <h3 className="mt-3 text-xl font-bold">Agrega profesionales y horarios</h3>
                            <p className="mt-2 text-papel/75">Cada médico con su especialidad, la duración de su consulta y los días que atiende.</p>
                        </li>
                        <li>
                            <p className="font-display text-5xl font-extrabold text-resaltador">3</p>
                            <h3 className="mt-3 text-xl font-bold">Comparte tu enlace</h3>
                            <p className="mt-2 text-papel/75">Ponlo en tu WhatsApp, Instagram o Google. Desde ahí reservan tus pacientes.</p>
                            <p className="mt-4 inline-block rounded-md bg-papel/10 px-3 py-2 text-sm text-papel">
                                {DOMINIO}/c/<span className="text-resaltador">tu-consultorio</span>
                            </p>
                        </li>
                    </ol>
                </div>
            </section>

            {/* Confianza: datos de salud. */}
            <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.2fr] md:gap-16">
                <div>
                    <h2 className="text-3xl font-bold sm:text-[2.6rem]">Datos de salud, tratados como tales</h2>
                    <p className="mt-4 text-lg text-gris">
                        Un consultorio maneja información sensible. SaludConecta está construido para que cada dato llegue solo a quien debe verlo.
                    </p>
                </div>
                <dl className="grid gap-6 sm:grid-cols-2">
                    <div>
                        <dt className="font-bold">Autorización expresa</dt>
                        <dd className="mt-1 text-gris">Cada paciente acepta la política de tratamiento de datos al registrarse, conforme a la Ley 1581 de 2012.</dd>
                    </div>
                    <div>
                        <dt className="font-bold">Acceso por rol</dt>
                        <dd className="mt-1 text-gris">Un médico solo ve a los pacientes de su consultorio. Un consultorio no ve a los pacientes de otro.</dd>
                    </div>
                    <div>
                        <dt className="font-bold">Contraseñas cifradas</dt>
                        <dd className="mt-1 text-gris">Se guardan con bcrypt; ni siquiera el equipo de SaludConecta puede leerlas.</dd>
                    </div>
                    <div>
                        <dt className="font-bold">Registro de auditoría</dt>
                        <dd className="mt-1 text-gris">Queda constancia de quién agendó, canceló o registró un diagnóstico, y cuándo.</dd>
                    </div>
                </dl>
            </section>

            {/* Precios */}
            <section id="precios" className="scroll-mt-20 border-t border-linea bg-menta/50">
                <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
                    <h2 className="max-w-2xl text-3xl font-bold sm:text-[2.6rem]">Precios en pesos, sin letra pequeña</h2>
                    <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.15fr_1fr]">
                        <div className="flex flex-col rounded-2xl border border-linea bg-papel p-7">
                            <h3 className="text-xl font-bold">Básico</h3>
                            <p className="mt-1 text-gris">Para quien atiende solo.</p>
                            <p className="mt-6 font-display text-4xl font-extrabold">Gratis</p>
                            <ul className="mt-6 flex-1 space-y-2.5 text-[0.97rem]">
                                <li>1 profesional</li>
                                <li>Página de citas en línea</li>
                                <li>Recordatorios en la plataforma</li>
                                <li>Diagnóstico e indicaciones por cita</li>
                            </ul>
                            <Link href="/registro" className="boton boton-secundario mt-8">Crear mi consultorio</Link>
                        </div>
                        <div className="flex flex-col rounded-2xl border-2 border-tinta bg-white p-7 shadow-[8px_8px_0_0_var(--color-resaltador)]">
                            <h3 className="text-xl font-bold">Consultorio</h3>
                            <p className="mt-1 text-gris">Para equipos de varias especialidades.</p>
                            <p className="mt-6 font-display text-4xl font-extrabold">$79.000 <span className="font-sans text-base font-normal text-gris">COP al mes</span></p>
                            <ul className="mt-6 flex-1 space-y-2.5 text-[0.97rem]">
                                <li>Hasta 6 profesionales</li>
                                <li>Todo lo del plan Básico</li>
                                <li>Agenda de recepción para citas por teléfono</li>
                                <li>Reportes por profesional y especialidad, descargables</li>
                                <li>30 días de prueba; te escribimos antes de cobrar</li>
                            </ul>
                            <Link href="/registro" className="boton boton-primario mt-8">Empezar la prueba</Link>
                        </div>
                        <div className="flex flex-col rounded-2xl border border-linea bg-papel p-7">
                            <h3 className="text-xl font-bold">Clínica</h3>
                            <p className="mt-1 text-gris">Varias sedes o más de 6 profesionales.</p>
                            <p className="mt-6 font-display text-4xl font-extrabold">A la medida</p>
                            <ul className="mt-6 flex-1 space-y-2.5 text-[0.97rem]">
                                <li>Profesionales ilimitados</li>
                                <li>Acompañamiento en la puesta en marcha</li>
                                <li>Migración de tu agenda actual</li>
                            </ul>
                            <Link href="#contacto" className="boton boton-secundario mt-8">Hablar con nosotros</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Preguntas */}
            <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
                <h2 className="text-3xl font-bold sm:text-[2.6rem]">Lo que suelen preguntar</h2>
                <div className="mt-10 divide-y divide-linea border-y border-linea">
                    {PREGUNTAS.map((pregunta) => (
                        <details key={pregunta.p} className="group py-5">
                            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-bold [&::-webkit-details-marker]:hidden">
                                {pregunta.p}
                                <span aria-hidden="true" className="mt-1 grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] border-tinta text-sm transition-transform group-open:rotate-45">+</span>
                            </summary>
                            <p className="mt-3 max-w-[62ch] text-gris">{pregunta.r}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* Contacto */}
            <section id="contacto" className="scroll-mt-20 bg-pino text-papel">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
                    <div>
                        <h2 className="text-3xl font-bold sm:text-[2.6rem]">¿Prefieres que te lo mostremos?</h2>
                        <p className="mt-4 text-lg text-papel/80">
                            Déjanos tus datos y te enseñamos SaludConecta funcionando con los nombres y horarios de tu propio consultorio.
                        </p>
                        <p className="mt-6 text-papel/80">
                            O entra ya mismo a la <Link href="/demo" className="font-bold text-resaltador underline underline-offset-4">demo</Link> como paciente, médico o recepción.
                        </p>
                    </div>
                    <FormularioContacto />
                </div>
            </section>
        </>
    );
}
