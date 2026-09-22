# Práctica en clase — Lista de tareas interactiva

La práctica se construye desde cero durante la sesión. No requiere dependencias, *frameworks* ni un repositorio de entrega.

## Implementación básica

El resultado mínimo debe permitir:

1. Añadir una tarea mediante un `<input>` y el envío de un `<form>`.
2. Añadir la tarea tanto al pulsar el botón como al pulsar Intro.
3. Marcar una tarea como completada al pulsar su texto, alternando la clase `done`.
4. Eliminar una tarea mediante su botón `Eliminar`.
5. Evitar que se añada una tarea vacía.

El código de `app.js` se construye en este orden: seleccionar nodos, crear una tarea, registrar eventos y añadirla a la lista.

## Puntos extra — borrador de ampliación

Los bloques siguientes no forman parte del mínimo de la práctica. Se incorporan uno a uno únicamente cuando la funcionalidad básica esté terminada y comprendida. El código completo de cada uno está comentado al final de `app.js`: basta con descomentar el bloque correspondiente. Este documento conserva la explicación de cada mejora.

### Bloque 1 — Contador de tareas

**Objetivo:** actualizar un texto que indique el número total de tareas y las que están completadas.

Se añade este elemento después de la lista en `index.html`:

```html
<p id="task-counter" aria-live="polite"></p>
```

En `app.js` se selecciona el nodo y se define la función. `querySelectorAll` devuelve una `NodeList`; su propiedad `length` permite contar coincidencias.

```javascript
const taskCounter = document.querySelector("#task-counter");

function updateTaskCounter() {
  // Todas las tareas son elementos con la clase .task.
  const totalTasks = taskList.querySelectorAll(".task").length;

  // Una tarea completada conserva .task y añade .done.
  const completedTasks = taskList.querySelectorAll(".task.done").length;

  taskCounter.textContent = `${totalTasks} tareas · ${completedTasks} completadas.`;
}
```

Se llama a `updateTaskCounter()` al final del manejador de `submit`, del manejador que alterna `done` y del manejador que elimina una tarea.

### Bloque 2 — Vaciar tareas completadas

**Objetivo:** eliminar todas las tareas que tengan la clase `done` mediante un único botón.

Se añade el botón después del contador:

```html
<button id="clear-completed" type="button">Eliminar completadas</button>
```

El código usa `querySelectorAll` para seleccionar solo las tareas completadas y `forEach` para eliminar cada nodo.

```javascript
const clearCompletedButton = document.querySelector("#clear-completed");

clearCompletedButton.addEventListener("click", () => {
  const completedTasks = taskList.querySelectorAll(".task.done");

  // Cada elemento seleccionado se elimina de la lista y, por tanto, del DOM.
  completedTasks.forEach((task) => {
    task.remove();
  });

  updateTaskCounter();
});
```

### Bloque 3 — Estado de lista vacía

**Objetivo:** mostrar un mensaje cuando la lista no contenga tareas y ocultarlo cuando aparezca la primera.

Se añade el mensaje después de la lista:

```html
<p id="empty-message" hidden>No hay tareas pendientes.</p>
```

`children.length` cuenta los elementos hijos reales de la lista. La propiedad `hidden` permite alternar su visibilidad sin añadir estilos adicionales.

```javascript
const emptyMessage = document.querySelector("#empty-message");

function updateEmptyMessage() {
  const isEmpty = taskList.children.length === 0;

  // Si la lista está vacía, hidden pasa a false y el mensaje se muestra.
  emptyMessage.hidden = !isEmpty;
}
```

Se llama a `updateEmptyMessage()` después de añadir o eliminar una tarea.

### Bloque 4 — Prioridad visual

**Objetivo:** asignar una prioridad a cada tarea y representarla mediante una clase CSS.

Se añade un selector al formulario:

```html
<label for="priority-input">Prioridad</label>
<select id="priority-input">
  <option value="low">Baja</option>
  <option value="medium" selected>Media</option>
  <option value="high">Alta</option>
</select>
```

La función que crea una tarea recibe el valor elegido. La plantilla literal construye una clase concreta, por ejemplo `task--high`.

```javascript
const priorityInput = document.querySelector("#priority-input");

function createTask(taskTitle, priority) {
  const task = document.createElement("li");

  task.classList.add("task", `task--${priority}`);
  // Se conserva el resto de la creación de título, botón y eventos.

  return task;
}

// Dentro del manejador submit:
taskList.append(createTask(taskTitle, priorityInput.value));
```

En `styles.css` se pueden distinguir las prioridades sin modificar JavaScript:

```css
.task--high { border-left: 4px solid #b91c1c; }
.task--medium { border-left: 4px solid #d97706; }
.task--low { border-left: 4px solid #15803d; }
```

### Bloque 5 — Filtros de tareas

**Objetivo:** mostrar todas las tareas, solo las pendientes o solo las completadas.

Se añaden tres botones y una clase CSS que oculta un elemento:

```html
<div class="filters" aria-label="Filtrar tareas">
  <button type="button" data-filter="all">Todas</button>
  <button type="button" data-filter="pending">Pendientes</button>
  <button type="button" data-filter="completed">Completadas</button>
</div>
```

```css
.is-hidden { display: none; }
```

Cada botón contiene el filtro en un atributo `data-*`. El código utiliza condiciones para decidir si cada tarea se oculta.

```javascript
const filterButtons = document.querySelectorAll("[data-filter]");

function applyFilter(filter) {
  const taskItems = taskList.querySelectorAll(".task");

  taskItems.forEach((task) => {
    const isCompleted = task.classList.contains("done");
    const shouldHide =
      (filter === "pending" && isCompleted) ||
      (filter === "completed" && !isCompleted);

    // La condición es false para el filtro "all", así que no se oculta ninguna tarea.
    task.classList.toggle("is-hidden", shouldHide);
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyFilter(button.dataset.filter);
  });
});
```

### Bloque 6 — Edición del texto

**Objetivo:** modificar el texto de una tarea existente sin crear un nuevo elemento.

Se añade un botón junto al de eliminar dentro de `createTask`. El borrador usa `prompt` para concentrarse en el cambio del DOM; una versión posterior puede sustituirlo por un `<input>`.

```javascript
const editButton = document.createElement("button");

editButton.type = "button";
editButton.textContent = "Editar";

editButton.addEventListener("click", () => {
  const newTitle = prompt("Nuevo texto de la tarea", title.textContent);

  // null indica que se canceló el cuadro; un string vacío no es un título válido.
  if (newTitle === null || newTitle.trim() === "") {
    return;
  }

  title.textContent = newTitle.trim();
});

task.append(title, editButton, deleteButton);
```

Los extras se pueden detener en cualquier bloque: cada uno conserva la funcionalidad de los bloques anteriores y añade una única idea de DOM, control de flujo o arrays.
