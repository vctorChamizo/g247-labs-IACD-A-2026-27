# Validación del ejemplo

Revisión técnica: 16, 17 y 19 de octubre de 2026. El objetivo es distinguir pruebas
ejecutadas de instrucciones contrastadas y comprobaciones pendientes.

## Ejecutado con PostgreSQL real

Se utilizó un PostgreSQL 17.10 temporal con autenticación SCRAM, en un puerto
independiente del habitual. No se instaló un servicio permanente ni se creó un
`.env` personal. Los binarios temporales no son dependencias del ejemplo.

La copia de ensayo se instaló con `npm ci` dentro de una ruta con espacios y
`ñ`, sin reutilizar `node_modules`. Se ejecutó la suite con Node 22.14.0 y
Node 24.19.0: **12 pruebas aprobadas en cada versión**.

| Comprobación | Evidencia obtenida |
|---|---|
| DB inexistente | Diagnóstico `3D000`, salida de error |
| Creación y repetición | Crear DB funciona; repetir no borra ni recrea |
| Conexión sin tablas | OK de conexión seguido de `42P01` |
| Migraciones por pasos | 001, 002 y 003 aplicadas en orden |
| Columna pendiente | `42703` antes de 003 |
| Evolución de filas | Una fila anterior recibe `priority='normal'` |
| Repetir migraciones | No quedan migraciones pendientes |
| Repetir seed | No duplica los datos de ejemplo |
| Modelo y JOIN | Filas esperadas y parámetros tratados como valores |
| SQL de referencia | Se ejecuta en esquema aislado y se revierte |
| Consultas de pgAdmin | SQL ejecutado contra las tablas reales |
| Restricciones | UNIQUE, FK y CHECK rechazan entradas inválidas |
| API CRUD | GET, POST, PUT, PATCH, DELETE y Location correctos |
| DTO | No expone `internal_note` |
| Validación HTTP | IDs inválidos, cuerpos incompletos, tipos erróneos y JSON mal formado devuelven 400 |
| Unicode y comillas | Títulos con acentos, emoji y apóstrofo conservados |
| Colección Postman | Diez peticiones ejecutadas y assertions verificadas |
| Configuración | Variables ausentes y puertos inválidos con diagnóstico |
| Credenciales incorrectas | `28P01` con SCRAM |
| Puerto incorrecto | `ECONNREFUSED`, sin modificar la DB real |
| Reinicio de Node | La tarea creada sigue disponible |
| Caída y arranque de PostgreSQL | Health HTTP 200, DB 503 durante la caída y recuperación a 200 |

Las pruebas HTTP de la colección utilizan un runner local que ejecuta las
assertions incluidas; no simulan la interfaz gráfica de Postman.
La exportación DBML también se procesó con el parser oficial `@dbml/core` y el
SQL generado se ejecutó en PostgreSQL. Ese parser solo se instaló temporalmente
para la revisión; no es requisito del proyecto.

También se revisaron sintaxis JavaScript, enlaces Markdown locales, exclusión de
`.env`/`node_modules`, estructura YAML y la instalación reproducible con lockfile.
La auditoría de dependencias del ejemplo no detectó vulnerabilidades conocidas
en esta fecha; este resultado es una fotografía, no una garantía futura.

## Windows: contraste y ejecución automática preparada

No hay una máquina Windows ni un hipervisor Windows disponible en este entorno.
El asistente EDB y los servicios de Windows no se han ejecutado en el Mac.

Se contrastaron los pasos con:

- [Instalación oficial EDB en Windows](https://www.enterprisedb.com/docs/supported-open-source/postgresql/installing/windows/).
- [Descargas PostgreSQL para Windows](https://www.postgresql.org/download/windows/).
- [Imagen Windows Server 2025 de GitHub](https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-Readme.md).

Se prepara `.github/workflows/semana-07-windows.yml`: utiliza PowerShell,
PostgreSQL 17 del runner y Node 22/24; instala con `npm.cmd ci` y ejecuta la
secuencia de preparación y los tests. El servicio y las credenciales desechables
proceden de la documentación de esa imagen, no de una configuración personal.

**Estado: preparado localmente, no publicado ni ejecutado en GitHub.** Para
obtener evidencia Windows real debe publicarse con autorización y revisarse el
resultado de ambos jobs. Aun pasando esos jobs, el asistente gráfico y los
permisos particulares de un portátil Windows siguen siendo una comprobación
manual distinta. El workflow no instala el asistente EDB: usa el motor ya
instalado en la imagen del runner.

## Otras comprobaciones pendientes

- Instalación gráfica de Postgres.app y pgAdmin desde cero: documentación
  contrastada; las pruebas del motor no equivalen a probar esos asistentes.
- Docker Compose: estructura YAML revisada; no se ha ejecutado Docker en este
  equipo. Es una alternativa, no un requisito para seguir la ruta nativa.
- Botones y menús de dbdiagram, pgAdmin y Postman: las funciones se contrastaron
  con sus fuentes oficiales; las interfaces no se automatizaron visualmente.

Fuentes complementarias:
[Postgres.app](https://postgresapp.com/documentation/install.html),
[permisos locales de Postgres.app](https://postgresapp.com/documentation/app-permissions.html),
[consultas parametrizadas pg](https://node-postgres.com/features/queries),
[dbdiagram](https://docs.dbdiagram.io/basic-editing-experience/) y
[pgAdmin ERD](https://www.pgadmin.org/docs/pgadmin4/latest/erd_tool.html).

## Repetir la validación

Con el servidor PostgreSQL en marcha y `.env` completo, desde `semana-07`:

```text
npm ci
npm test
npm audit --omit=dev
```

Las pruebas crean y eliminan únicamente sus DBs aleatorias. No necesitan que
`aula_web` esté migrada, pero sí una cuenta que pueda crear bases. La guía
`03-RECORRIDO-Y-PRUEBAS.md` complementa los tests con comprobaciones manuales.
