import "server-only";
import bcrypt from "bcryptjs";
import { consultarSinPreparar as ejecutar } from "./index";
import { construirInstante, diaSemana, hoyBogota, horaDeMinutos, minutosDeHora, sumarDias } from "../tiempo";

/**
 * Datos de demostración. Todo lo que hay aquí es ficticio: nombres,
 * documentos y diagnósticos están inventados para mostrar el producto.
 */
export const CONTRASENA_DEMO = "demo1234";
export const CORREOS_DEMO = {
    paciente: "paciente@demo.saludconecta.co",
    medico: "medico@demo.saludconecta.co",
    admin: "admin@demo.saludconecta.co",
};

interface MedicoSemilla {
    nombres: string;
    apellidos: string;
    email: string;
    especialidad: string;
    registro: string;
    biografia: string;
    duracion: number;
    horario: Array<[number, string, string]>;
}

const MEDICOS_DEMO: MedicoSemilla[] = [
    {
        nombres: "Laura",
        apellidos: "Méndez Ríos",
        email: CORREOS_DEMO.medico,
        especialidad: "Medicina general",
        registro: "RM-05-11823",
        biografia: "Médica de la Universidad de Antioquia. Atiende consulta de primera vez, control de crónicos y certificados.",
        duracion: 30,
        horario: [1, 2, 3, 4, 5].flatMap((d) => [[d, "08:00", "12:00"], [d, "14:00", "17:00"]] as Array<[number, string, string]>),
    },
    {
        nombres: "Andrés",
        apellidos: "Rojas Pineda",
        email: "andres.rojas@demo.saludconecta.co",
        especialidad: "Odontología",
        registro: "RO-05-4471",
        biografia: "Odontólogo general con énfasis en prevención y estética dental.",
        duracion: 40,
        horario: [
            [1, "07:00", "13:00"], [3, "07:00", "13:00"], [5, "07:00", "13:00"], [6, "08:00", "12:00"],
        ],
    },
    {
        nombres: "Camila",
        apellidos: "Torres Vélez",
        email: "camila.torres@demo.saludconecta.co",
        especialidad: "Psicología",
        registro: "TP-118204",
        biografia: "Psicóloga clínica. Terapia individual para adultos y adolescentes.",
        duracion: 60,
        horario: [[2, "09:00", "13:00"], [2, "15:00", "19:00"], [4, "09:00", "13:00"], [4, "15:00", "19:00"]],
    },
    {
        nombres: "Julián",
        apellidos: "Ortega Salazar",
        email: "julian.ortega@demo.saludconecta.co",
        especialidad: "Pediatría",
        registro: "RM-05-20915",
        biografia: "Pediatra. Control de crecimiento y desarrollo, vacunación y consulta por enfermedad.",
        duracion: 30,
        horario: [1, 2, 3, 4, 5].map((d) => [d, "13:00", "18:00"] as [number, string, string]),
    },
];

const PACIENTES_DEMO: Array<[string, string, string]> = [
    ["María Fernanda", "Gómez Arango", CORREOS_DEMO.paciente],
    ["Santiago", "Restrepo Gil", "paciente2@demo.saludconecta.co"],
    ["Valentina", "Cardona Ruiz", "paciente3@demo.saludconecta.co"],
    ["Juan Pablo", "Henao Duque", "paciente4@demo.saludconecta.co"],
    ["Isabella", "Quintero Mejía", "paciente5@demo.saludconecta.co"],
    ["Mateo", "Zapata Londoño", "paciente6@demo.saludconecta.co"],
    ["Luisa", "Marín Ochoa", "paciente7@demo.saludconecta.co"],
    ["Daniel", "Arbeláez Toro", "paciente8@demo.saludconecta.co"],
];

