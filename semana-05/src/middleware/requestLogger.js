// Un middleware recibe la petición, la respuesta y la siguiente función de la tubería.
// Llamar a next() es esencial: sin ello, Express no continuaría hasta la ruta solicitada.
function requestLogger(req, res, next) {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
}

module.exports = requestLogger;
