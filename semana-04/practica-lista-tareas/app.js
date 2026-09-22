// 1. Se seleccionan los nodos que ya existen en el HTML.
const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");

// 2. Esta función crea un elemento de lista completo a partir de un texto.
function createTask(taskTitle) {
  const task = document.createElement("li");
  const title = document.createElement("span");
  const deleteButton = document.createElement("button");

  task.classList.add("task");
  title.classList.add("task__title");
  title.textContent = taskTitle;

  deleteButton.classList.add("task__delete");
  deleteButton.type = "button";
  deleteButton.textContent = "Eliminar";

  // Al pulsar el texto de una tarea, se alterna la clase que CSS representa como completada.
  title.addEventListener("click", () => {
    task.classList.toggle("done");
  });

  // El botón elimina exactamente el elemento que se acaba de crear.
  deleteButton.addEventListener("click", () => {
    task.remove();
  });

  task.append(title, deleteButton);
  return task;
}

// 3. El evento submit se activa tanto con el botón como al pulsar Intro dentro del input.
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const taskTitle = taskInput.value.trim();

  // El control de flujo evita crear un elemento vacío.
  if (taskTitle === "") {
    taskInput.focus();
    return;
  }

  taskList.append(createTask(taskTitle));
  taskInput.value = "";
  taskInput.focus();
});

/*
  ====================================================================
  EXTRA 1 — CONTADOR DE TAREAS
  Descomentar el bloque completo para mostrar el total y las completadas.
  El listener del formulario se registra después del básico, por lo que
  actualiza el contador cuando la nueva tarea ya existe en el DOM.
  ====================================================================
*/
// const taskCounter = document.createElement("p");
// taskCounter.id = "task-counter";
// taskCounter.setAttribute("aria-live", "polite");
// taskList.insertAdjacentElement("afterend", taskCounter);

// function updateTaskCounter() {
//   // querySelectorAll devuelve los nodos que cumplen el selector CSS.
//   const totalTasks = taskList.querySelectorAll(".task").length;
//   const completedTasks = taskList.querySelectorAll(".task.done").length;

//   taskCounter.textContent = `${totalTasks} tareas · ${completedTasks} completadas.`;
// }

// taskForm.addEventListener("submit", updateTaskCounter);
// taskList.addEventListener("click", updateTaskCounter);
// updateTaskCounter();

/*
  ====================================================================
  EXTRA 2 — ELIMINAR COMPLETADAS
  Requiere que EXTRA 1 esté activo, porque actualiza su contador.
  Descomentar el bloque completo para añadir el botón.
  ====================================================================
*/
// const clearCompletedButton = document.createElement("button");
// clearCompletedButton.type = "button";
// clearCompletedButton.textContent = "Eliminar completadas";
// taskList.insertAdjacentElement("afterend", clearCompletedButton);

// clearCompletedButton.addEventListener("click", () => {
//   // forEach ejecuta la eliminación sobre cada tarea que tenga la clase done.
//   const completedTasks = taskList.querySelectorAll(".task.done");

//   completedTasks.forEach((task) => {
//     task.remove();
//   });

//   updateTaskCounter();
// });

/*
  ====================================================================
  EXTRA 3 — MENSAJE DE LISTA VACÍA
  No depende de otros extras. Se puede activar de forma independiente.
  ====================================================================
*/
// const emptyMessage = document.createElement("p");
// emptyMessage.textContent = "No hay tareas pendientes.";
// emptyMessage.hidden = true;
// taskList.insertAdjacentElement("afterend", emptyMessage);

// function updateEmptyMessage() {
//   // children.length cuenta los elementos <li> presentes en este momento.
//   const isEmpty = taskList.children.length === 0;
//   emptyMessage.hidden = !isEmpty;
// }

// taskForm.addEventListener("submit", updateEmptyMessage);
// taskList.addEventListener("click", updateEmptyMessage);
// updateEmptyMessage();

/*
  ====================================================================
  EXTRA 4 — PRIORIDAD VISUAL
  Añade el selector y los estilos desde JavaScript. El listener con
  capture guarda la prioridad antes de que el formulario básico vacíe
  el input; el segundo listener aplica la clase a la tarea recién creada.
  ====================================================================
*/
// const priorityGroup = document.createElement("p");
// const priorityLabel = document.createElement("label");
// const priorityInput = document.createElement("select");
// const priorityStyles = document.createElement("style");
// let priorityForNewTask = null;

