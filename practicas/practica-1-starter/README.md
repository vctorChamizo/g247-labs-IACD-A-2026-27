# Esqueleto de la Práctica 1

Este repositorio contiene únicamente la estructura técnica de una aplicación cliente-servidor. No proporciona un recurso de dominio, campos, datos iniciales, validación, consultas ni una solución de la práctica.

Su objetivo es mostrar cómo se conectan una página web y una API de Express. Cada proyecto debe decidir su propio recurso y desarrollar el resto a partir de esta estructura.

## Puesta en marcha

Se requiere Node.js 18 o superior.

```bash
npm install
npm start
```

Abrir [http://localhost:3000](http://localhost:3000). El botón de la página realiza `GET /health`: si responde correctamente, el navegador está conectado al servidor Express.

## Qué se incluye y qué no

| Incluido | No incluido |
|---|---|
| Servidor Express, lectura de JSON, registro de peticiones y manejo base de errores | Recurso de dominio y sus campos |
| Carpeta `public/` servida desde Express | Datos iniciales y almacenamiento implementado |
| Estructura de rutas, controlador, validación y almacenamiento | CRUD, `PATCH`, filtros, búsqueda, agregado o paginación |
| Ejemplo neutro de `fetch("/health")` | Formularios, edición, eliminación o una interfaz de la práctica |
| Plantillas de documentación del *tester agent* | Prompt, comprobaciones o resultados del agente |

Los manejadores de `src/controllers/resourceController.js` responden temporalmente `501`. Esa respuesta no es una solución: solo confirma que la ruta está conectada mientras se implementa.

## Estructura de carpetas

```text
practice1-<topic>/
  package.json                 # dependencias y comandos npm
  README.md                    # contrato de la API e instrucciones del proyecto
  src/                         # código que se ejecuta en Node.js
    app.js                     # configuración de Express y unión de sus piezas
    server.js                  # arranque del servidor en un puerto
    middleware/logger.js       # comportamiento común a todas las peticiones
    routes/resources.js        # método + URL → función del controlador
    controllers/resourceController.js
                               # coordina HTTP, validación y almacenamiento
    validators/resourceValidator.js
                               # reglas de los campos del recurso
    data/store.js              # único módulo que conoce el array en memoria
  public/                      # ficheros que descarga y ejecuta el navegador
    index.html
    styles.css
    app.js
  AI/                          # documentación del tester agent
```

`src/` y `public/` tienen responsabilidades distintas. El navegador nunca debe acceder al array de `data/store.js`; solicita cambios y lecturas a la API mediante HTTP.

## Cómo se conectan interfaz y servidor

Al ejecutar `npm start`, `src/server.js` inicia Express. En `src/app.js` se registra:

```js
app.use(express.static(path.join(__dirname, "../public")));
```

Ese middleware permite que un único servidor responda tanto a la interfaz como a la API:

```text
GET /             → public/index.html
GET /styles.css   → public/styles.css
GET /app.js       → public/app.js
GET /health       → ruta técnica que confirma la conexión
GET /resources    → router de la API, pendiente de implementar
```

Como la página y la API comparten `http://localhost:3000`, el cliente utiliza URLs relativas. Por ejemplo, `fetch("/health")` significa «solicitar `/health` al mismo servidor que entregó esta página». No se levanta un segundo servidor ni se configura CORS para P1.

## Pasos de trabajo

1. Elegir un único recurso de dominio y documentar sus campos en el `README.md` del proyecto.
2. Renombrar de forma coherente `resources`, `resourceController` y `resourceValidator`.
3. Definir las reglas de validación: obligatoriedad, tipo, rango y valores cerrados.
4. Implementar primero el almacenamiento en memoria y después cada operación de la API.
5. Probar cada *endpoint* directamente con `curl`, Postman o un cliente HTTP antes de conectarlo a la interfaz.
6. Añadir en `public/app.js` las llamadas `fetch`, comprobando siempre `response.ok`.
7. Implementar los estados de carga, error y lista vacía, sin recargar la página.
8. Documentar el contrato final y utilizarlo como entrada del *tester agent*.

## Orden de una petición

```text
public/app.js
    ↓ fetch("/<resource>")
routes/<resource>.js
    ↓
controllers/<resource>Controller.js
    ↓ validación y almacenamiento
validators/<resource>Validator.js + data/store.js
    ↓
respuesta JSON
    ↓
public/app.js actualiza la interfaz
```

Las rutas no contienen lógica de negocio; el controlador no modifica directamente el array; el validador no responde HTTP; y el cliente no decide si los datos son válidos. Esta separación permite localizar responsabilidades y sustituir después el almacenamiento sin reescribir la API.

## Comprobación inicial

Antes de implementar el recurso, deben funcionar estas dos comprobaciones:

```bash
curl http://localhost:3000/health
curl -i http://localhost:3000/resources
```

La primera responde `200`; la segunda responde `501` hasta que se implemente la colección. Es el punto de partida deliberado del esqueleto.
