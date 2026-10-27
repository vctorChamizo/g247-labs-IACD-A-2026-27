const { Router } = require("express");
const validate = require("../middleware/validate");
const { credentialsSchema } = require("../validators/schemas");

module.exports = (controller) => {
  const router = Router();
  // Rutas públicas: nadie tiene un token cuando se registra o inicia sesión.
  router.post("/register", validate(credentialsSchema), controller.register);
  router.post("/login", validate(credentialsSchema), controller.login);
  return router;
};
