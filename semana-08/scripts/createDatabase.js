const { Client } = require("pg");
const { databaseConfig, configurationError } = require("../src/config");
const diagnose = require("../src/db/diagnose");

async function main() {
  const connection = databaseConfig();
  const url = new URL(connection.connectionString);
  const name = decodeURIComponent(url.pathname.slice(1));
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(name) || ["postgres", "template0", "template1"].includes(name)) {
    throw configurationError("Elegir un nombre de DB propio con letras minúsculas, números y guion bajo.");
  }
  url.pathname = "/postgres";
  const client = new Client({ ...connection, connectionString: url.href });
  try {
    await client.connect();
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname=$1", [name]);
    if (result.rowCount) return console.log("[OK] La DB ya existe; no se modifica.");
    // Los identificadores no admiten $1: el nombre se ha limitado antes.
    await client.query(`CREATE DATABASE "${name}"`);
    console.log("[OK] DB nueva creada. Ejecutar db:migrate.");
  } finally {
    await client.end();
  }
}
main().catch((error) => { console.error(diagnose(error)); process.exitCode = 1; });
