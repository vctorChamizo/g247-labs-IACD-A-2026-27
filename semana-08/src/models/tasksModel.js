function createTasksModel(db) {
  // A diferencia de semana 7, se conserva user_id en las filas del modelo.
  // El DTO hace la conversión a userId. Así la propiedad se comprueba igual que
  // en el deck y no se confunden nombres de columna y nombres de la API.
  const columns = "id, title, done, user_id";

  // 1. LISTAR POR PROPIETARIO | entrada: identidad y página | salida: filas.
  // La condición de propietario se aplica ANTES de paginar, dentro del SQL.
  async function findByOwner(userId, { limit, offset }) {
    const sql = `SELECT ${columns} FROM tasks
      WHERE user_id = $1 ORDER BY id LIMIT $2 OFFSET $3`;
    const values = [userId, limit, offset];
    const { rows } = await db.query(sql, values);
    return rows;
  }

  // 2. CONSULTAR | entrada: id | salida: fila o undefined.
  // El controlador distingue 404 (no existe) y 403 (existe, pero es ajena).
  async function findById(id) {
    const sql = `SELECT ${columns} FROM tasks WHERE id = $1`;
    const { rows } = await db.query(sql, [id]);
    return rows[0];
  }

  // 3. CREAR | entrada: título/estado e identidad del token | salida: nueva fila.
  async function create({ title, done, userId }) {
    const sql = `INSERT INTO tasks (title, done, user_id)
      VALUES ($1, $2, $3) RETURNING ${columns}`;
    const { rows } = await db.query(sql, [title, done, userId]);
    return rows[0];
  }

  // 4. REEMPLAZAR | no permite transferir la tarea a otro propietario.
  // La condición de propietario en el UPDATE refuerza la comprobación HTTP.
  async function update(id, userId, { title, done }) {
    const sql = `UPDATE tasks SET title=$1, done=$2
      WHERE id=$3 AND user_id=$4 RETURNING ${columns}`;
    const { rows } = await db.query(sql, [title, done, id, userId]);
    return rows[0];
  }

  // 5. MODIFICAR SOLO DONE | salida: fila o undefined; conserva el título.
  async function setDone(id, userId, done) {
    const sql = `UPDATE tasks SET done=$1 WHERE id=$2 AND user_id=$3 RETURNING ${columns}`;
    const { rows } = await db.query(sql, [done, id, userId]);
    return rows[0];
  }

  // 6. BORRAR | salida: booleano según las filas afectadas, sin SELECT extra aquí.
  async function remove(id, userId) {
    const sql = "DELETE FROM tasks WHERE id=$1 AND user_id=$2";
    const result = await db.query(sql, [id, userId]);
    return result.rowCount > 0;
  }
  return { findByOwner, findById, create, update, setDone, remove };
}
module.exports = createTasksModel;
