/**
 * Esquema de la base de datos de SaludConecta.
 *
 * Cada sentencia es idempotente (IF NOT EXISTS), así que se puede ejecutar
 * cuantas veces haga falta. Cuando cambie el esquema, se sube VERSION_ESQUEMA
 * y se añaden las sentencias nuevas al final de la lista.
 */
export const VERSION_ESQUEMA = "3";

export const SENTENCIAS_ESQUEMA: string[] = [
    `CREATE TABLE IF NOT EXISTS meta (
        clave TEXT PRIMARY KEY,
        valor TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS consultorios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL,
        slug VARCHAR(60) NOT NULL UNIQUE,
        ciudad VARCHAR(80),
        direccion VARCHAR(150),
        telefono VARCHAR(30),
        descripcion TEXT,
        plan VARCHAR(20) NOT NULL DEFAULT 'basico',
        es_demo BOOLEAN NOT NULL DEFAULT FALSE,
        creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        consultorio_id INT REFERENCES consultorios(id) ON DELETE CASCADE,
        rol VARCHAR(10) NOT NULL CHECK (rol IN ('paciente', 'medico', 'admin')),
        nombres VARCHAR(100) NOT NULL,
        apellidos VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        contrasena_hash VARCHAR(255) NOT NULL,
        tipo_doc VARCHAR(20),
        num_doc VARCHAR(20),
        telefono VARCHAR(30),
        fecha_nac DATE,
        es_demo BOOLEAN NOT NULL DEFAULT FALSE,
        acepto_datos_en TIMESTAMPTZ,
        creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS usuarios_consultorio_idx ON usuarios(consultorio_id)`,
    `CREATE INDEX IF NOT EXISTS usuarios_doc_idx ON usuarios(num_doc)`,
    `CREATE TABLE IF NOT EXISTS especialidades (
        id SERIAL PRIMARY KEY,
        consultorio_id INT NOT NULL REFERENCES consultorios(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL,
        UNIQUE (consultorio_id, nombre)
    )`,
    `CREATE TABLE IF NOT EXISTS medicos (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
        consultorio_id INT NOT NULL REFERENCES consultorios(id) ON DELETE CASCADE,
        especialidad_id INT REFERENCES especialidades(id) ON DELETE SET NULL,
        num_registro VARCHAR(50),
        biografia TEXT,
        duracion_cita_min INT NOT NULL DEFAULT 30 CHECK (duracion_cita_min BETWEEN 10 AND 180),
        activo BOOLEAN NOT NULL DEFAULT TRUE
    )`,
    `CREATE TABLE IF NOT EXISTS disponibilidad (
        id SERIAL PRIMARY KEY,
        medico_id INT NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
        dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
        hora_inicio TIME NOT NULL,
        hora_fin TIME NOT NULL,
        CHECK (hora_fin > hora_inicio)
    )`,
    `CREATE TABLE IF NOT EXISTS bloqueos (
        id SERIAL PRIMARY KEY,
        medico_id INT NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
        fecha DATE NOT NULL,
        motivo VARCHAR(150),
        UNIQUE (medico_id, fecha)
    )`,
    `CREATE TABLE IF NOT EXISTS citas (
        id SERIAL PRIMARY KEY,
        consultorio_id INT NOT NULL REFERENCES consultorios(id) ON DELETE CASCADE,
        medico_id INT NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
        paciente_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        inicio TIMESTAMPTZ NOT NULL,
        fin TIMESTAMPTZ NOT NULL,
        estado VARCHAR(15) NOT NULL DEFAULT 'programada'
            CHECK (estado IN ('programada', 'completada', 'cancelada', 'no_asistio')),
        motivo TEXT,
        diagnostico TEXT,
        tratamiento TEXT,
        notas_medico TEXT,
        cancelada_por VARCHAR(10),
        recordatorio_enviado BOOLEAN NOT NULL DEFAULT FALSE,
        creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS citas_medico_inicio_activa
        ON citas(medico_id, inicio) WHERE estado <> 'cancelada'`,
    `CREATE INDEX IF NOT EXISTS citas_paciente_idx ON citas(paciente_id, inicio)`,
    `CREATE INDEX IF NOT EXISTS citas_consultorio_idx ON citas(consultorio_id, inicio)`,
    `CREATE TABLE IF NOT EXISTS notificaciones (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        titulo VARCHAR(150) NOT NULL,
        cuerpo TEXT,
        enlace VARCHAR(200),
        leida BOOLEAN NOT NULL DEFAULT FALSE,
        creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS notificaciones_usuario_idx ON notificaciones(usuario_id, creado_en DESC)`,
    `CREATE TABLE IF NOT EXISTS auditoria (
        id SERIAL PRIMARY KEY,
        usuario_id INT,
        accion VARCHAR(60) NOT NULL,
        entidad VARCHAR(40),
        entidad_id INT,
        detalle TEXT,
        creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS intentos_login (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) NOT NULL,
        exitoso BOOLEAN NOT NULL,
        creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS intentos_login_email_idx ON intentos_login(email, creado_en)`,
    `CREATE TABLE IF NOT EXISTS prospectos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL,
        email VARCHAR(150) NOT NULL,
        telefono VARCHAR(30),
        consultorio VARCHAR(150),
        ciudad VARCHAR(80),
        medicos VARCHAR(20),
        mensaje TEXT,
        creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
];
