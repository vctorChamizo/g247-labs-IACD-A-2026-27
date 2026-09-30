# Guía paso a paso — Primera API con Node.js y Express

Este ejemplo convierte el JavaScript trabajado en el navegador en un programa que escucha peticiones HTTP. No hay base de datos: las tareas viven temporalmente en un array para concentrar la explicación en Node.js, Express, rutas y *middleware*.

## 1. Comenzar el proyecto desde la terminal

Se parte de una terminal situada en la carpeta donde se quiere crear el proyecto. Los comandos siguientes crean una carpeta nueva, inicializan Node e instalan Express.

```bash
mkdir tasks-api
cd tasks-api
node --version
npm --version
npm init -y
npm install express dotenv
```

1. `mkdir tasks-api` crea la carpeta del proyecto.
2. `cd tasks-api` sitúa la terminal dentro de esa carpeta.
3. `node --version` y `npm --version` verifican que Node.js y npm están disponibles. Este ejemplo requiere Node 18 o superior.
4. `npm init -y` crea un `package.json` con valores iniciales. La opción `-y` acepta las respuestas por defecto.
5. `npm install express dotenv` descarga Express y dotenv, los añade a `dependencies` y genera `package-lock.json`.

Después se crea la estructura mínima del proyecto:

```bash
mkdir -p src/middleware
touch src/app.js src/server.js src/middleware/requestLogger.js .gitignore .env.template
```

En Windows PowerShell se puede crear la estructura de forma equivalente con:

```powershell
mkdir src, src/middleware
ni src/app.js, src/server.js, src/middleware/requestLogger.js, .gitignore, .env.template -ItemType File
```

Se añade `node_modules/` y `.env` a `.gitignore`:

```gitignore
node_modules/
.env
```

`node_modules/` no se sube al repositorio porque cada persona lo puede reconstruir con `npm install`. `.env` no se sube porque puede contener secretos. Sí se conservan `package.json`, `package-lock.json` y `.env.template`.

Para usar el fichero de variables, se instala `dotenv` junto a Express:

```bash
npm install express dotenv
```

Antes de iniciar el proyecto, cada persona crea su copia local del template:

```bash
cp .env.template .env
```

En Windows PowerShell: `Copy-Item .env.template .env`.

El fichero `.env` de este ejemplo contiene `PORT=3000`. Puede cambiarse a otro puerto sin modificar código; por ejemplo, `PORT=3001`.

Por último, se incorporan estos *scripts* a `package.json`:

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "node --watch src/server.js"
}
```

Con los tres ficheros de `src/` guardados, el servidor se inicia con:

```bash
npm run dev
```

La terminal debe mostrar `Tasks API listening on http://localhost:3000`. Mientras ese proceso siga abierto, otra terminal puede ejecutar `curl` o Postman para enviar peticiones.

## 2. `package.json`: qué necesita el proyecto

