const fs = require("node:fs");
const path = require("node:path");
const { configurationError } = require("../config");
const directory = path.join(__dirname, "../../db/migrations");

// Infraestructura ya vista: el contenido nuevo está en auth/validación/permisos.
async function migrate(pool, { status = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(247008)");
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
    const files = fs.readdirSync(directory).filter((name) => name.endsWith(".sql")).sort();
    const { rows } = await client.query("SELECT name FROM schema_migrations");
    const applied = new Set(rows.map((row) => row.name));
    if (rows.some((row) => !files.includes(row.name))) {
      throw configurationError("Esta DB tiene el historial de otro ejemplo. Elegir una DB nueva para semana 8.");
    }
    const existing = await client.query("SELECT to_regclass('public.users') AS users, to_regclass('public.tasks') AS tasks");
    if (!applied.size && (existing.rows[0].users || existing.rows[0].tasks)) {
      throw configurationError("La DB ya tiene tablas sin este historial. Conservarla y elegir una base nueva.");
    }
    const pending = files.filter((file) => !applied.has(file));
    if (!status) {
      for (const file of pending) {
        await client.query(fs.readFileSync(path.join(directory, file), "utf8"));
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      }
    }
    await client.query("COMMIT");
    return { appliedNow: status ? [] : pending, pending: status ? pending : [] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
module.exports = migrate;
