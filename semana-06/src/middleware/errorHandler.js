// Express reconoce un middleware de errores porque tiene cuatro argumentos.
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status >= 500 ? "Internal server error" : error.message;

  // La terminal conserva una traza breve para distinguir los errores esperados de los fallos internos.
  console.error(`${status} ${error.message}`);
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
