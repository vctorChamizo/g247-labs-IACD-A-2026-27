const createPool = require("../src/db/pool");
const migrate = require("../src/db/migrate");
const { seed } = require("../db/seed");
const diagnose = require("../src/db/diagnose");

async function main() {
  const db = createPool();
  try {
    const action = process.argv[2];
    if (action === "migrate" || action === "status") {
      const result = await migrate(db, { status: action === "status" });
      console.log("[OK]", result);
    } else if (action === "seed") {
      await seed(db);
      console.log("[OK] Seed listo. En una DB nueva: 2 usuarios y 10 tareas (7 de Ana, 3 de Luis).");
    } else if (action === "check") {
      const { rows } = await db.query("SELECT current_database() AS database, current_user AS username");
      console.log("[OK 1/3] Conexión:", rows[0]);
      await db.query("SELECT id, email, password_hash, role FROM users LIMIT 0");
      await db.query("SELECT id, title, done, user_id, seed_key FROM tasks LIMIT 0");
      console.log("[OK 2/3] Esquema preparado.");
      const result = await db.query("SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM tasks) AS tasks");
      console.log("[OK 3/3] Filas:", result.rows[0]);
    } else {
      throw Object.assign(new Error("Usar migrate, status, seed o check."), { code: "CONFIG" });
    }
  } finally {
    await db.end();
  }
}
main().catch((error) => { console.error(diagnose(error)); process.exitCode = 1; });
