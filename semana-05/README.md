# Semana 5 — Primera API con Node.js y Express

Ejemplo progresivo del bloque II. Mantiene el recurso `tasks` iniciado en el bloque I y muestra cómo JavaScript pasa del navegador a un servidor.

La explicación detallada de cada fichero y de cada petición está en [docs/GUIA-PASO-A-PASO.md](docs/GUIA-PASO-A-PASO.md).

La carpeta [.claude/](.claude/) contiene un agente tester de ejemplo, con su *skill* y un comando, que escribe y ejecuta tests automáticos sobre esta API. Su uso se explica en [docs/AGENTE-TESTER.md](docs/AGENTE-TESTER.md).
Para realizar la demostración en clase, seguir [docs/GUIA-USO-CLAUDE.md](docs/GUIA-USO-CLAUDE.md).

La carpeta [postman/](postman/) contiene una colección y un entorno local importables para probar cada ruta sin escribir los comandos `curl` manualmente.

## Qué muestra

- Un proyecto Node con `package.json` y scripts de `npm`.
- Separación entre `src/app.js`, que configura Express, y `src/server.js`, que abre el puerto.
- Un *middleware* de *logging* que registra una línea por petición y llama a `next()`.
- Rutas `GET` que devuelven JSON.
- Un parámetro de ruta (`/echo/:message`) y un parámetro de consulta (`/tasks?done=true`).
- Una ruta `POST` que recibe un cuerpo JSON mediante `express.json()`.
- `PORT` como variable de entorno, con un `.env.template` sin secretos.

## Ejecución

```bash
npm install
cp .env.template .env
npm run dev
```

En Windows PowerShell, el segundo comando es `Copy-Item .env.template .env`.

El servidor queda disponible en `http://localhost:3000`.

## Pruebas manuales

Ejecutar las peticiones en una segunda terminal. Cada una debe generar una única línea `METHOD URL` en la terminal del servidor.

```bash
curl http://localhost:3000/health
curl http://localhost:3000/echo/hello
curl http://localhost:3000/tasks
curl "http://localhost:3000/tasks?done=false"
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Review the Express example","done":false,"userId":1}'
```

## Usar Postman

1. Abrir Postman y seleccionar **Import**.
2. Importar `postman/Aula-Web-Tasks-API.postman_collection.json`.
3. Importar `postman/Aula-Web-Local.postman_environment.json`.
4. Seleccionar el entorno **Aula Web - Local** en la esquina superior derecha.
5. Iniciar la API con `npm run dev` y ejecutar las peticiones de la colección en orden.

La variable `{{baseUrl}}` evita repetir `http://localhost:3000` en cada petición. Si se arranca la API con otro puerto, basta con cambiar una vez el valor de `baseUrl` en el entorno de Postman.

## Orden recomendado para la demostración

1. Ejecutar `node src/server.js` y observar que JavaScript se ejecuta fuera del navegador.
2. Abrir `package.json` y explicar las dependencias y los scripts.
3. Separar las responsabilidades de `app.js` y `server.js`.
4. Ejecutar `GET /health`, luego `GET /echo/hello` y observar `req.params`.
5. Ejecutar `GET /tasks?done=false` y distinguir `req.query` de `req.params`.
6. Enviar un `POST` y comprobar que `express.json()` ha construido `req.body`.
7. Comentar la línea del logger y ejecutar una petición para evidenciar que la cadena se bloquea si falta `next()`.

Este ejemplo no implementa una base de datos, controladores ni validación: esos pasos pertenecen a las semanas posteriores y al laboratorio L4.
