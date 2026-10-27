const httpError = require("../utils/httpError");
const toDTO = require("../utils/taskDto");
const pagination = require("../utils/pagination");

// 1. AUXILIAR: la URL llega como texto; no enviar NaN ni ids fuera de rango a SQL.
function readId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647) throw httpError(400, "Invalid task id");
  return id;
}

function createTasksController({ tasksModel }) {
  // 2. AUXILIAR DE AUTORIZACIÓN: auth ya verificó la identidad.
  // Aquí el recurso permite decidir 404 (no existe) o 403 (es de otro usuario).
  // Un role admin NO permite saltarse esta regla en el ejemplo.
  async function requireOwnedTask(id, userId) {
    const task = await tasksModel.findById(id);
    if (!task) throw httpError(404, "Task not found");
    if (Number(task.user_id) !== Number(userId)) throw httpError(403, "Forbidden");
    return task;
  }

  // -------------------------------------------------------------------------
  // 3. LISTAR | GET /tasks?page=&limit= -> findByOwner -> DTOs (200).
  // No filtrar en JS después de paginar: el modelo recibe el propietario.
  // -------------------------------------------------------------------------
  async function list(req, res) {
    const { page, limit, offset } = pagination(req.query);
    const rows = await tasksModel.findByOwner(req.user.sub, { limit, offset });
    res.json({ page, limit, items: rows.map(toDTO) });
  }

  // 4. CONSULTAR | GET /tasks/:id -> autorización -> un DTO (200).
  async function getOne(req, res) {
    const id = readId(req.params.id);
    const task = await requireOwnedTask(id, req.user.sub);
    res.json(toDTO(task));
  }

  // 5. CREAR | POST /tasks -> identidad del TOKEN, nunca req.body.userId (201).
  async function create(req, res) {
    const { title, done } = req.body;
    const task = await tasksModel.create({ title, done, userId: req.user.sub });
    res.location(`/tasks/${task.id}`).status(201).json(toDTO(task));
  }

  // 6. REEMPLAZAR | PUT /tasks/:id -> propiedad + cuerpo completo -> DTO (200).
  async function replace(req, res) {
    const id = readId(req.params.id);
    await requireOwnedTask(id, req.user.sub);
    const task = await tasksModel.update(id, req.user.sub, req.body);
    if (!task) throw httpError(404, "Task not found");
    res.json(toDTO(task));
  }

  // 7. MODIFICAR ESTADO | PATCH /tasks/:id -> propiedad + done -> DTO (200).
  async function update(req, res) {
    const id = readId(req.params.id);
    await requireOwnedTask(id, req.user.sub);
    const task = await tasksModel.setDone(id, req.user.sub, req.body.done);
    if (!task) throw httpError(404, "Task not found");
    res.json(toDTO(task));
  }

  // 8. ELIMINAR | DELETE /tasks/:id -> propiedad + DELETE -> 204 sin cuerpo.
  async function remove(req, res) {
    const id = readId(req.params.id);
    await requireOwnedTask(id, req.user.sub);
    if (!(await tasksModel.remove(id, req.user.sub))) throw httpError(404, "Task not found");
    res.status(204).send();
  }
  return { list, getOne, create, replace, update, remove };
}
module.exports = createTasksController;
