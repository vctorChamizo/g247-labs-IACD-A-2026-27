# Instalar y levantar PostgreSQL

Se necesita un servidor PostgreSQL real. pgAdmin es una interfaz para usarlo;
instalar solo pgAdmin no instala necesariamente el servidor. Node y Express
también son procesos diferentes. Para este ejemplo basta PostgreSQL 17.

Se propone instalación nativa para comenzar sin introducir WSL ni contenedores.
Si Docker Desktop ya está disponible, la alternativa al final permite usar los
mismos comandos del proyecto en Windows y macOS.

## 1. Preparar el proyecto

Abrir la carpeta del repositorio en VS Code y una terminal. Windows: PowerShell;
macOS: Terminal/zsh. Desde la raíz del repositorio:

```text
cd semana-07
node --version
npm --version
npm ci
```

Usar Node 22 o superior. Si PowerShell bloquea `npm.ps1`, usar `npm.cmd` en lugar
de `npm` o abrir una terminal CMD; no es necesario cambiar la política global.

Copiar la plantilla según el sistema:

```powershell
# Windows / PowerShell
Copy-Item .env.template .env
```

```sh
# macOS
cp .env.template .env
```

Abrir `.env` en el editor. Este fichero no se sube al repositorio. No volver a
copiar la plantilla sobre una configuración ya completada.

Si la contraseña contiene `#` o espacios, encerrarla entre comillas dobles:
`PGPASSWORD="mi clave#local"`. No dejar espacios alrededor del nombre de variable.
Usar las variables en el archivo, no comandos de asignación de Bash en PowerShell.
Las variables ya definidas en la terminal tienen prioridad sobre `.env`; si el
diagnóstico muestra una DB o usuario inesperados, revisar esa terminal.

## 2A. Windows: PostgreSQL con instalador