El fichero `package.json` identifica el proyecto y declara que necesita Express. Tras ejecutar `npm install`, npm descarga esa dependencia en `node_modules/` y registra las versiones exactas en `package-lock.json`.

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "node --watch src/server.js"
}
```

- `npm start` ejecuta el servidor una vez.
- `npm run dev` lo ejecuta en modo *watch*: Node reinicia el proceso al guardar un cambio.

## 3. `src/server.js`: abrir el puerto

```javascript
require("dotenv").config();
const app = require("./app");
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Tasks API listening on http://localhost:${PORT}`);
});
```

1. `require("dotenv").config()` lee `.env` y copia sus valores en `process.env`.
2. `require("./app")` carga la aplicación configurada en `app.js`.
3. `process.env.PORT` lee la variable de entorno `PORT`, si existe.
4. `Number(...)` convierte ese valor a número porque las variables de entorno siempre son texto.
5. `|| 3000` usa el puerto 3000 cuando `PORT` no está definida.
6. `app.listen(...)` abre el puerto y deja al proceso esperando peticiones.

Este fichero no contiene rutas. Su única tarea es arrancar el servidor.

## 4. `src/app.js`: construir la aplicación

```javascript
const express = require("express");
const requestLogger = require("./middleware/requestLogger");
const app = express();
```

1. Se importa Express, una librería que organiza servidores HTTP con rutas y *middleware*.
2. Se importa el *middleware* propio de registro.
3. `express()` crea el objeto `app`, sobre el que se registran rutas y *middleware*.

El array `tasks` es temporal. Cada objeto representa una tarea y conserva el mismo dominio utilizado en los ejemplos anteriores:

```javascript
{ id: 1, title: "Create the Express app", done: true, userId: 1 }
```

- `id` identifica la tarea.
- `title` contiene su descripción.
- `done` es un boolean que indica si está completada.
- `userId` identifica al usuario propietario.

## 5. Middleware: pasos previos a cada ruta

```javascript
app.use(express.json());
app.use(requestLogger);
```

Cada petición pasa por estas dos líneas antes de llegar a una ruta:

1. `express.json()` lee un cuerpo JSON y lo deja disponible como `req.body`.
2. `requestLogger` escribe en la terminal el método y la URL, por ejemplo `GET /tasks`.

El orden importa. Si `express.json()` se registrara después de `POST /tasks`, esa ruta no podría leer correctamente `req.body`.

## 6. `requestLogger`: continuar la cadena

```javascript
function requestLogger(req, res, next) {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
}
```

- `req.method` es el método HTTP, como `GET` o `POST`.
- `req.originalUrl` es la URL solicitada, como `/tasks?done=false`.
- `next()` entrega el control al siguiente paso. Si se elimina, la petición queda detenida antes de llegar a la ruta.

## 7. Primera ruta: `GET /health`

```javascript
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
```

`app.get` registra una ruta para peticiones `GET`. Cuando se visita `/health`, `res.json(...)` convierte el objeto de JavaScript en JSON y termina la respuesta.

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

## 8. Parámetro de ruta: `GET /echo/:message`

```javascript
app.get("/echo/:message", (req, res) => {
  res.json({ echo: req.params.message });
});
```

`:message` es un hueco de la propia URL. En la petición `/echo/hello`, Express guarda `"hello"` en `req.params.message`.

```bash
curl http://localhost:3000/echo/hello
# {"echo":"hello"}
```

Un parámetro de ruta identifica una parte de la ruta solicitada. Más adelante, `/tasks/:id` utilizará esta misma idea para identificar una tarea concreta.

## 9. Parámetro de consulta: `GET /tasks?done=false`

```javascript
if (req.query.done === "false") {
  res.json(tasks.filter((task) => !task.done));
  return;
}
```

`done=false` aparece después del signo `?`, por lo que Express lo expone como `req.query.done`. El valor llega como string, no como boolean; por eso la comparación correcta es `=== "false"`.

`filter` construye un array nuevo con las tareas que no están terminadas. El `return` evita que la función continúe y trate de enviar una segunda respuesta.

```bash
curl "http://localhost:3000/tasks?done=false"
```

## 10. Recibir JSON: `POST /tasks`

```javascript
app.post("/tasks", (req, res) => {
  res.status(201).json({ received: req.body });
});
```

1. `app.post` responde únicamente a peticiones `POST` sobre `/tasks`.
2. `req.body` contiene el JSON que `express.json()` ha interpretado.
3. `res.status(201)` fija el código HTTP de creación.
4. `.json(...)` devuelve el objeto como JSON.

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Review the Express example","done":false,"userId":1}'
```

La ruta devuelve el cuerpo recibido, pero todavía no cambia el array `tasks`. Crear y persistir datos es el siguiente paso del bloque.

## Recorrido completo de una petición

Para `GET /tasks?done=false`, el orden es:

1. `server.js` mantiene el puerto abierto.
2. Express recibe la petición y ejecuta `express.json()`.
3. Se ejecuta `requestLogger`, que imprime `GET /tasks?done=false`.
4. Express encuentra la ruta `GET /tasks`.
5. La condición revisa `req.query.done`.
6. `filter` prepara el resultado con las tareas pendientes.
7. `res.json(...)` responde al cliente y la petición termina.
