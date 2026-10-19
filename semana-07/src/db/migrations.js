const fs = require("node:fs");
const path = require("node:path");
const directory = path.join(__dirname, "../../db/migrations");

// Soporte de la demostración: aplicar archivos SQL en orden, una sola vez.
// En clase se estudian los .sql, no es necesario explicar este ejecutor.
async function migrate(pool, { step = false, status = false } = {}) {
  const client = await pool.connect();
  const appliedNow = [];
  try {
    await client.query("BEGIN");
    // Serializa dos ejecuciones accidentales sobre la misma base.
    await client.query("SELECT pg_advisory_xact_lock(247007)");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    const { rows } = await client.query("SELECT name FROM schema_migrations");
    const applied = new Set(rows.map((row) => row.name));
    const files = fs.readdirSync(directory).filter((name) => name.endsWith(".sql")).sort();
    const pending = files.filter((name) => !applied.has(name));
    if (!status) {
      const existing = await client.query("SELECT to_regclass('public.users') AS users, to_regclass('public.tasks') AS tasks");
      if (!applied.size && (existing.rows[0].users || existing.rows[0].tasks)) {
        throw Object.assign(new Error("La base ya contiene tablas sin el historial SQL de este ejemplo. Usar otro PGDATABASE y ejecutar db:create para conservar los datos anteriores."), { code: "CONFIG" });
      }
      for (const name of step ? pending.slice(0, 1) : pending) {
        await client.query(fs.readFileSync(path.join(directory, name), "utf8"));
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
        appliedNow.push(name);
      }
    }
    await client.query("COMMIT");
    return { appliedNow, pending: pending.filter((name) => !appliedNow.includes(name)), applied: [...applied, ...appliedNow] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function seed(pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(fs.readFileSync(path.join(__dirname, "../../db/seeds/001_demo.sql"), "utf8"));
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
module.exports = { migrate, seed };
