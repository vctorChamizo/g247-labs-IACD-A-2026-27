# Preparar el entorno

## 1. Servidor PostgreSQL

Se utiliza el mismo motor que la semana 7. Si no está instalado, seguir la
[instalación nativa Windows/macOS](../../semana-07/docs/01-INSTALACION.md)
solo hasta tener el servidor en marcha. No ejecutar los comandos de migración
de esa semana sobre esta base.

Windows: abrir Servicios y comprobar que PostgreSQL esté en ejecución. macOS:
abrir Postgres.app y arrancar el servidor. Docker no es necesario para este
ejemplo. pgAdmin permite inspeccionar la DB, pero no sustituye el servicio.

## 2. Dependencias y variables

Abrir una terminal dentro de `semana-08`:

```text
node --version
npm ci
```

Windows PowerShell:

```powershell
Copy-Item .env.template .env
```

macOS:

```sh
cp .env.template .env
```

No sobrescribir un `.env` ya configurado. Si PowerShell bloquea npm.ps1, usar
`npm.cmd` en lugar de `npm` en todos los comandos. No hace falta cambiar la
política global de ejecución.

Completar en el editor:

```text
DATABASE_URL=postgresql://USUARIO:CLAVE@127.0.0.1:5432/aula_web_semana08
JWT_SECRET=PEGAR_UN_SECRETO_ALEATORIO
PORT=3000
CORS_ORIGINS=http://localhost:5173
```

USUARIO/CLAVE son marcadores, no credenciales funcionales. Windows suele usar
el usuario postgres; Postgres.app suele crear el nombre corto del usuario del
Mac. No asumir que son iguales en todos los equipos.

Una URL requiere codificar caracteres especiales de usuario/contraseña:
`@` se escribe `%40`, `#` se escribe `%23`, etc. Puede obtenerse la representación
con `encodeURIComponent` en una consola local. No subir la URL ni proyectar una
contraseña que se utilice en otros servicios. En Postgres.app con trust puede
no verificarse la contraseña; cambiarla no demostraría un fallo de autenticación.

Para generar JWT_SECRET, este comando es igual en ambas terminales:

```text
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copiar el resultado en `.env`. El script genera un secreto **local nuevo**, no
una contraseña de usuario. La aplicación rechaza secretos de menos de 32 bytes.
No se proporciona un fallback conocido. Cambiarlo invalida los tokens anteriores.

Las variables definidas en la terminal tienen prioridad sobre `.env`. Si se
utiliza otro puerto HTTP, ajustar también Postman; la página CORS del ejemplo
apunta a 3000 y debe modificarse si se decide usar otro puerto.

## 3. Base nueva y esquema

```text
npm run db:create
npm run db:status
npm run db:migrate
npm run db:seed
npm run db:check
```

Se esperan dos migraciones aplicadas y tres niveles OK: conexión, esquema y
recuentos. En una DB nueva: dos usuarios y diez tareas. El seed permite empezar
el martes por login/JWT; el código de bcrypt se estudia después.

El ejecutor se detiene ante tablas/historial de otro ejemplo. Elegir otra DB
en la URL, no borrar la anterior. `db:create` se conecta primero a postgres para
crear la nueva base y necesita permiso CREATEDB. Si no se dispone de él, crear
una DB vacía desde pgAdmin con una cuenta autorizada.

## 4. Arranque y diagnóstico

```text
npm start
```

Abrir `/health` y `/health/db`. El primero comprueba Express; el segundo comprueba
columnas del esquema. Node arranca aunque PostgreSQL esté caído para poder
observar la diferencia; sí se detiene de inmediato si faltan variables obligatorias.

| Síntoma | Comprobar |
|---|---|
| CONFIG | Variable indicada, formato de URL o longitud del secreto |
| ECONNREFUSED | Servicio parado o host/puerto equivocados |
| 28P01 | Usuario/contraseña de la URL y su codificación |
| 3D000 | Falta crear la base seleccionada |
| 42P01 / 42703 | Migraciones pendientes o DB de otra semana |
| 42501 | Permisos para crear bases/tablas |
| Puerto 3000 ocupado | Detener la API anterior o elegir otro puerto coherente |
| 429 durante muchas pruebas | Esperar la ventana de un minuto o reiniciar esta API local |

Ctrl+C cierra HTTP y el pool, no el servicio PostgreSQL. Los datos permanecen.

## Dependencias

Se usa una librería por función: pg, jsonwebtoken, bcryptjs, Zod, cors, helmet
y express-rate-limit. No hay Knex ni ORM. Zod se fija a una versión 4 corregida
por la auditoría de dependencias; se conserva la API pedagógica safeParse/issues.
