const { tasks, findTaskById, createTask, removeTask } = require("../data/tasks");
const createHttpError = require("../utils/httpError");
const toTaskDto = require("../utils/taskDto");

// -----------------------------------------------------------------------------
// 1. FUNCIONES AUXILIARES
// Estas funciones no responden directamente a una URL. Las reutilizan los
// controladores para que las reglas de validación no se repitan en cada ruta.
// -----------------------------------------------------------------------------

// Se usa cuando la URL contiene /tasks/:id. Convierte el texto de req.params
// en un número válido antes de buscar una tarea.
function parseTaskId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError(400, "Task id must be a positive integer");
  }

  return id;
}

// Se usa en GET, PUT, PATCH y DELETE /tasks/:id. Centraliza los dos posibles
// fallos: un id inválido (400) o una tarea que no existe (404).
function findExistingTask(idValue) {
  const task = findTaskById(parseTaskId(idValue));

  if (!task) {
    throw createHttpError(404, "Task not found");
  }

  return task;
}

// Se usa en POST y PUT. Ambas operaciones necesitan una representación completa
// de la tarea, por eso title, done y userId son obligatorios.
function readRequiredTaskValues(body) {
  const { title, done, userId } = body;

  if (typeof title !== "string" || title.trim() === "") {
    throw createHttpError(400, "title is required and must be a non-empty string");
  }

  if (typeof done !== "boolean") {
    throw createHttpError(400, "done is required and must be a boolean");
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createHttpError(400, "userId is required and must be a positive integer");
  }

  return { title: title.trim(), done, userId };
}

// Se usa solo en PATCH. A diferencia de PUT, acepta modificar una parte de la
// tarea y conserva los campos que no se incluyen en req.body.
function readPartialTaskValues(body) {
  const changes = {};

  if (Object.hasOwn(body, "title")) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      throw createHttpError(400, "title must be a non-empty string");
    }
    changes.title = body.title.trim();
  }

  if (Object.hasOwn(body, "done")) {
    if (typeof body.done !== "boolean") {
      throw createHttpError(400, "done must be a boolean");
    }
    changes.done = body.done;
  }

  if (Object.hasOwn(body, "userId")) {
    if (!Number.isInteger(body.userId) || body.userId <= 0) {
      throw createHttpError(400, "userId must be a positive integer");
    }
    changes.userId = body.userId;
  }

  if (Object.keys(changes).length === 0) {
    throw createHttpError(400, "Send at least one editable task property");
  }

  return changes;
}

// -----------------------------------------------------------------------------
// 2. CONTROLADORES CRUD
// Cada función se exporta al final del fichero y se asigna a una ruta concreta
// en src/routes/tasksRoutes.js. Aquí se decide qué hacer; la ruta solo decide
// cuándo se ejecuta cada función.
// -----------------------------------------------------------------------------

// GET /tasks
// Se ejecuta al solicitar la colección completa. Convierte cada tarea a DTO para
// no exponer internalNote, un dato que pertenece al almacenamiento interno.
function listTasks(req, res) {
  res.json(tasks.map(toTaskDto));
}

// GET /tasks/:id
// Se ejecuta al solicitar un recurso individual. findExistingTask valida el id y
// genera un error 404 si no encuentra la tarea; next(error) lo envía al handler final.
function getTask(req, res, next) {
  try {
    res.json(toTaskDto(findExistingTask(req.params.id)));
  } catch (error) {
    next(error);
  }
}

// POST /tasks
// Se ejecuta al crear un recurso. Valida un cuerpo completo, guarda la tarea en
// memoria y responde 201 junto con Location, la URL del recurso recién creado.
function createTaskHandler(req, res, next) {
  try {
    const task = createTask(readRequiredTaskValues(req.body));

    // Location indica dónde puede recuperarse el recurso que se acaba de crear.
    res.location(`/tasks/${task.id}`).status(201).json(toTaskDto(task));
  } catch (error) {
    next(error);
  }
}

// PUT /tasks/:id
// Se ejecuta al reemplazar una tarea completa. Por eso reutiliza la validación de
// valores obligatorios: omitir un campo no significa conservar su valor anterior.
function replaceTask(req, res, next) {
  try {
    const task = findExistingTask(req.params.id);
    Object.assign(task, readRequiredTaskValues(req.body));
    res.json(toTaskDto(task));
  } catch (error) {
    next(error);
  }
}

// PATCH /tasks/:id
// Se ejecuta al actualizar solo una parte de una tarea. readPartialTaskValues
// selecciona y valida únicamente los campos que llegaron en el cuerpo de la petición.
function updateTask(req, res, next) {
  try {
    const task = findExistingTask(req.params.id);
    Object.assign(task, readPartialTaskValues(req.body));
    res.json(toTaskDto(task));
  } catch (error) {
    next(error);
  }
}

// DELETE /tasks/:id
// Se ejecuta al eliminar un recurso. Tras eliminarlo, 204 comunica éxito sin
// incluir cuerpo de respuesta, porque ya no hay recurso que devolver.
function deleteTask(req, res, next) {
  try {
    const task = findExistingTask(req.params.id);
    removeTask(task);
    // 204 comunica éxito sin enviar un cuerpo JSON.
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { listTasks, getTask, createTaskHandler, replaceTask, updateTask, deleteTask };
