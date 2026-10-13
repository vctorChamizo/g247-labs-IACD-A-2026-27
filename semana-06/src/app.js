const express = require("express");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const tasksRouter = require("./routes/tasksRoutes");

const app = express();

// El orden de registro es el recorrido real de cada petición.
app.use(express.json());
app.use(requestLogger);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// El router conoce las URLs de /tasks; los controladores contienen el comportamiento de cada ruta.
app.use("/tasks", tasksRouter);

// Estas dos funciones deben registrarse al final: atienden rutas desconocidas y errores de las capas anteriores.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
