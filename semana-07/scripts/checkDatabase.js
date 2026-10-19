const { Client } = require("pg");
const databaseConfig = require("../src/db/config");
const diagnose = require("../src/db/diagnose");

async function main() {
  const config = databaseConfig();
  // Fallo reproducible sin editar .env ni detener el servidor real.
  if (process.argv.includes("--wrong-port")) config.port = 1;
  const client = new Client(config);
  try {
    await client.connect();
    const { rows } = await client.query("SELECT current_database() AS database, current_user AS db_user, 1 AS result");
    console.log("[OK 1/3] Servidor accesible y credenciales aceptadas:", rows[0]);
    // SELECT 1 solo prueba conexión; no demuestra que las migraciones existan.
    await client.query("SELECT id, email FROM users LIMIT 0");
    await client.query("SELECT id, user_id, title, done, priority FROM tasks LIMIT 0");
    console.log("[OK 2/3] Tablas y columna de la última migración disponibles.");
    const counts = await client.query("SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM tasks) AS tasks");
    console.log("[OK 3/3] Datos:", counts.rows[0]);
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error("[FALLO]", diagnose(error));
  process.exitCode = 1;
});
