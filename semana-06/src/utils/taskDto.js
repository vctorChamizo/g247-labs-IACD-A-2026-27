// El DTO (Data Transfer Object) define el contrato público de la API. internalNote existe en memoria, pero no se expone al cliente.
function toTaskDto(task) {
  return {
    id: task.id,
    title: task.title,
    done: task.done,
    userId: task.userId,
  };
}

module.exports = toTaskDto;
