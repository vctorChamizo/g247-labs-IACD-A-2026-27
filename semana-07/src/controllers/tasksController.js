const createTasksModel = require("../models/tasksModel");

// =============================================================================
// 1. AUXILIARES HTTP: VALIDAR ENTRADAS Y PREPARAR LA RESPUESTA
// No ejecutan SQL. Las reutilizan las funciones que atienden las rutas.
// =============================================================================

// 1.1. httpError: añade el estado HTTP al error que recibirá el middleware final.
function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

// 1.2. readId: recibe el texto de /tasks/:id y devuelve un entero válido.
// Un id mal formado produce 400; comprobar si existe es un paso posterior.
function readId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647) {
    throw httpError(400, "id must be a positive PostgreSQL integer");
  }
  return id;
}

// 1.3. readTask: se usa en POST y PUT, que exigen los tres campos editables.
// Devuelve un objeto validado y con el título sin espacios en los extremos.
function readTask(body) {
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    throw httpError(400, "title must be a non-empty string");
  }
  if (typeof body.done !== "boolean") throw httpError(400, "done must be a boolean");
  readId(body.userId);
  if (!Number.isInteger(body.userId)) throw httpError(400, "userId must be an integer");
  return { title: body.title.trim(), done: body.done, userId: body.userId };
}

// 1.4. toDto: recibe una fila y selecciona los campos públicos de la respuesta.
// El DTO no consulta la DB y evita exponer campos internos por accidente.
function toDto(row) {
  return {
    id: row.id,
    title: row.title,
    done: row.done,
    userId: row.userId,
    priority: row.priority,
  };
}

// 1.5. requireTask: transforma la ausencia de una fila en HTTP 404.
// El modelo devuelve undefined; esta capa decide qué significa para el cliente.
function requireTask(row) {
  if (!row) throw httpError(404, "Task not found");
  return row;
}

// =============================================================================
// 2. CONSTRUIR EL CONTROLADOR
// app.js proporciona el pool. Todas las funciones usan el mismo modelo.
// Cada await espera a PostgreSQL antes de construir la respuesta HTTP.
// Express 5 envía las promesas rechazadas al middleware de errores de app.js.
// =============================================================================
function createTasksController(db) {
  const model = createTasksModel(db);

  // ---------------------------------------------------------------------------
  // 2.1. LISTAR | GET /tasks -> model.findAll()
  // Sin parámetros. Devuelve 200 y un array de DTOs, incluso si está vacío.
  // ---------------------------------------------------------------------------
  async function list(req, res) {
    const tasks = await model.findAll();
    const response = tasks.map(toDto);
    res.json(response);
  }

  // ---------------------------------------------------------------------------
  // 2.2. CONSULTAR UNA | GET /tasks/:id -> model.findById(id)
  // Valida el id, busca la fila y devuelve 200 o 404 si no existe.
  // ---------------------------------------------------------------------------
  async function get(req, res) {
    const id = readId(req.params.id);
    const row = await model.findById(id);
    const task = requireTask(row);
    res.json(toDto(task));
  }

  // ---------------------------------------------------------------------------
  // 2.3. CREAR | POST /tasks -> model.create(values)
  // Recibe title/done/userId. Devuelve 201 y Location con la URL de la nueva tarea.
  // El id lo genera PostgreSQL, no el controlador.
  // ---------------------------------------------------------------------------
  async function create(req, res) {
    const values = readTask(req.body);
    const task = await model.create(values);
    res.location(`/tasks/${task.id}`).status(201).json(toDto(task));
  }

  // ---------------------------------------------------------------------------
  // 2.4. REEMPLAZAR | PUT /tasks/:id -> model.replace(id, values)
  // Exige los tres campos editables completos. Devuelve 200 o 404.
  // priority es de solo lectura en este ejemplo y conserva su valor en la DB.
  // ---------------------------------------------------------------------------
  async function replace(req, res) {
    const id = readId(req.params.id);
    const values = readTask(req.body);
    const row = await model.replace(id, values);
    const task = requireTask(row);
    res.json(toDto(task));
  }

  // ---------------------------------------------------------------------------
  // 2.5. MODIFICAR EL ESTADO | PATCH /tasks/:id -> model.setDone(id, done)
  // Acepta exclusivamente { done: boolean }. Devuelve 200 o 404.
  // La actualización parcial conserva title, userId y priority.
  // ---------------------------------------------------------------------------
  async function update(req, res) {
    if (!req.body || typeof req.body.done !== "boolean" || Object.keys(req.body).some((key) => key !== "done")) {
      throw httpError(400, "PATCH accepts only { done: boolean }");
    }

    const id = readId(req.params.id);
    const row = await model.setDone(id, req.body.done);
    const task = requireTask(row);
    res.json(toDto(task));
  }

  // ---------------------------------------------------------------------------
  // 2.6. ELIMINAR | DELETE /tasks/:id -> model.remove(id)
  // El modelo devuelve un booleano. true produce 204 sin cuerpo; false, un 404.
  // ---------------------------------------------------------------------------
  async function remove(req, res) {
    const id = readId(req.params.id);
    const removed = await model.remove(id);
    if (!removed) throw httpError(404, "Task not found");
    res.status(204).send();
  }

  // 3. INTERFAZ DEL CONTROLADOR: app.js asocia estas funciones con sus rutas.
  return { list, get, create, replace, update, remove };
}

module.exports = createTasksController;
