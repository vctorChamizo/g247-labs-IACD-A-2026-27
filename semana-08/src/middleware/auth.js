const jwt = require("jsonwebtoken");

function createAuth(secret) {
  return function auth(req, res, next) {
    // 1. Postman envía: Authorization: Bearer <token>.
    const authorization = req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Bearer token" });
    }
    const token = authorization.slice(7); // Quitar el prefijo "Bearer ".

    try {
      // 2. verify comprueba firma y caducidad. Si falla, salta al catch.
      // Nuestro login firma el payload { sub: user.id, role: user.role }.
      req.user = jwt.verify(token, secret, { algorithms: ["HS256"] });
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    // 3. El controlador podrá leer req.user.sub para saber quién hace la petición.
    next();
  };
}
module.exports = createAuth;
