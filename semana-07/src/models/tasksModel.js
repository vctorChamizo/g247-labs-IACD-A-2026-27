// =============================================================================
// 1. CONSTRUIR EL MODELO Y DEFINIR LOS CAMPOS QUE DEVUELVE
// db es el pool recibido del controlador o de una demostración de terminal.
// Este módulo ejecuta SQL y devuelve datos: no recibe req/res ni decide HTTP.
// Las consultas fallidas rechazan su promesa; los errores llegan al controlador.
// =============================================================================
function createTasksModel(db) {
  // Alias SQL: la DB usa snake_case y la API conserva userId, como en semana 6.
  // Esta lista es código fijo, nunca texto recibido del usuario.
  const columns = 'id, title, done, user_id AS "userId", priority';

  // ---------------------------------------------------------------------------
  // 2.1. LISTAR | SELECT | Usada por controller.list
  // Entrada: ninguna. Salida: array de filas, ordenadas por id; puede estar vacío.
  // ---------------------------------------------------------------------------
  async function findAll() {
    const sql = `SELECT ${columns} FROM tasks ORDER BY id`;
    const { rows } = await db.query(sql);
    return rows;
  }

  // ---------------------------------------------------------------------------
  // 2.2. BUSCAR POR ID | SELECT ... WHERE | Usada por controller.get
  // Entrada: id validado. Salida: una fila o undefined si no existe.
  // $1 representa un valor: el parámetro no se interpreta como código SQL.
  // ---------------------------------------------------------------------------
  async function findById(id) {
    const sql = `SELECT ${columns} FROM tasks WHERE id = $1`;
    const values = [id];
    const { rows } = await db.query(sql, values);
    return rows[0];
  }

  // ---------------------------------------------------------------------------
  // 2.3. INSERTAR | INSERT ... RETURNING | Usada por controller.create
  // Entrada: title/done/userId validados. Salida: la fila recién creada.
  // RETURNING incluye el id generado y priority con su valor por defecto.
  // Una FK inválida genera un error de PostgreSQL, no un resultado undefined.
  // ---------------------------------------------------------------------------
  async function create({ title, done, userId }) {
    const sql = `
      INSERT INTO tasks (title, done, user_id)
      VALUES ($1, $2, $3)
      RETURNING ${columns}
    `;
    const values = [title, done, userId];
    const { rows } = await db.query(sql, values);
    return rows[0];
  }

  // ---------------------------------------------------------------------------
  // 2.4. REEMPLAZAR CAMPOS EDITABLES | UPDATE | Usada por controller.replace
  // Entrada: id y los tres campos completos. Salida: fila actualizada o undefined.
  // WHERE limita la escritura a esa tarea; priority no se modifica.
  // ---------------------------------------------------------------------------
  async function replace(id, { title, done, userId }) {
    const sql = `
      UPDATE tasks SET title = $1, done = $2, user_id = $3
      WHERE id = $4
      RETURNING ${columns}
    `;
    const values = [title, done, userId, id];
    const { rows } = await db.query(sql, values);
    return rows[0];
  }

  // ---------------------------------------------------------------------------
  // 2.5. CAMBIAR SOLO DONE | UPDATE | Usada por controller.update
  // Entrada: id y booleano. Salida: fila actualizada o undefined.
  // Una sola escritura conserva los demás campos, aunque otra petición los edite.
  // ---------------------------------------------------------------------------
  async function setDone(id, done) {
    const sql = `UPDATE tasks SET done = $1 WHERE id = $2 RETURNING ${columns}`;
    const values = [done, id];
    const { rows } = await db.query(sql, values);
    return rows[0];
  }

  // ---------------------------------------------------------------------------
  // 2.6. BORRAR | DELETE | Usada por controller.remove
  // Entrada: id. Salida: true si se borró una fila; false si no existía.
  // rowCount evita hacer un SELECT adicional antes del DELETE.
  // ---------------------------------------------------------------------------
  async function remove(id) {
    const sql = "DELETE FROM tasks WHERE id = $1";
    const values = [id];
    const result = await db.query(sql, values);
    return result.rowCount > 0;
  }

  // ---------------------------------------------------------------------------
  // 2.7. CONSULTAR LA RELACIÓN | JOIN | Usada por scripts/demoModel.js
  // Entrada: email. Salida: array con id/title/done/email; puede estar vacío.
  // El JOIN representa en SQL la línea users 1 -> N tasks del diagrama.
  // Esta función se demuestra en terminal y no tiene una ruta HTTP propia.
  // ---------------------------------------------------------------------------
  async function findForEmail(email) {
    const sql = `
      SELECT t.id, t.title, t.done, u.email
      FROM tasks t JOIN users u ON u.id = t.user_id
      WHERE u.email = $1 ORDER BY t.id
    `;
    const values = [email];
    const { rows } = await db.query(sql, values);
    return rows;
  }

  // 3. INTERFAZ DEL MODELO: funciones disponibles para el resto de la aplicación.
  return { findAll, findById, create, replace, setDone, remove, findForEmail };
}

module.exports = createTasksModel;
