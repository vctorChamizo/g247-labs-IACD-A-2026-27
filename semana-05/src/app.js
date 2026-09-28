const express = require("express");
const requestLogger = require("./middleware/requestLogger");

// app.js construye la aplicación Express. No abre un puerto de red;
// server.js tiene esa responsabilidad para poder probar la aplicación de forma aislada más adelante.
const app = express();

// Este array es almacenamiento temporal. Los laboratorios posteriores moverán estos datos
// a un modelo y después a una base de datos. La relación entre tareas y usuarios es el hilo conductor del bloque II.
const tasks = [
  { id: 1, title: "Create the Express app", done: true, userId: 1 },
  { id: 2, title: "Add a request logger", done: false, userId: 1 },
  { id: 3, title: "Explain route parameters", done: false, userId: 2 },
];

// El middleware se ejecuta en el orden en que se registra. express.json() debe ejecutarse antes
// de las rutas POST que necesitan req.body, y el logger se ejecuta antes de todas las rutas siguientes.
app.use(express.json());
app.use(requestLogger);

// Esta ruta responde a una pregunta simple: "¿la API está funcionando?".
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// :message forma parte de la ruta, por eso Express lo expone mediante req.params.
app.get("/echo/:message", (req, res) => {
  res.json({ echo: req.params.message });
});

app.get("/tasks", (req, res) => {
  // ?done=true es un parámetro de consulta opcional. Modifica esta petición;
  // a diferencia de un parámetro de ruta, no identifica un recurso concreto.
  if (req.query.done === "true") {
    res.json(tasks.filter((task) => task.done));
    return;
  }

  if (req.query.done === "false") {
    res.json(tasks.filter((task) => !task.done));
    return;
  }

  res.json(tasks);
});

app.post("/tasks", (req, res) => {
  // Esta primera API solo demuestra que los cuerpos JSON llegan a req.body.
  // Un laboratorio posterior validará y almacenará una tarea en lugar de limitarse a devolverla.
  res.status(201).json({ received: req.body });
});

module.exports = app;
