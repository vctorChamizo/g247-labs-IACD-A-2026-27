const { Client } = require("pg");
const databaseConfig = require("../src/db/config");
const diagnose = require("../src/db/diagnose");

async function main() {
  const config = databaseConfig();
  // Para crear aula_web hay que conectarse primero a una DB que ya existe.
  const client = new Client({ ...config, database: "postgres" });
  try {
    await client.connect();
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [config.database]);
    if (exists.rowCount) return console.log("[OK] La base ya existe.");
    // Los identificadores (nombres de DB/tabla) NO admiten $1. Aquí se limita el
    // nombre a letras, números y guion bajo antes de construir la instrucción.
    if (!/^[a-z][a-z0-9_]{0,62}$/.test(config.database)) {
      throw Object.assign(new Error("PGDATABASE debe comenzar por una letra minúscula y contener solo letras minúsculas, números o guion bajo (máximo 63 caracteres)"), { code: "CONFIG" });
    }
    await client.query(`CREATE DATABASE "${config.database}"`);
    console.log("[OK] Base creada. Todavía no contiene las tablas del modelo.");
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error(diagnose(error));
  process.exitCode = 1;
});
