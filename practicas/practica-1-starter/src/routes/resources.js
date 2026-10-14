const express = require("express");
const controller = require("../controllers/resourceController");

const router = express.Router();

// Una ruta solo relaciona un método HTTP y una URL con una función.
// No incluye validación, acceso a datos ni construcción de respuestas.
// TODO: sustituir "resources" por el nombre del recurso elegido en este fichero
// y en el resto de la aplicación.

// Declarar /stats antes de /:id evita tratar "stats" como un identificador.
router.get("/stats", controller.getStats);
router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.getById);
router.put("/:id", controller.replace);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

