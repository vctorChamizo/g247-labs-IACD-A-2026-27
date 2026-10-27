const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const httpError = require("../utils/httpError");

function createAuthController({ usersModel, secret }) {
  // -------------------------------------------------------------------------
  // 1. REGISTRO | POST /auth/register | cuerpo ya validado con Zod.
  // Guarda un hash, fija role en servidor y devuelve solo id/email (201).
  // -------------------------------------------------------------------------
  async function register(req, res) {
    const { email, password } = req.body;
    const exists = await usersModel.findByEmail(email);
    if (exists) throw httpError(409, "Email already used");
    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await usersModel.create({ email, passwordHash, role: "user" });
    } catch (error) {
      // UNIQUE resuelve también dos registros concurrentes del mismo email.
      if (error.code === "23505") throw httpError(409, "Email already used");
      throw error;
    }
    res.status(201).json({ id: user.id, email: user.email });
  }

  // -------------------------------------------------------------------------
  // 2. LOGIN | POST /auth/login | respuesta: { token } (200).
  // Mismo 401 para email desconocido y contraseña incorrecta; nunca devolver hash.
  // -------------------------------------------------------------------------
  async function login(req, res) {
    const { email, password } = req.body;
    const user = await usersModel.findByEmail(email);
    const valid = user && await bcrypt.compare(password, user.password_hash);
    if (!valid) throw httpError(401, "Invalid credentials");
    const payload = { sub: user.id, role: user.role };
    const token = jwt.sign(payload, secret, { algorithm: "HS256", expiresIn: "1h" });
    res.json({ token });
  }
  return { register, login };
}
module.exports = createAuthController;
