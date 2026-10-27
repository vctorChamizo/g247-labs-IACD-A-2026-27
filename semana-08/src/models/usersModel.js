// El modelo conoce SQL; el controlador decide HTTP. Nunca se devuelve el hash
// directamente desde una ruta: findByEmail se reserva para autenticar.
function createUsersModel(db) {
  // 1. BUSCAR PARA LOGIN | entrada: email | salida: fila interna o undefined.
  async function findByEmail(email) {
    const sql = "SELECT id, email, password_hash, role FROM users WHERE email = $1";
    const { rows } = await db.query(sql, [email]);
    return rows[0];
  }

  // 2. REGISTRAR | entrada: datos validados y hash | salida: usuario sin hash.
  async function create({ email, passwordHash, role }) {
    const sql = `INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3) RETURNING id, email, role`;
    const { rows } = await db.query(sql, [email, passwordHash, role]);
    return rows[0];
  }
  return { findByEmail, create };
}
module.exports = createUsersModel;
