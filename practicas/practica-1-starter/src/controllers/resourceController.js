// El controlador coordina la petición: valida, llama al almacenamiento y decide
// el status code. Este fichero no contiene un recurso ni reglas resueltas.

function pending(res) {
  // La respuesta 501 hace visible que la infraestructura funciona sin ofrecer
  // una respuesta propia de la práctica. Se sustituye al implementar cada ruta.
  return res.status(501).json({ error: "Route pending implementation" });
}

function list(req, res, next) {
  // TODO: obtener la colección desde data/store.js y aplicar la consulta.
  return pending(res);
}

function getStats(req, res, next) {
  // TODO: calcular un agregado a partir de los datos actuales.
  return pending(res);
}

function getById(req, res, next) {
  // TODO: convertir el id, buscar el recurso y responder 404 si no existe.
  return pending(res);
}

function create(req, res, next) {
  // TODO: validar req.body, crear con id de servidor y responder 201 + Location.
  return pending(res);
}

function replace(req, res, next) {
  // TODO: validar todos los campos y sustituir el recurso completo.
  return pending(res);
}

function update(req, res, next) {
  // TODO: validar solo los campos enviados y actualizar el recurso parcialmente.
  return pending(res);
}

function remove(req, res, next) {
  // TODO: eliminar y responder 204 sin cuerpo; responder 404 si no existe.
  return pending(res);
}

module.exports = { list, getStats, getById, create, replace, update, remove };

