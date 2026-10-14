const express = require("express");
const path = require("path");
const logger = require("./middleware/logger");
const resourcesRouter = require("./routes/resources");

const app = express();

app.use(express.json());
app.use(logger);

// Este middleware publica index.html, styles.css y app.js para el navegador.
// Al compartir servidor y origen con la API, el cliente puede usar URLs como
// fetch("/health") sin indicar host, puerto ni configurar CORS.
app.use(express.static(path.join(__dirname, "../public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// TODO: cambiar "resources" por el plural del recurso elegido, por ejemplo
// "/recipes" o "/players". El router mantiene las rutas separadas de app.js.
app.use("/resources", resourcesRouter);

// Toda ruta no registrada termina aquí y responde JSON.
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// El manejador de errores debe ser el último middleware registrado.
app.use((error, req, res, next) => {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({ error: error.message || "Internal server error" });
});

module.exports = app;
