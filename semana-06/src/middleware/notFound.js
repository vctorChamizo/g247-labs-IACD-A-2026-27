const createHttpError = require("../utils/httpError");

// Si ninguna ruta anterior respondió, la petición termina en un error 404 centralizado.
function notFound(req, res, next) {
  next(createHttpError(404, "Route not found"));
}

module.exports = notFound;
