# Semana 7 - Del diseño al modelo PostgreSQL

Continuación de la API de tareas de la semana 6. Se recorre el diseño de entidades,
la creación de la base, las migraciones y el módulo JavaScript que consulta SQL.

Requisitos: Node.js 22 o superior y PostgreSQL (instalación nativa o Docker).

## Comenzar

Desde la terminal, entrar en `semana-07`, ejecutar `npm ci`, copiar `.env.template`
a `.env` y completar la contraseña. Seguir primero la
[guía de instalación para Windows y macOS](docs/01-INSTALACION.md).

Con PostgreSQL en marcha, los comandos son iguales en ambos sistemas:

```text
npm run db:create
npm run db:migrate
npm run db:seed
npm run db:check
npm run demo:model
npm run demo:errors
npm start
```

`db:check` comprueba conexión, esquema y datos por separado. `demo:errors`
provoca errores previstos dentro de transacciones que se revierten.

## Recorrido

1. [Instalar, levantar y crear una base](docs/01-INSTALACION.md).
2. [Diseñar, exportar y migrar el modelo](docs/02-DISENO-Y-MIGRACIONES.md).
3. [Seguir el código y comprobar errores](docs/03-RECORRIDO-Y-PRUEBAS.md).
4. [Consultar la validación y sus límites](docs/05-VALIDACION.md).
5. [Usar agentes para generar DBML e infraestructura PostgreSQL](docs/06-AGENTES-DE-MODELADO.md).

El esquema inicial está en `db/design/model.dbml`; las migraciones en
`db/migrations/`; las consultas manuales en `db/queries.sql`; el módulo de acceso
a datos en `src/models/tasksModel.js`. Las migraciones y el seed son SQL puro;
un ejecutor de apoyo los aplica con `pg`. Su funcionamiento interno no forma
parte del recorrido de clase.

Si se utilizó una versión anterior del ejemplo con otro gestor de migraciones,
elegir un nombre nuevo en `PGDATABASE` (por ejemplo `aula_web_sql`) y ejecutar
`db:create`. Así se conserva la base anterior sin mezclar historiales.

## API

| Petición | Resultado |
|---|---|
| `GET /health` | 200 si Express responde |
| `GET /health/db` | 200 con DB y esquema listos; 503 si fallan |
| `GET /tasks` | Lista persistida |
| `GET /tasks/:id` | Tarea o 404 |
| `POST /tasks` | Crear: `{ "title": "Probar SQL", "done": false, "userId": 1 }` |
| `PUT /tasks/:id` | Reemplazar los mismos tres campos obligatorios |
| `PATCH /tasks/:id` | Actualizar únicamente `{ "done": true }` |
| `DELETE /tasks/:id` | 204 al borrar; 404 si no existe |

Consultar los identificadores reales con `GET /tasks` o pgAdmin: las secuencias
pueden tener huecos, incluso después de una transacción revertida. `priority`
se muestra para explicar la migración 003 y es de solo lectura en esta API.
`internal_note` queda fuera de la respuesta mediante el DTO.

Para probar la API se incluye una [colección Postman](postman/Semana-07.postman_collection.json).
Seleccionar Postman Desktop o Desktop Agent para acceder a `localhost`.

## Validación

`npm test` requiere un servidor PostgreSQL accesible y las variables de conexión.
Las pruebas crean sus propias bases independientes, aplican las migraciones y
las eliminan al finalizar. No usan ni vacían `aula_web`; el usuario local necesita
permiso para crear bases. En Windows se puede usar `npm.cmd test`.
