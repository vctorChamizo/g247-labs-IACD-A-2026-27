# Semana 8 - Autenticación y seguridad

La API de tareas de la semana 7 evoluciona para identificar al usuario y limitar
el acceso a sus recursos. Se mantienen PostgreSQL, SQL explícito, pool y DTO.
El recorrido principal sigue una petición completa, de Postman a PostgreSQL y
de vuelta. Las demos aisladas son un apoyo opcional para detenerse en un concepto.

**Empezar por el [paso a paso de preparación y recorrido completo](docs/05-PASO-A-PASO.md).**

## Arranque

Requisitos: Node 22 o 24 y PostgreSQL local en marcha. Usar una **base nueva**;
los usuarios de la semana 7 no tienen password_hash ni role. No modificarla.

```text
cd semana-08
npm ci
```

Copiar `.env.template` a `.env`, completar DATABASE_URL y generar JWT_SECRET
según la [guía de preparación](docs/01-PREPARACION.md). Después:

```text
npm run db:create
npm run db:migrate
npm run db:seed
npm run db:check
npm start
```

La API está en `http://localhost:3000`. Credenciales **ficticias** del seed:
`ana@example.com` y `luis@example.com`, contraseña `AulaSegura8!` para ambas.
En una base nueva hay siete tareas de Ana y tres de Luis. Repetir el seed no
duplica filas ni restablece contraseñas o cambios hechos durante la demo.

## Recorrido

- [Preparación, Windows/macOS y configuración](docs/01-PREPARACION.md).
- [Relación entre diapositivas, código y resultados](docs/02-RECORRIDO.md).
- [Pruebas manuales y uso de Postman](docs/03-PRUEBAS.md).
- [Validación técnica y limitaciones](docs/04-VALIDACION.md).
- [Paso a paso: arrancar, iniciar sesión y dejar preparada la API](docs/05-PASO-A-PASO.md).

## Demostraciones aisladas

No hay que ejecutarlas para que funcione la API ni para completar el recorrido.
Después de observar el login real, demo:jwt permite explicar qué hace sign/verify;
después del registro, demo:hash permite detenerse en hash/compare. La guía paso
a paso indica cuándo recurrir a cada una sin perder el recorrido completo.

| Comando | Concepto | Necesita DB |
|---|---|---|
| `npm run demo:jwt` | Firmar, leer, verificar, manipular y caducar un JWT | No; necesita JWT_SECRET |
| `npm run demo:hash` | Sal, hash, compare y límite de bytes | No |
| `npm run demo:validation` | Zod y normalización de páginas | No |
| `npm run demo:security` | Helmet, 429, 413 y error genérico | No |
| `npm run demo:cors` | Dos orígenes en navegador | API arrancada para completar la prueba |

Las demos de consola no añaden endpoints inseguros a la API. La de seguridad
crea servidores efímeros y un límite bajo solo para esa demostración.

## Contrato de la API

| Ruta | Comportamiento |
|---|---|
| `POST /auth/register` | `{ email, password }` → 201 `{ id, email }`; duplicado 409 |
| `POST /auth/login` | `{ email, password }` → 200 `{ token }`; error 401 |
| `GET /tasks?page=&limit=` | Bearer obligatorio; devuelve `{ page, limit, items }` propios |
| `GET /tasks/:id` | Propia 200; ajena 403; inexistente 404 |
| `POST /tasks` | `{ title, done? }`; propietario del token → 201 + Location |
| `PUT /tasks/:id` | `{ title, done }` completo y propiedad → 200 |
| `PATCH /tasks/:id` | `{ done }` y propiedad → 200 |
| `DELETE /tasks/:id` | Propiedad → 204, sin cuerpo |
| `GET /health`, `/health/db` | Salud HTTP y disponibilidad del esquema, respectivamente |

No se admite `userId` ni `role` en los cuerpos de tareas/registro. El DTO mantiene
`{ id, title, done, userId }`; el modelo conserva `user_id` hasta esa conversión.
El rol viaja en el token, pero no concede un bypass de propiedad.

## Alcance

La API usa JWT de una hora y nuevo login al caducar. Refresh tokens, cookies,
logout con revocación y React quedan fuera de esta implementación. Es un ejemplo
docente local, no una plantilla completa de seguridad para producción.
L7 conserva su enunciado y su trabajo de integración independiente.

`npm test` ejecuta pruebas con PostgreSQL real y crea DBs aleatorias propias;
la cuenta configurada necesita CREATEDB. No elimina ni vacía la base de clase.
