# Recorrido del código y pruebas observables

## Bloque 1. Diseño y responsabilidades

Abrir `db/design/model.dbml` y localizar las entidades y la relación 1:N.
Exportar SQL, comparar con `export-reference.sql` y leer las migraciones
001/002. Detenerse en `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `UNIQUE`,
`DEFAULT` y `CHECK`: son reglas de la DB, incluso si el dato no entra por Express.

## Bloque 2. Del servidor vacío al esquema actualizado

Seguir la guía de instalación. Distinguir la inicialización del servidor, la
creación de `aula_web`, la aplicación de migraciones y el seed. Recorrer 001,
002 y 003 con `db:step` en una base nueva. Mostrar el historial en pgAdmin.
Repetir `db:migrate` para comprobar que no vuelve a crear las tablas.

## Bloque 3. Conectar desde Node

Abrir `src/db/config.js`, después `pool.js` y `scripts/checkDatabase.js`.
La configuración se carga de `.env`; el pool administra conexiones reutilizables.
El script de diagnóstico usa un cliente que cierra al terminar.

```text
npm run db:check
npm run db:check -- --wrong-port
```

El primero debe completar los tres OK. El segundo debe salir con código distinto
de cero y mostrar un fallo de conexión (normalmente `ECONNREFUSED`); no cambia
`.env` ni detiene PostgreSQL. Volver a ejecutar el primero y observar que funciona.

Para un fallo de credenciales, cambiar temporalmente `PGPASSWORD` en `.env`,
ejecutar `db:check` y restituirla. Se espera `28P01` si el servidor exige
contraseña; una instalación `trust` acepta la conexión sin comprobarla.
Para una base inexistente, cambiar temporalmente `PGDATABASE`, comprobar el
`3D000` y restaurar el nombre. No ejecutar `db:create` con el nombre de prueba.

Un fallo de esquema puede observarse antes de migrar (`42P01`) o después de 002
y antes de 003 (`42703`). No eliminar tablas para provocar estos errores.

## Bloque 4. De SQL a una función JavaScript

Leer en orden `findAll`, `findById` y `findForEmail` en `tasksModel.js`.
El modelo recibe el pool, ejecuta SQL parametrizado y devuelve filas.
`rows[0]` puede ser `undefined`: el controlador decide convertirlo en HTTP 404.

```text
npm run demo:model
```

La primera tabla muestra tareas; la segunda muestra el JOIN con el usuario Ana.
La prueba con `"' OR 1=1 --"` devuelve cero filas porque `$1` representa un valor.
No se concatena la entrada del usuario al texto SQL.

Continuar con `create`, `replace`, `setDone` y `remove`. `RETURNING` permite
devolver la fila que PostgreSQL acaba de guardar. `rowCount` indica cuántas filas
ha afectado un DELETE.

## Bloque 5. Restricciones que realmente fallan

```text
npm run demo:errors
```

Leer el caso antes de ejecutarlo en `scripts/demoErrors.js`. La salida debe
mostrar cuatro fallos **ESPERADOS**: email duplicado (`23505`), usuario que no
existe (`23503`), título vacío (`23514`) y columna inexistente (`42703`).
Cada caso usa `BEGIN` y `ROLLBACK` en el mismo cliente. La DB rechaza el dato y
no quedan nuevas filas, aunque las secuencias de identidad pueden avanzar.
Si una restricción deja de funcionar, el script termina con error; no convierte
un fallo inesperado en una demostración aparentemente correcta.

## Bloque 6. Una petición completa

Ejecutar `npm start`, importar la colección Postman y seguir este recorrido:

```text
HTTP → ruta en app.js → controlador → modelo → pool → PostgreSQL
HTTP ← JSON/DTO       ← controlador ← filas  ← pool ← PostgreSQL
```

Usar Postman Desktop o Desktop Agent y seleccionar `baseUrl` de la colección.
Comprobar `/health`, `/health/db` y el listado. En una DB recién sembrada el
usuario 1 existe; si se ha trabajado antes, consultar su id real y ajustar
`userId` en las variables de la colección.

Ejecutar Crear, Leer, Reemplazar, Completar y Eliminar en orden. La petición de
creación guarda `taskId` para las siguientes. Una FK inválida responde 400 y una
tarea ausente 404. `priority` tiene default en DB y aparece en el DTO;
`internal_note` no se expone.

Crear una tarea y reiniciar solo Node. El listado mantiene esa tarea. Así se
comprueba la diferencia entre un array de proceso y persistencia en DB.

Con Node en marcha, detener PostgreSQL desde su aplicación/servicio (o
`docker compose stop`). `/health` continúa devolviendo 200; `/health/db` devuelve
503. Reiniciar PostgreSQL y repetir `/health/db`: el pool puede abrir conexiones
nuevas. Revisar la terminal para ver el diagnóstico sin publicar detalles SQL.

## Bloque 7. Comprobación reproducible del conjunto

```text
npm test
```

Requiere PostgreSQL accesible y `.env` configurado. Las pruebas crean DBs con
nombres aleatorios, aplican cada migración, comprueban la evolución de una fila,
repiten seed/migraciones y ejecutan CRUD y errores HTTP con PostgreSQL real.
También ejecutan los scripts de terminal y las diez peticiones de la colección.
Finalmente eliminan solo esas DBs de prueba. La cuenta local necesita CREATEDB.

## Cómo ampliar el ejemplo

Primero añadir una migración de `due_date`; después leer el nuevo campo en SQL;
después incorporarlo al DTO y, por último, validar su escritura en el controlador.
Comprobar cada paso antes de avanzar. Otra ampliación es filtrar tareas por
usuario con un parámetro HTTP que termine en `$1` en el modelo. El ejercicio
actual deja visible el recorrido necesario para construir esas ampliaciones.
