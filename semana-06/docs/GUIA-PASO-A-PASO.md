# Guía paso a paso - API REST con controladores

## 1. Partir del ejemplo anterior

La semana 5 agrupaba las rutas y su comportamiento en `src/app.js`. Era suficiente para una primera API, pero deja de ser manejable cuando aparecen validaciones, recursos individuales y errores distintos.

Esta versión mantiene el mismo recurso `tasks`, pero distribuye las responsabilidades:

```text
src/
├── app.js                     # Configura el recorrido de cada petición.
├── server.js                  # Abre el puerto.
├── routes/tasksRoutes.js      # Método HTTP y URL.
├── controllers/tasksController.js # Reglas de cada operación.
├── data/tasks.js              # Almacenamiento temporal.
├── middleware/                # Logger, 404 y manejo de errores.
└── utils/                     # Errores HTTP y DTO.
```

## 2. Rutas finas y controladores

`routes/tasksRoutes.js` no contiene lógica de negocio. Solo decide qué controlador se ejecuta:

```javascript
router.get("/:id", tasksController.getTask);
router.patch("/:id", tasksController.updateTask);
```

El controlador recibe `req`, `res` y `next`. En `getTask`, el identificador se valida, se busca la tarea y se devuelve el DTO:

```javascript
function getTask(req, res, next) {
  try {
    res.json(toTaskDto(findExistingTask(req.params.id)));
  } catch (error) {
    next(error);
  }
}
```

`next(error)` no responde por sí mismo. Interrumpe el recorrido normal y entrega el error al middleware de errores que se registra al final de `app.js`.

### Localizar cada controlador

El recorrido puede seguirse desde la URL hasta la función que responde:

| Ruta | Controlador | Funciones auxiliares | Resultado esperado |
| --- | --- | --- | --- |
| `GET /tasks` | `listTasks` | `toTaskDto` | Colección con `200`. |
| `GET /tasks/:id` | `getTask` | `findExistingTask`, `parseTaskId` | Tarea con `200`, o error `400`/`404`. |
| `POST /tasks` | `createTaskHandler` | `readRequiredTaskValues`, `createTask` | Tarea nueva con `201` y `Location`. |
| `PUT /tasks/:id` | `replaceTask` | `findExistingTask`, `readRequiredTaskValues` | Reemplazo completo con `200`. |
| `PATCH /tasks/:id` | `updateTask` | `findExistingTask`, `readPartialTaskValues` | Actualización parcial con `200`. |
| `DELETE /tasks/:id` | `deleteTask` | `findExistingTask`, `removeTask` | Sin cuerpo con `204`. |

El fichero `tasksController.js` está organizado en dos bloques localizables: primero las funciones auxiliares de validación y búsqueda; después los seis controladores CRUD. Cada controlador lleva un comentario con la ruta que lo invoca, cuándo se utiliza y el motivo de su status code.

## 3. Manejo centralizado de errores

Un error HTTP se crea con un `status` y un mensaje:

```javascript
throw createHttpError(404, "Task not found");
```

El middleware `errorHandler` tiene cuatro argumentos. Esa firma permite a Express distinguirlo de un middleware convencional:

```javascript
function errorHandler(error, req, res, next) {
  const status = Number.isInteger(error.status) ? error.status : 500;
  res.status(status).json({ error: error.message });
}
```

El handler debe registrarse después de las rutas. Antes de él se registra `notFound`, que convierte cualquier URL no encontrada en un error `404` con el mismo formato JSON.

## 4. CRUD REST sobre `/tasks`

| Operación | Método y ruta | Requisitos |
| --- | --- | --- |
| Listar | `GET /tasks` | Devuelve todas las tareas. |
| Consultar | `GET /tasks/:id` | Devuelve `404` si no existe. |
| Crear | `POST /tasks` | Requiere `title`, `done` y `userId`; responde `201`. |
| Reemplazar | `PUT /tasks/:id` | Requiere todos los campos editables. |
| Actualizar | `PATCH /tasks/:id` | Acepta uno o varios campos editables. |
| Eliminar | `DELETE /tasks/:id` | Responde `204` sin cuerpo. |

La diferencia entre `PUT` y `PATCH` se ve en la validación:

- `PUT` llama a `readRequiredTaskValues`: todos los campos son obligatorios.
- `PATCH` llama a `readPartialTaskValues`: solo valida los campos que se envían.

## 5. Status codes y cabecera Location

Una creación correcta devuelve `201 Created` y señala dónde está el recurso nuevo:

```javascript
res.location(`/tasks/${task.id}`).status(201).json(toTaskDto(task));
```

Un borrado correcto devuelve `204 No Content`:

```javascript
res.status(204).send();
```

No se debe responder `200` con un objeto de error. Un `400` representa una petición no válida, un `404` un recurso inexistente y un `500` un fallo no controlado del servidor.

## 6. DTO: el contrato público de la API

Las tareas en memoria contienen `internalNote`, pero ese dato no forma parte del contrato público. `toTaskDto` selecciona solo los campos que se permiten devolver:

```javascript
function toTaskDto(task) {
  return { id: task.id, title: task.title, done: task.done, userId: task.userId };
}
```

Cuando el almacenamiento se sustituya por una base de datos, puede contener columnas como `password_hash` o `created_at`. El DTO evita exponerlas de manera accidental.

## 7. Probar cambios de estado

El array se reinicia al detener y volver a iniciar el servidor. Para observar los cambios, ejecutar la colección de Postman en este orden:

1. Consultar las tareas iniciales.
2. Crear una tarea mediante `POST`.
3. Reemplazar la tarea `2` con `PUT`.
4. Marcar la tarea `3` como completada con `PATCH`.
5. Eliminar la tarea `1` con `DELETE`.
6. Consultar de nuevo la colección.

Cada petición muestra además una línea en la terminal por medio de `requestLogger`.
