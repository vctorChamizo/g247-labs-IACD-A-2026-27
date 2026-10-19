const pool = require("../src/db/pool");
const diagnose = require("../src/db/diagnose");

async function main() {
  const client = await pool.connect();
  try {
    const { rows: users } = await client.query("SELECT id, email FROM users ORDER BY id LIMIT 1");
    if (!users.length) throw new Error("Ejecutar primero npm run db:seed");
    const cases = [
      ["Email duplicado", "23505", "INSERT INTO users (email) VALUES ($1)", [users[0].email]],
      ["Usuario inexistente", "23503", "INSERT INTO tasks (title, user_id) VALUES ($1, $2)", ["Prueba", -1]],
      ["Título vacío", "23514", "INSERT INTO tasks (title, user_id) VALUES ($1, $2)", ["  ", users[0].id]],
      ["Columna inexistente", "42703", "SELECT columna_inventada FROM tasks", []],
    ];
    for (const [label, expected, sql, values] of cases) {
      // Cada fallo se aísla en su transacción. ROLLBACK recupera la conexión
      // después del error y evita dejar filas de demostración persistidas.
      await client.query("BEGIN");
      try {
        await client.query(sql, values);
        throw new Error(`La prueba ${label} debía fallar con ${expected}`);
      } catch (error) {
        if (error.code !== expected) throw error;
        console.log(`[ESPERADO] ${label}: ${diagnose(error)}`);
      } finally {
        await client.query("ROLLBACK");
      }
    }
  } finally {
    client.release();
  }
}
main().catch((error) => {
  console.error("[FALLO NO ESPERADO]", diagnose(error));
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