1. Abrir [PostgreSQL para Windows](https://www.postgresql.org/download/windows/)
   y descargar el instalador EDB de PostgreSQL 17 adecuado al equipo.
2. Instalar **PostgreSQL Server**, **pgAdmin 4** y **Command Line Tools**.
   Stack Builder no es necesario para este ejemplo.
3. Anotar la contraseña elegida para `postgres`. Mantener el puerto `5432` si
   está disponible. Conservar la ubicación de datos propuesta.
4. Al terminar, el servidor se ejecuta como un servicio de Windows.
   Abrir **Servicios** desde Inicio, localizar el servicio que incluya
   `postgresql` y `17`, y comprobar que figure **En ejecución**. Si está parado,
   usar **Iniciar**. Este paso puede requerir permisos de administrador.
5. Completar `.env`: `PGUSER=postgres`, `PGPASSWORD=` con la contraseña elegida,
   `PGPORT=5432`, `PGHOST=127.0.0.1`, `PGDATABASE=aula_web`.

El [asistente oficial de EDB](https://www.enterprisedb.com/docs/supported-open-source/postgresql/installing/windows/)
incluye también los pasos de locale, resumen y confirmación. Mantener el locale
predeterminado si no existe un requisito específico. Si el asistente informa de
un fallo de inicialización, no continuar con las migraciones: primero comprobar
que la instalación terminó y el servicio existe.

Desde PowerShell se pueden hacer estas comprobaciones de solo lectura:

```powershell
Get-Service -Name '*postgres*'
Test-NetConnection -ComputerName 127.0.0.1 -Port 5432
```

Se espera un servicio `Running` y `TcpTestSucceeded : True`. La segunda prueba
solo demuestra que un proceso escucha en el puerto, no valida contraseña ni DB.
Si PostgreSQL usa otro puerto, modificar también el argumento de la prueba.

No es necesario añadir `psql` al PATH: los scripts Node realizan la creación y
las comprobaciones. Si hay otro PostgreSQL escuchando en 5432, elegir otro
puerto durante la instalación y escribir ese mismo puerto en `.env`.

## 2B. macOS: Postgres.app

1. Descargar [Postgres.app](https://postgresapp.com/) para la arquitectura del
   Mac y una versión que incluya PostgreSQL 17. Moverla a Aplicaciones.
2. Abrirla y pulsar **Initialize** al crear el primer servidor. Este paso prepara
   el clúster local de PostgreSQL; todavía no crea las tablas del ejercicio.
3. Comprobar que el servidor aparezca en marcha y su puerto sea `5432`.
4. En Terminal ejecutar `whoami`. Postgres.app crea normalmente un usuario con
   ese nombre corto. Escribir ese valor en `PGUSER` de `.env`.
5. Mantener `PGDATABASE=aula_web` y `PGHOST=127.0.0.1`. Completar `PGPASSWORD`
   con un valor local; en una instalación con autenticación `trust` la contraseña
   no se verifica. El código exige la variable para mantener la configuración
   explícita; no significa que PostgreSQL la esté comprobando.

El botón **Start** levanta el servidor y **Stop** lo detiene. Si Postgres.app pide
autorizar una conexión local, revisarla y permitir el cliente utilizado.
No ejecutar a la vez otro servidor PostgreSQL con el mismo puerto.

Para demostrar un fallo de contraseña usar la instalación Windows con contraseña
o la alternativa Docker: con `trust`, cambiar la contraseña no provoca error.
Estas configuraciones son locales de aprendizaje; no son una guía de despliegue.

## 3. Crear la base, sus tablas y sus datos

Con el servidor en marcha, desde `semana-07`:

```text
npm run db:create
npm run db:check
```

`db:create` conecta primero a la base administrativa `postgres` y crea
`aula_web`. No se conecta a una base inexistente para intentar crearla.
Repetirlo informa de que ya existe, sin vaciarla.

La primera comprobación debe mostrar **OK 1/3** y después un fallo `42P01`:
la conexión funciona, pero todavía faltan tablas. Es un resultado previsto.

```text
npm run db:migrate
npm run db:status
npm run db:seed
npm run db:check
```

Ahora deben aparecer los tres OK y, en una base nueva, dos usuarios y tres tareas.
Si ya se ha utilizado la API, los recuentos pueden ser distintos. `db:seed` no
borra datos ni duplica los ejemplos que ya existan.

**Servidor**, **base de datos**, **tablas** y **filas** son cuatro niveles
distintos: arrancar PostgreSQL no crea automáticamente el modelo del proyecto.

## 4. Ver la base desde pgAdmin

En Windows se incluye con el instalador. En Mac puede instalarse desde
[pgAdmin Downloads](https://www.pgadmin.org/download/).

Registrar una conexión de servidor: nombre visible `Aula local`, host
`127.0.0.1`, puerto de `.env`, maintenance database `postgres`, usuario y
contraseña de `.env`. El nombre visible no crea una base. Una contraseña maestra
que pgAdmin solicite para guardar conexiones tampoco es la contraseña PostgreSQL.

Refrescar **Databases**, abrir `aula_web → Schemas → public → Tables` y localizar
`users`, `tasks` y `schema_migrations`. Abrir **Query Tool**
sobre `aula_web`, cargar `db/queries.sql` y ejecutar las consultas una por una.
No ejecutarlas sobre `postgres` por error.

## 5. Levantar y detener la API

```text
npm start
```

Abrir `http://localhost:3000/health`, después `/health/db` y `/tasks`.
Ctrl+C detiene Node y cierra su pool, pero el servidor PostgreSQL sigue en marcha.
Volver a arrancar Node conserva las tareas porque viven en PostgreSQL.

## Alternativa: Docker Desktop en ambos sistemas

Instalar [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
o [para Mac](https://docs.docker.com/desktop/setup/install/mac-install/) y abrirlo.
En Windows se necesitan los requisitos de virtualización y WSL 2 indicados por
Docker; preparar esto antes de la sesión puede requerir reinicio y permisos.

Usar `PGUSER=postgres`, una contraseña local en `PGPASSWORD`,
`PGHOST=127.0.0.1` y `PGPORT=5432` en `.env`. Desde `semana-07`:

```text
docker compose up -d --wait
docker compose ps
npm run db:create
npm run db:migrate
npm run db:seed
npm run db:check
```

El contenedor ejecuta PostgreSQL; Node sigue ejecutándose en el equipo. Por eso
el host de Node es `127.0.0.1`, no `db`. El volumen conserva los datos.
`docker compose stop` lo detiene y `docker compose start` lo vuelve a levantar.
No usar `down -v`: eliminaría el volumen con los datos.

Las variables `POSTGRES_*` inicializan el volumen **solo la primera vez**.
Cambiar `.env` después no cambia la contraseña guardada en PostgreSQL. Mantener
la configuración con la que se creó el volumen o cambiarla mediante SQL.

## Problemas frecuentes

| Síntoma | Acción |
|---|---|
| `ECONNREFUSED` | Levantar servidor; revisar host y puerto |
| `28P01` | Revisar usuario y contraseña; no confundirla con la de pgAdmin |
| `3D000` | Ejecutar `db:create` |
| `42P01` o `42703` | Revisar DB seleccionada y ejecutar migraciones pendientes |
| Permiso denegado al crear DB | Usar el usuario local con permiso CREATEDB o crear `aula_web` desde pgAdmin |
| Puerto 5432 ocupado | Elegir otro puerto para el servidor y reflejarlo en `.env` |
| Solo funciona `/health` | Express funciona; comprobar `/health/db` y la terminal |
| `[CONFIG] Falta ...` | Completar la variable indicada en `.env` dentro de `semana-07` |
| `[API] Puerto ... ocupado` | Cerrar la otra API o cambiar `PORT`; actualizar `baseUrl` en Postman |
| `42501` | Revisar permisos del usuario; `db:create` y los tests necesitan crear bases |
| PowerShell bloquea `npm.ps1` | Usar `npm.cmd` en todos los comandos de esta guía |

Las instrucciones de instalación se apoyan en las páginas oficiales enlazadas.
Los nombres de algunos botones pueden variar según versión e idioma.
