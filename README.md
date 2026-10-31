# SaludConecta

Agenda médica en línea para consultorios y clínicas. Los pacientes reservan desde el celular, reciben recordatorios y ven las indicaciones de cada consulta; los médicos manejan su agenda y registran la atención; la recepción agenda por teléfono y saca reportes.

Proyecto del Tecnólogo en Análisis y Desarrollo de Software (SENA), ficha 3186595.

## Cómo está construido

- **Next.js 16 (App Router) + React 19 + TypeScript**, desplegado en Vercel.
- **PostgreSQL** (Neon en producción). En desarrollo, si no hay `DATABASE_URL`, la app levanta un PostgreSQL embebido (PGlite) en la carpeta `.pglite`, así que no hay que instalar nada.
- **Patrón MVC por capas**, como en la arquitectura del proyecto:
  - Modelo: `src/lib/modelos/*` (consultas SQL parametrizadas) y `src/lib/db/*` (conexión, esquema, datos de demostración).
  - Controlador: `src/app/acciones/*` (acciones de servidor que validan, autorizan y llaman al modelo).
  - Vista: `src/app/**/page.tsx` y `src/componentes/*`.
- **Seguridad**: contraseñas con bcrypt, sesión en cookie httpOnly firmada (JWT HS256), control de acceso por rol en cada página y acción, bloqueo tras 5 intentos fallidos, índice único que impide dos citas en el mismo turno, encabezados de seguridad y registro de auditoría.
- Las convenciones de código siguen la evidencia GA7-220501096-AA1-EV02: nombres en español para la lógica de negocio, camelCase para métodos y variables, PascalCase para componentes, UPPER_SNAKE_CASE para constantes, 4 espacios de sangría y JSDoc en las funciones públicas.

## Ejecutarlo en tu computador

```bash
npm install
npm run dev
```

Abre http://localhost:3000. La primera petición crea las tablas y el consultorio de demostración.

Cuentas de la demo (contraseña `demo1234`):

| Rol | Correo |
| --- | --- |
| Paciente | paciente@demo.saludconecta.co |
| Médica | medico@demo.saludconecta.co |
| Recepción | admin@demo.saludconecta.co |

## Desplegar en Vercel

1. Importa este repositorio en Vercel (Add New → Project). El framework se detecta solo.
2. En el proyecto, pestaña **Storage → Create Database → Neon**, y conéctala. Eso crea `DATABASE_URL`.
3. En **Settings → Environment Variables** agrega:
   - `AUTH_SECRET`: una cadena aleatoria larga (por ejemplo, el resultado de `openssl rand -base64 48`).
   - `CRON_SECRET`: otra cadena aleatoria; protege la tarea diaria.
   - `PLATAFORMA_CLAVE`: clave para ver en `/plataforma` los consultorios que piden contacto.
   - `NEXT_PUBLIC_URL_SITIO`: la URL pública, por ejemplo `https://saludconecta.vercel.app`.
4. Vuelve a desplegar. Las tablas se crean solas en el primer uso.

## Licencia

Código del autor para fines académicos y comerciales del proyecto SaludConecta.
