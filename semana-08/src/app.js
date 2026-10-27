const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const createUsersModel = require("./models/usersModel");
const createTasksModel = require("./models/tasksModel");
const createAuthController = require("./controllers/authController");
const createTasksController = require("./controllers/tasksController");
const createAuth = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

function createApp({ db, secret, origins = ["http://localhost:5173"], requestLimit = 100 }) {
  const app = express();
  const usersModel = createUsersModel(db);
  const tasksModel = createTasksModel(db);
  const authController = createAuthController({ usersModel, secret });
  const tasksController = createTasksController({ tasksModel });

  // 1. Seguridad y CORS ANTES de auth: un preflight OPTIONS no lleva Bearer.
  app.use(helmet());
  app.use(cors({ origin: origins, credentials: true }));
  app.use(rateLimit({
    windowMs: 60000,
    limit: requestLimit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests" },
  }));
  app.use(express.json({ limit: "100kb" }));

  // 2. Salud pública; no confundir proceso HTTP vivo y base preparada.
  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.get("/health/db", async (req, res) => {
    try {
      await db.query("SELECT u.id, u.password_hash, u.role, t.user_id FROM users u LEFT JOIN tasks t ON t.user_id=u.id LIMIT 0");
      res.json({ status: "ok", database: "ready" });
    } catch {
      res.status(503).json({ status: "error", database: "unavailable" });
    }
  });

  // 3. Público frente a protegido: este orden se sigue al explicar el deck.
  app.use("/auth", authRoutes(authController));
  app.use("/tasks", createAuth(secret), taskRoutes(tasksController));

  // 4. Express 5 deriva automáticamente los rechazos async a este handler.
  app.use((req, res) => res.status(404).json({ error: "Route not found" }));
  app.use(errorHandler);
  return app;
}
module.exports = createApp;
