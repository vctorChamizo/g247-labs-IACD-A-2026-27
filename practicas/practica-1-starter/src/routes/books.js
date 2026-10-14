const express = require("express");
const {
  listBooks,
  getBook,
  createBook,
  replaceBook,
  updateBook,
  deleteBook,
  getStats,
} = require("../controllers/booksController");

const router = express.Router();

// Declarar /stats antes de /:id evita interpretarlo como un identificador.
router.get("/stats", getStats);
router.get("/", listBooks);
router.post("/", createBook);
router.get("/:id", getBook);
router.put("/:id", replaceBook);
router.patch("/:id", updateBook);
router.delete("/:id", deleteBook);

module.exports = router;

