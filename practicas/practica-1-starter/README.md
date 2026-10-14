# Arranque de la Práctica 1

Este repositorio es un *scaffolding*: proporciona una estructura inicial y una primera conexión entre navegador y servidor. No es una solución de la Práctica 1 ni se puede entregar sin transformarlo sustancialmente.

El ejemplo usa el recurso `books` únicamente para hacer visible la estructura. Antes de comenzar, se sustituirán el nombre, los campos, las reglas y los textos por los del dominio elegido. No se admitirá la entrega de una copia de este ejemplo.

## Puesta en marcha

Se requiere Node.js 18 o superior.

```bash
npm install
npm start
```

La aplicación queda disponible en [http://localhost:3000](http://localhost:3000). La ruta `GET /health` permite comprobar que el servidor está activo.

## Cómo se unen el cliente y la API

La aplicación se levanta con **un único proceso de Node.js** y un único origen: `http://localhost:3000`. Express tiene dos responsabilidades distintas:

```text
Navegador solicita /                 → Express entrega public/index.html
index.html solicita /styles.css      → Express entrega public/styles.css
index.html solicita /app.js          → Express entrega public/app.js
public/app.js ejecuta fetch("/books") → Express dirige la petición a la API
```

La carpeta `public/` contiene los ficheros que debe descargar y ejecutar el navegador:

```text
public/
  index.html   → estructura y formularios de la interfaz
  styles.css   → presentación y diseño responsive
  app.js       → eventos, renderizado y llamadas fetch a la API
```

No contiene controladores, validadores ni datos: esos ficheros se ejecutan en Node.js y permanecen dentro de `src/`. `public/` tampoco se abre haciendo doble clic en `index.html`: se sirve mediante Express al ejecutar `npm start`.

La conexión se activa en `src/app.js` mediante este middleware:

```js
app.use(express.static(path.join(__dirname, "../public")));
```

Debe registrarse antes del `404` general. Si llega `GET /`, Express encuentra `public/index.html`; si llega `GET /styles.css`, entrega el CSS. Para una URL de API, por ejemplo `GET /books`, no hay un fichero llamado `books`, así que la petición continúa hasta el *router* de `/books`.

### Por qué `fetch("/books")` no escribe `localhost:3000`

La barra inicial indica una URL relativa al mismo origen que ha servido la página. Si la página se abrió en `http://localhost:3000`, estas dos expresiones apuntan al mismo recurso:

```js
fetch("/books");
fetch("http://localhost:3000/books");
```

La primera es preferible: el puerto no queda repetido en el cliente y no aparece un problema de CORS. En P1 no se levantan dos servidores; Express sirve a la vez la interfaz estática y la API.

### Recorrido completo de un clic

Cuando se implemente la creación desde el formulario, el recorrido será:

```text
Persona completa el formulario
        ↓
public/app.js escucha submit y construye el body JSON
        ↓  fetch("/books", { method: "POST", ... })
src/routes/books.js asocia POST / con createBook
        ↓
src/controllers/booksController.js solicita la validación
        ↓
src/validators/bookValidator.js acepta o informa errores
        ↓
src/data/store.js guarda el recurso en memoria
        ↓
La API responde JSON con 201 o 400
        ↓
public/app.js comprueba response.ok y actualiza la interfaz
```

El navegador no debe modificar el array de datos ni decidir si una petición es válida: puede ofrecer una validación inicial para mejorar la experiencia, pero el servidor vuelve a validar siempre.

En este *scaffolding*, la creación de un libro es el ejemplo vertical funcional: el manejador de `submit` usa `event.preventDefault()` para evitar el envío HTML convencional, construye el JSON, solicita `POST /books` y vuelve a ejecutar `loadBooks()` tras recibir `201`. Por ello el nuevo elemento aparece inmediatamente sin recargar la página ni cambiar la URL.

## Qué está preparado y qué falta

| Elemento | Estado en este repositorio |
|---|---|
| Servidor Express, JSON, ficheros estáticos y gestión base de errores | Preparado |
| Separación entre rutas, controlador, almacenamiento y validación | Preparada |
| `GET /books`, `POST /books` y cliente que crea y lista la colección | Preparado como ejemplo vertical mínimo |
| Operaciones restantes de CRUD, `PATCH`, búsqueda, filtros, ordenación, paginación y estadísticas | Pendiente |
| Validación real y respuestas `400` con todas las incidencias | Pendiente |
| Formularios, edición, eliminación y estados completos del cliente | Pendiente |
| Documentación final de la API y componente de IA | Pendiente |

## Primeros pasos recomendados

1. Elegir un único recurso de dominio y definir al menos cinco campos antes de programar. Deben incluir texto obligatorio, número, booleano y valor de conjunto cerrado. El `id` lo genera el servidor.
2. Renombrar de forma coherente `books`, `book` y los campos de ejemplo en rutas, controlador, validador, cliente y README.
3. Escribir en el README del proyecto la forma del recurso, las reglas de validación y la tabla de *endpoints*.
4. Implementar una operación cada vez y comprobarla con `curl` o con un cliente HTTP antes de conectarla a la interfaz.
5. Integrar el cliente progresivamente: listado, creación, mensajes de validación, edición, eliminación, búsqueda y filtros.

## Cómo crear esta estructura desde cero

1. Crear el proyecto con `npm init -y` e instalar Express con `npm install express`.
2. Crear `src/` para el código del servidor y `public/` para la interfaz de navegador.
3. En `src/app.js`, crear la aplicación, registrar `express.json()` y `express.static(...)`.
4. Crear `src/server.js` para ejecutar `app.listen(...)`. `app.js` solo configura y exporta la aplicación.
5. Servir una página inicial desde `public/index.html` y comprobar `http://localhost:3000` antes de escribir `fetch`.
6. Añadir una primera ruta de API, probarla directamente y, por último, llamarla desde `public/app.js` con una URL relativa.

## Recorrido de una petición

```text
Navegador → routes/books.js → controllers/booksController.js
          → validators/bookValidator.js → data/store.js
          → respuesta JSON → navegador
```

- **Ruta:** asocia método HTTP y URL con una función. No contiene lógica de negocio.
- **Controlador:** coordina la petición, decide el `status code` y no conoce cómo se guardan los datos.
- **Validador:** aplica las reglas del recurso y devuelve todas las incidencias detectadas.
- **Almacenamiento:** encapsula el array en memoria; podrá sustituirse sin cambiar las rutas.
- **Cliente:** construye la URL de consulta, usa `fetch` y comprueba `response.ok` antes de utilizar la respuesta.

## Orden de implementación sugerido

| Hito | Objetivo comprobable |
|---|---|
| 1. Contrato | Recurso, campos, reglas y tabla de rutas escritos en el README |
| 2. Lectura | `GET /<resource>` y `GET /<resource>/:id`, incluido el `404` |
| 3. Escritura | `POST`, `PUT`, `PATCH` y `DELETE`, con los códigos correctos |
| 4. Validación | `400` con todas las incidencias; `POST`/`PUT` completos y `PATCH` parcial |
| 5. Consulta y agregado | búsqueda, filtros, ordenación, paginación y `GET /<resource>/stats` |
| 6. Cliente | listado, creación, edición, eliminación, filtros y estados de interfaz |
| 7. Revisión | README completo, comprobaciones del *tester agent* y registro de revisión |

## Comprobaciones iniciales

Con el servidor en marcha, estas peticiones deben ser el primer punto de control:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/books
curl -i http://localhost:3000/books/999
```

La tercera petición debe acabar respondiendo `404` cuando se implemente la operación correspondiente. Los `TODO` indican deliberadamente las decisiones y el código que debe elaborar cada proyecto.

## Componente de IA

La carpeta `AI/` contiene las plantillas mínimas requeridas para documentar un único *tester agent*. El agente recibe el contrato público y la API ejecutándose, no los ficheros de implementación. Sus resultados se revisan antes de integrarlos.

