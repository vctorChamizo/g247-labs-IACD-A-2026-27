const bcrypt = require("bcryptjs");

// Solo credenciales FICTICIAS del ejemplo, documentadas para las demostraciones.
const DEMO_PASSWORD = "AulaSegura8!";
async function seed(pool) {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(247008)");
    for (const [email, count, prefix] of [["ana@example.com", 7, "Ana"], ["luis@example.com", 3, "Luis"]]) {
      // Repetir el seed no cambia contraseñas, roles ni trabajo ya existente.
      await client.query("INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING", [email, hash]);
      const { rows } = await client.query("SELECT id FROM users WHERE email=$1", [email]);
      for (let n = 1; n <= count; n++) {
        await client.query(`INSERT INTO tasks (user_id, title, done, seed_key)
          VALUES ($1, $2, $3, $4) ON CONFLICT (seed_key) DO NOTHING`,
        [rows[0].id, `${prefix}: tarea ${n}`, n === 1, `${prefix.toLowerCase()}-${n}`]);
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
module.exports = { seed, DEMO_PASSWORD };
