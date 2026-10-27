const { Router } = require("express");
const validate = require("../middleware/validate");
const { createTaskSchema, replaceTaskSchema, updateTaskSchema } = require("../validators/schemas");

module.exports = (controller) => {
  const router = Router();
  // auth se monta por prefijo en app.js. Después, Zod precede al controlador.
  router.get("/", controller.list);
  router.get("/:id", controller.getOne);
  router.post("/", validate(createTaskSchema), controller.create);
  router.put("/:id", validate(replaceTaskSchema), controller.replace);
  router.patch("/:id", validate(updateTaskSchema), controller.update);
  router.delete("/:id", controller.remove);
  return router;
};
