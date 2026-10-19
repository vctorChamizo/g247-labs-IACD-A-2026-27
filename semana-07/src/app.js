const express = require("express");
const createTasksController = require("./controllers/tasksController");
const diagnose = require("./db/diagnose");

// Recibir el pool permite arrancar la misma app con la DB de prueba sin cambiar
// las rutas. Se mantiene explícito el recorrido routes -> controller -> model.
function createApp(db) {
  const app = express();
  const tasks = createTasksController(db);
  app.use(express.json());

  // Vivo no significa preparado: /health no consulta PostgreSQL.
  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.get("/health/db", async (req, res) => {
    try {
      await db.query(`
        SELECT t.id, t.title, t.done, t.user_id, t.priority, u.email
        FROM tasks t JOIN users u ON u.id = t.user_id LIMIT 0
      `);
      res.json({ status: "ok", database: "ready" });
    } catch (error) {
      console.error("[DB]", diagnose(error));
      res.status(503).json({ status: "error", database: "unavailable" });
    }
  });
  app.get("/tasks", tasks.list);
  app.get("/tasks/:id", tasks.get);
  app.post("/tasks", tasks.create);
  app.put("/tasks/:id", tasks.replace);
  app.patch("/tasks/:id", tasks.update);
  app.delete("/tasks/:id", tasks.remove);
  app.use((req, res) => res.status(404).json({ error: "Route not found" }));

  // El cliente recibe HTTP, no SQL ni credenciales. El detalle técnico queda
  // en la terminal. Una FK inválida es un 400; servidor caído es un 503.
  app.use((error, req, res, next) => {
    if (error.code === "23503") return res.status(400).json({ error: "userId does not exist" });
    if (error.code === "23505") return res.status(409).json({ error: "Duplicate value" });
    if (error.code === "23514") return res.status(400).json({ error: "Invalid task values" });
    if (error.status) return res.status(error.status).json({ error: error.status === 400 ? "Invalid request: " + error.message : error.message });
    console.error("[DB/API]", diagnose(error));
    const databaseCodes = ["ECONNREFUSED", "ECONNRESET", "EPIPE", "ENOTFOUND", "28P01", "28000", "3D000", "42P01", "42703", "57P01", "57P02", "57P03"];
    const unavailable = databaseCodes.includes(error.code) || error.message === "Connection terminated unexpectedly";
    res.status(unavailable ? 503 : 500).json({
      error: unavailable ? "Database unavailable or schema not ready" : "Internal server error",
    });
  });
  return app;
}
module.exports = createApp;
