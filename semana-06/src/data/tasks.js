// Este array sustituye temporalmente a una base de datos. La semana siguiente cambiará la capa de datos,
// pero las rutas y los controladores conservarán la misma responsabilidad.
const tasks = [
  {
    id: 1,
    title: "Extract task controllers",
    done: true,
    userId: 1,
    internalNote: "Created before the REST refactor",
  },
  {
    id: 2,
    title: "Return meaningful status codes",
    done: false,
    userId: 1,
    internalNote: "Discuss 201 and 204 in class",
  },
  {
    id: 3,
    title: "Add a central error handler",
    done: false,
    userId: 2,
    internalNote: "The client must never receive this field",
  },
];

let nextTaskId = 4;

function findTaskById(id) {
  return tasks.find((task) => task.id === id);
}

function createTask(values) {
  const task = { id: nextTaskId, ...values, internalNote: "Created through the API" };
  nextTaskId += 1;
  tasks.push(task);
  return task;
}

function removeTask(task) {
  const index = tasks.indexOf(task);
  tasks.splice(index, 1);
}

module.exports = { tasks, findTaskById, createTask, removeTask };