// priorityLabel.htmlFor = "priority-input";
// priorityLabel.textContent = "Prioridad ";
// priorityInput.id = "priority-input";
// priorityInput.innerHTML = `
//     <option value="low">Baja</option>
//     <option value="medium" selected>Media</option>
//     <option value="high">Alta</option>
//   `;
// priorityGroup.append(priorityLabel, priorityInput);
// taskForm.insertBefore(priorityGroup, taskForm.querySelector(".input-row"));

// priorityStyles.textContent = `
//     .task--high { border-left: 4px solid #b91c1c; }
//     .task--medium { border-left: 4px solid #d97706; }
//     .task--low { border-left: 4px solid #15803d; }
//   `;
// document.head.append(priorityStyles);

// taskForm.addEventListener(
//   "submit",
//   () => {
//     // No se asigna prioridad cuando el formulario no va a crear una tarea.
//     priorityForNewTask = taskInput.value.trim() === "" ? null : priorityInput.value;
//   },
//   { capture: true },
// );

// taskForm.addEventListener("submit", () => {
//   if (priorityForNewTask === null) {
//     return;
//   }

//   // El último hijo se ha añadido justo antes, en el manejador básico.
//   taskList.lastElementChild.classList.add(`task--${priorityForNewTask}`);
//   priorityForNewTask = null;
// });

/*
  ====================================================================
  EXTRA 5 — FILTROS
  Añade botones para mostrar todas, pendientes o completadas. No altera
  los nodos: solo alterna una clase CSS que los oculta visualmente.
  ====================================================================
*/
// const filterContainer = document.createElement("div");
// const filterStyles = document.createElement("style");
// let currentFilter = "all";

// filterContainer.setAttribute("aria-label", "Filtrar tareas");
// filterContainer.innerHTML = `
//     <button type="button" data-filter="all">Todas</button>
//     <button type="button" data-filter="pending">Pendientes</button>
//     <button type="button" data-filter="completed">Completadas</button>
//   `;
// taskForm.insertAdjacentElement("afterend", filterContainer);

// filterStyles.textContent = ".is-hidden { display: none; }";
// document.head.append(filterStyles);

// function applyFilter(filter) {
//   const taskItems = taskList.querySelectorAll(".task");

//   taskItems.forEach((task) => {
//     const isCompleted = task.classList.contains("done");
//     const shouldHide =
//       (filter === "pending" && isCompleted) || (filter === "completed" && !isCompleted);

//     task.classList.toggle("is-hidden", shouldHide);
//   });
// }

// filterContainer.querySelectorAll("button").forEach((button) => {
//   button.addEventListener("click", () => {
//     currentFilter = button.dataset.filter;
//     applyFilter(currentFilter);
//   });
// });

// // Al crear o completar una tarea, se vuelve a aplicar el filtro activo.
// taskForm.addEventListener("submit", () => applyFilter(currentFilter));
// taskList.addEventListener("click", () => applyFilter(currentFilter));

/*
  ====================================================================
  EXTRA 6 — EDICIÓN DEL TEXTO
  Usa delegación de eventos: un único listener de la lista atiende a los
  botones Editar, también a los que se añadan más tarde.
  ====================================================================
*/
// function addEditButton(task) {
//   const editButton = document.createElement("button");
//   editButton.type = "button";
//   editButton.classList.add("task__edit");
//   editButton.textContent = "Editar";
//   task.append(editButton);
// }

// // Se añade un botón a las tareas que ya estaban en la lista.
// taskList.querySelectorAll(".task").forEach((task) => {
//   addEditButton(task);
// });

// let createsNewTask = false;

// taskForm.addEventListener(
//   "submit",
//   () => {
//     // Se guarda el estado antes de que el manejador básico vacíe el input.
//     createsNewTask = taskInput.value.trim() !== "";
//   },
//   { capture: true },
// );

// // Después de cada submit básico, el último hijo corresponde a la nueva tarea.
// taskForm.addEventListener("submit", () => {
//   if (!createsNewTask) {
//     return;
//   }

//   const newTask = taskList.lastElementChild;

//   if (newTask !== null) {
//     addEditButton(newTask);
//   }

//   createsNewTask = false;
// });

// taskList.addEventListener("click", (event) => {
//   if (!event.target.matches(".task__edit")) {
//     return;
//   }

//   const task = event.target.closest(".task");
//   const title = task.querySelector(".task__title");
//   const newTitle = prompt("Nuevo texto de la tarea", title.textContent);

//   // null corresponde a cancelar; un string vacío no es un título válido.
//   if (newTitle === null || newTitle.trim() === "") {
//     return;
//   }

//   title.textContent = newTitle.trim();
// });
