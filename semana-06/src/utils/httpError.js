// Los controladores crean errores con status code. El middleware final decide cómo enviarlos al cliente.
function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

module.exports = createHttpError;
