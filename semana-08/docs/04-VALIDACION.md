# Validación del ejemplo

Comprobaciones realizadas el 26 de octubre de 2026. Estos resultados describen
la versión local preparada; no acreditan una publicación ni una ejecución de CI.

## Ejecutado

| Entorno o comprobación | Resultado |
|---|---|
| macOS, Node 22.14.0, PostgreSQL 17.10 real | 21 pruebas, 21 correctas |
| macOS, Node 24.22.1, mismo motor PostgreSQL | 21 pruebas, 21 correctas |
| Copia limpia en ruta con espacios y ñ, npm ci | Instalación y suite correctas |
| Migraciones, repetición y guardia de esquema anterior | Aplicación y rollback comprobados |
| Seed repetido y hashes bcrypt | Sin duplicar tareas; compare correcto |
| Colección Postman: 28 peticiones y scripts | Ejecutados mediante runner local de integración |
| JWT, propiedad, CRUD, validación, SQL y paginación | Casos de éxito y fallo comprobados por la suite |
| Demos JWT, hash, Zod y seguridad | Ejecutadas por la suite, incluido 429/413/500 |
| Chrome real, páginas localhost:5173 y :5174 | Lectura permitida y bloqueada por CORS, respectivamente |
| PostgreSQL detenido y vuelto a levantar, Express activo | health 200; health/db 503 y recuperación a 200 |
| npm audit del ejemplo | Sin vulnerabilidades conocidas en la ejecución realizada |

La suite usa el motor PostgreSQL, no una imitación de sus consultas. El servidor
de validación se levantó temporalmente fuera del repositorio; no se añade como
dependencia del ejemplo ni obliga a instalar Docker. Las bases aleatorias de
las pruebas se eliminan al finalizar. Las cuentas usadas son ficticias.

Las 28 peticiones de la colección se ejecutan con sus variables, prerequest y
assertions mediante fetch y un contexto aislado de JavaScript en la suite.
Esto verifica su lógica y contrato HTTP; no se ha automatizado la interfaz de
importación de Postman. Para mostrar CORS sí se utilizó un navegador real.

## Windows y límites de la comprobación

La guía documenta PowerShell, npm.cmd, el servicio PostgreSQL y los problemas
habituales de configuración. Los scripts de aplicación usan Node/pg, sin Bash,
psql ni herramientas específicas de macOS.

El workflow `.github/workflows/semana-08-windows.yml` prepara Node 22/24 sobre
Windows con PostgreSQL y ejecuta instalación, DB, demos y suites. **Todavía no
se ha ejecutado**: debe revisarse su resultado después de publicar. Tampoco se
ha realizado una instalación interactiva nativa de Windows desde este equipo.
Una ejecución macOS no demuestra por sí sola esas dos comprobaciones.

Refresh tokens, revocación, despliegue HTTPS y seguridad completa de producción
no forman parte de esta implementación. Los tokens Bearer de las demos no se
deben compartir fuera del entorno local.

## Repetir

Seguir 01-PREPARACION.md y después ejecutar npm test. Las comprobaciones de
navegador y parada del servicio se describen en 02-RECORRIDO.md y 03-PRUEBAS.md;
no se incluyen en npm test para no detener el PostgreSQL de quien lo ejecute
ni exigir un navegador instalado.
