# Del diseño a la base de datos

## 1. Plantear el modelo antes del SQL

Un usuario tiene un email único y puede tener muchas tareas. Cada tarea pertenece
a un usuario y tiene título y estado. La relación es **users 1 → N tasks**.
No se guarda un array de tareas en una celda ni se repite el email en cada fila:
se almacena `tasks.user_id`, que referencia `users.id`.

| Diseño | Base de datos | Código |
|---|---|---|
| Entidad usuario | Tabla `users` | Filas devueltas por `pg` |
| Identidad | PK `id` generada | `task.id` |
| Pertenencia a usuario | FK `tasks.user_id` | `task.userId` por alias SQL |
| Email único | `UNIQUE NOT NULL` | Error `23505` si se duplica |
| Estado de tarea | `BOOLEAN DEFAULT FALSE` | Booleano JavaScript |
| Regla de título | `CHECK` y `NOT NULL` | Validación HTTP y garantía en DB |

Se usan tres significados relacionados de «modelo»: el diseño de entidades, el
esquema declarado en migraciones y el módulo `tasksModel.js` que accede a datos.
El DTO selecciona los campos públicos y no tiene ninguna de estas responsabilidades.

## 2. Ejemplo con dbdiagram: diseño → SQL

1. Abrir [dbdiagram.io](https://dbdiagram.io/) y crear un diagrama.
2. Pegar `db/design/model.dbml`. Observar `users`, `tasks` y la línea 1:N.
3. Localizar PK, FK, nulabilidad, valor por defecto y unicidad en el DBML.
4. Usar la exportación/generación de SQL y elegir **PostgreSQL**.
5. Guardar el resultado localmente y compararlo con
   `db/design/export-reference.sql` y las migraciones 001/002.

La herramienta genera DDL; no genera automáticamente un modelo Node ni un
historial de migraciones. Revisar tipos, autoincremento, FK y reglas de borrado.
En este DBML el CHECK del título es una nota explicativa: debe añadirse al SQL
efectivo. También es válido que el exportador use SERIAL en lugar de IDENTITY.
Se usan datos ficticios; no es necesario subir credenciales ni conectar la DB.

La [documentación de dbdiagram](https://docs.dbdiagram.io/basic-editing-experience/)
explica la generación de SQL desde el diseño. Si la interfaz solicita cuenta,
puede utilizarse el ejemplo local con pgAdmin del siguiente apartado.

## 3. Ejemplo con pgAdmin: SQL → diagrama

Tras aplicar las migraciones, abrir **ERD Tool** para `aula_web` desde el menú
contextual/herramientas disponible en la versión instalada. Seleccionar las
tablas del ejercicio y observar la FK. `schema_migrations` guarda el historial;
no es una entidad del dominio.

El [ERD Tool de pgAdmin](https://www.pgadmin.org/docs/pgadmin4/latest/erd_tool.html)
también permite diseñar tablas y generar SQL. Crear un diseño de prueba con
`users(id, email)` y `tasks(id, user_id, title, done)`, añadir la relación y usar
**Generate SQL** para comparar el resultado. Revisar el SQL sin ejecutarlo sobre
la DB ya migrada: volvería a intentar crear las mismas tablas.

Una exportación es un punto de partida revisable, no un comando que deba
ejecutarse a ciegas sobre una base con datos.

## 4. Declarar el modelo: migración

Las migraciones son archivos SQL versionados y ordenados. El ejecutor de apoyo
aplica las pendientes en una transacción y registra sus nombres en
`schema_migrations` para no repetirlas. El foco de la explicación es el SQL de
001, 002 y 003; no hay configuración adicional de un framework que estudiar.

Para ver el proceso por pasos, partir de una base recién creada y **sin ejecutar
antes `db:migrate`**:

```text
npm run db:step
npm run db:status
```

Se aplica 001 y aparece `users`. Repetir `db:step`: se aplica 002 y aparece
`tasks`, dependiente de `users`. Todavía falta `priority`; `db:check` detecta ese
desajuste del esquema. Una tercera ejecución aplica 003 y añade la columna con
valor por defecto. Ejecutar después `db:seed` y `db:check`.

Si las tres ya estaban aplicadas, `db:step` no cambia nada. Usar `db:status`
para reconocer el estado; no borrar tablas para repetir la demostración.

Se puede observar el efecto de 003 sobre filas existentes insertando una tarea
desde pgAdmin después de 002 (con un usuario previamente creado) y aplicando
003. La fila obtiene `priority='normal'` sin volver a insertarla.

Para el arranque habitual, `npm run db:migrate` aplica todas las pendientes.
Para un cambio futuro, crear `004_add_due_date.sql` en `db/migrations/`, escribir
y revisar el `ALTER TABLE` y aplicar el archivo con `db:step`. No editar
001/002/003 si ya se han compartido y aplicado. Eliminar una columna pierde
sus valores; el ejemplo no incluye comandos de rollback ni reset.

Si las tablas se crearon con una versión anterior de este ejemplo, usar otro
nombre de base y ejecutar `db:create`: el ejecutor detecta tablas sin su historial
y se detiene para conservar los datos anteriores.

## 5. Exportar al código: el módulo de acceso a datos

Abrir `src/models/tasksModel.js`. No se necesita un ORM para definir un modelo:
cada método de este módulo ejecuta una consulta y devuelve datos JavaScript.
`pg` transporta las consultas y transforma las filas; los archivos SQL declaran
y evolucionan el esquema.

| Operación JS | SQL | HTTP |
|---|---|---|
| `findAll`, `findById` | `SELECT` | GET |
| `create` | `INSERT ... RETURNING` | POST |
| `replace`, `setDone` | `UPDATE ... RETURNING` | PUT / PATCH |
| `remove` | `DELETE`, comprobar `rowCount` | DELETE |
| `findForEmail` | `JOIN` y `WHERE ... = $1` | Demo de terminal |

Las rutas conservan sus URLs. Los controladores sí se adaptan para esperar las
promesas del modelo y dejar de modificar el array con `Object.assign`: la API
anterior todavía no tenía una frontera de persistencia asíncrona.

Ejecutar `npm run demo:model` y señalar la correspondencia entre el parámetro
JavaScript, `$1`, `rows` y `console.table`. No existe generación automática de
código de dominio a partir del diagrama en este ejemplo: la traducción es
explícita para entender qué aporta cada capa.