const MOTIVOS: Record<string, string[]> = {
    "Medicina general": ["Dolor de cabeza frecuente", "Control de tensión arterial", "Chequeo general", "Tos de varios días", "Certificado médico"],
    "Odontología": ["Limpieza dental", "Dolor en una muela", "Revisión de calza", "Sensibilidad dental"],
    "Psicología": ["Ansiedad en el trabajo", "Seguimiento de terapia", "Dificultades para dormir"],
    "Pediatría": ["Control de crecimiento", "Fiebre", "Vacunación", "Control de niño sano"],
};

const RESULTADOS: Record<string, Array<[string, string]>> = {
    "Medicina general": [
        ["Cefalea tensional", "Higiene del sueño, pausas activas. Acetaminofén 500 mg si hay dolor, máximo 3 al día."],
        ["Tensión arterial en rango normal", "Continuar actividad física y control en 6 meses."],
        ["Infección respiratoria alta", "Líquidos abundantes, reposo relativo. Volver si hay fiebre mayor a 3 días."],
    ],
    "Odontología": [
        ["Placa bacteriana leve", "Profilaxis realizada. Uso de seda dental diario."],
        ["Caries en molar 36", "Resina programada. Evitar alimentos muy fríos."],
    ],
    "Psicología": [
        ["Sesión de seguimiento", "Ejercicios de respiración y registro de pensamientos durante la semana."],
    ],
    "Pediatría": [
        ["Crecimiento adecuado para la edad", "Continuar alimentación complementaria. Próximo control en 3 meses."],
        ["Faringitis viral", "Manejo sintomático, abundantes líquidos."],
    ],
};

/** Generador pseudoaleatorio determinista para que la demo sea estable. */
function crearAleatorio(semilla: number): () => number {
    let estado = semilla;
    return () => {
        estado = (estado * 1664525 + 1013904223) % 4294967296;
        return estado / 4294967296;
    };
}

/** Borra la clínica de demostración y sus usuarios ficticios. */
export async function borrarDemo(): Promise<void> {
    await ejecutar("DELETE FROM usuarios WHERE es_demo = TRUE AND rol = 'paciente'");
    await ejecutar("DELETE FROM consultorios WHERE slug = 'demo'");
}

