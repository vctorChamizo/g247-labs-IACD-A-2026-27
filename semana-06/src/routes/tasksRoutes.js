const express = require("express");
const tasksController = require("../controllers/tasksController");

const router = express.Router();

// Las rutas son deliberadamente finas: solo asocian método y URL con el controlador adecuado.
router.get("/", tasksController.listTasks);
router.get("/:id", tasksController.getTask);
router.post("/", tasksController.createTaskHandler);
router.put("/:id", tasksController.replaceTask);
router.patch("/:id", tasksController.updateTask);
router.delete("/:id", tasksController.deleteTask);

module.exports = router;
