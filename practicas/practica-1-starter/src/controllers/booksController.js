const store = require("../data/store");
const { validateBook } = require("../validators/bookValidator");

function notImplemented(res) {
  return res.status(501).json({ error: "Operation pending implementation" });
}

// GET /books
function listBooks(req, res, next) {
  // TODO: leer search, available, genre, sort, order, limit y offset.
  // TODO: aplicar una política documentada para parámetros desconocidos.
  return res.json(store.list());
}

// GET /books/stats
function getStats(req, res, next) {
  // TODO: calcular el agregado en cada petición; no almacenarlo.
  return notImplemented(res);
}

// GET /books/:id
function getBook(req, res, next) {
  // TODO: convertir req.params.id, buscar en store y responder 404 si no existe.
  return notImplemented(res);
}

// POST /books
function createBook(req, res, next) {
  const errors = validateBook(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Solo se copian los campos permitidos; el id lo asigna el almacenamiento.
  const book = store.create({
    title: req.body.title.trim(),
    pages: req.body.pages,
    available: req.body.available,
    genre: req.body.genre,
  });

  return res.status(201).location(`/books/${book.id}`).json(book);
}

// PUT /books/:id
function replaceBook(req, res, next) {
  // TODO: validar el body completo y sustituir el recurso conservando su id.
  return notImplemented(res);
}

// PATCH /books/:id
function updateBook(req, res, next) {
  // TODO: validar solo los campos recibidos con { partial: true }.
  return notImplemented(res);
}

// DELETE /books/:id
function deleteBook(req, res, next) {
  // TODO: eliminar y responder 204 sin cuerpo; responder 404 si no existe.
  return notImplemented(res);
}

module.exports = {
  listBooks,
  getBook,
  createBook,
  replaceBook,
  updateBook,
  deleteBook,
  getStats,
};