/** Crea la clínica de demostración completa: médicos, horarios, pacientes y citas. */
export async function sembrarDemo(): Promise<void> {
    const hash = await bcrypt.hash(CONTRASENA_DEMO, 10);
    const aleatorio = crearAleatorio(20261030);

    const [consultorio] = await ejecutar<{ id: number }>(
        `INSERT INTO consultorios (nombre, slug, ciudad, direccion, telefono, descripcion, plan, es_demo)
         VALUES ($1, 'demo', 'Medellín', 'Calle 10 # 40-20, consultorio 302', '(604) 555 0142', $2, 'consultorio', TRUE)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
        [
            "Centro Médico Aurora",
            "Consultorio de demostración de SaludConecta. Medicina general, odontología, psicología y pediatría en un solo lugar.",
        ],
    );
    if (!consultorio) return;
    const consultorioId = consultorio.id;

    await ejecutar(
        `INSERT INTO usuarios (consultorio_id, rol, nombres, apellidos, email, contrasena_hash, tipo_doc, num_doc, telefono, es_demo, acepto_datos_en)
         VALUES ($1, 'admin', 'Patricia', 'Lopera (recepción)', $2, $3, 'CC', '43000001', '300 000 0001', TRUE, NOW())
         ON CONFLICT (email) DO NOTHING`,
        [consultorioId, CORREOS_DEMO.admin, hash],
    );

    const especialidades = new Map<string, number>();
    for (const nombre of ["Medicina general", "Odontología", "Psicología", "Pediatría", "Fisioterapia"]) {
        const [fila] = await ejecutar<{ id: number }>(
            "INSERT INTO especialidades (consultorio_id, nombre) VALUES ($1, $2) RETURNING id",
            [consultorioId, nombre],
        );
        especialidades.set(nombre, fila.id);
    }

    const medicos: Array<{ id: number; semilla: MedicoSemilla }> = [];
    for (const semilla of MEDICOS_DEMO) {
        const [usuario] = await ejecutar<{ id: number }>(
            `INSERT INTO usuarios (consultorio_id, rol, nombres, apellidos, email, contrasena_hash, tipo_doc, num_doc, es_demo, acepto_datos_en)
             VALUES ($1, 'medico', $2, $3, $4, $5, 'CC', $6, TRUE, NOW()) RETURNING id`,
            [consultorioId, semilla.nombres, semilla.apellidos, semilla.email, hash, String(10000000 + medicos.length)],
        );
        const [medico] = await ejecutar<{ id: number }>(
            `INSERT INTO medicos (usuario_id, consultorio_id, especialidad_id, num_registro, biografia, duracion_cita_min)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [usuario.id, consultorioId, especialidades.get(semilla.especialidad), semilla.registro, semilla.biografia, semilla.duracion],
        );
        await ejecutar(
            `INSERT INTO disponibilidad (medico_id, dia_semana, hora_inicio, hora_fin)
             SELECT $1, d, i::time, f::time FROM unnest($2::int[], $3::text[], $4::text[]) AS t(d, i, f)`,
            [medico.id, semilla.horario.map((h) => h[0]), semilla.horario.map((h) => h[1]), semilla.horario.map((h) => h[2])],
        );
        medicos.push({ id: medico.id, semilla });
    }

    const pacientes: number[] = [];
    for (let i = 0; i < PACIENTES_DEMO.length; i += 1) {
        const [nombres, apellidos, email] = PACIENTES_DEMO[i];
        const [fila] = await ejecutar<{ id: number }>(
            `INSERT INTO usuarios (rol, nombres, apellidos, email, contrasena_hash, tipo_doc, num_doc, telefono, fecha_nac, es_demo, acepto_datos_en)
             VALUES ('paciente', $1, $2, $3, $4, 'CC', $5, $6, $7, TRUE, NOW())
             ON CONFLICT (email) DO UPDATE SET nombres = EXCLUDED.nombres
             RETURNING id`,
            [nombres, apellidos, email, hash, String(1020400100 + i * 731), `310 555 01${String(i).padStart(2, "0")}`, `${1975 + i * 4}-0${(i % 9) + 1}-1${i % 9}`],
        );
        pacientes.push(fila.id);
    }

    // Citas de los últimos 30 días y de las próximas dos semanas.
    const hoy = hoyBogota();
    const ahora = Date.now();
    const filas = {
        medico: [] as number[],
        paciente: [] as number[],
        inicio: [] as string[],
        fin: [] as string[],
        estado: [] as string[],
        motivo: [] as string[],
        diagnostico: [] as (string | null)[],
        tratamiento: [] as (string | null)[],
    };
    const ocupados = new Set<string>();

    function agregar(medico: { id: number; semilla: MedicoSemilla }, fecha: string, hora: string, pacienteId: number, estadoForzado?: string): boolean {
        const clave = `${medico.id}-${fecha}-${hora}`;
        if (ocupados.has(clave)) return false;
        ocupados.add(clave);
        const inicio = construirInstante(fecha, hora);
        const fin = new Date(inicio.getTime() + medico.semilla.duracion * 60000);
        const pasada = inicio.getTime() < ahora;
        let estadoCita = estadoForzado ?? "programada";
        if (!estadoForzado && pasada) {
            const r = aleatorio();
            estadoCita = r < 0.78 ? "completada" : r < 0.9 ? "cancelada" : "no_asistio";
        }
        const motivos = MOTIVOS[medico.semilla.especialidad];
        const resultados = RESULTADOS[medico.semilla.especialidad];
        const resultado = resultados[Math.floor(aleatorio() * resultados.length)];
        filas.medico.push(medico.id);
        filas.paciente.push(pacienteId);
        filas.inicio.push(inicio.toISOString());
        filas.fin.push(fin.toISOString());
        filas.estado.push(estadoCita);
        filas.motivo.push(motivos[Math.floor(aleatorio() * motivos.length)]);
        filas.diagnostico.push(estadoCita === "completada" ? resultado[0] : null);
        filas.tratamiento.push(estadoCita === "completada" ? resultado[1] : null);
        return true;
    }

    for (let desplazamiento = -30; desplazamiento <= 14; desplazamiento += 1) {
        const fecha = sumarDias(hoy, desplazamiento);
        const dia = diaSemana(fecha);
        for (const medico of medicos) {
            const bloques = medico.semilla.horario.filter((h) => h[0] === dia);
            for (const [, ini, fin] of bloques) {
                for (let m = minutosDeHora(ini); m + medico.semilla.duracion <= minutosDeHora(fin); m += medico.semilla.duracion) {
                    const ocupacion = desplazamiento < 0 ? 0.62 : desplazamiento < 4 ? 0.5 : 0.25;
                    if (aleatorio() < ocupacion) {
                        const paciente = pacientes[1 + Math.floor(aleatorio() * (pacientes.length - 1))];
                        agregar(medico, fecha, horaDeMinutos(m), paciente);
                    }
                }
            }
        }
    }

    // Historia propia de la paciente demo, para que su panel cuente algo.
    const mariaId = pacientes[0];
    const laura = medicos[0];
    const andres = medicos[1];
    const proximoHabil = (desde: number, dias: number[]): string => {
        for (let i = desde; i < desde + 14; i += 1) {
            const f = sumarDias(hoy, i);
            if (dias.includes(diaSemana(f))) return f;
        }
        return sumarDias(hoy, desde);
    };
    const pasadoHabil = (hasta: number, dias: number[]): string => {
        for (let i = hasta; i > hasta - 14; i -= 1) {
            const f = sumarDias(hoy, i);
            if (dias.includes(diaSemana(f))) return f;
        }
        return sumarDias(hoy, hasta);
    };
    agregar(laura, pasadoHabil(-21, [1, 2, 3, 4, 5]), "09:30", mariaId, "completada");
    agregar(andres, pasadoHabil(-12, [1, 3, 5]), "08:20", mariaId, "completada");
    agregar(laura, pasadoHabil(-5, [1, 2, 3, 4, 5]), "15:00", mariaId, "cancelada");
    agregar(laura, proximoHabil(1, [1, 2, 3, 4, 5]), "10:00", mariaId, "programada");
    agregar(andres, proximoHabil(5, [1, 3, 5]), "09:40", mariaId, "programada");

    await ejecutar(
        `INSERT INTO citas (consultorio_id, medico_id, paciente_id, inicio, fin, estado, motivo, diagnostico, tratamiento, cancelada_por)
         SELECT $1, m, p, i::timestamptz, f::timestamptz, e, mo, d, t, CASE WHEN e = 'cancelada' THEN 'paciente' ELSE NULL END
         FROM unnest($2::int[], $3::int[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[])
              AS x(m, p, i, f, e, mo, d, t)
         ON CONFLICT DO NOTHING`,
        [consultorioId, filas.medico, filas.paciente, filas.inicio, filas.fin, filas.estado, filas.motivo, filas.diagnostico, filas.tratamiento],
    );

    await ejecutar(
        `INSERT INTO notificaciones (usuario_id, titulo, cuerpo, enlace)
         VALUES ($1, 'Bienvenida a la demo', 'Esta es la cuenta de prueba de una paciente. Puedes agendar, cancelar y reprogramar citas sin miedo: los datos se reinician cada día.', '/panel/paciente')`,
        [mariaId],
    );
}

/** Borra y vuelve a crear la demo. Lo llama la tarea diaria. */
export async function reiniciarDemo(): Promise<void> {
    await borrarDemo();
    await sembrarDemo();
}
