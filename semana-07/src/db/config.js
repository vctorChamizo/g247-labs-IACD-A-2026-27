const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../../.env"), quiet: true });

// Usamos los mismos nombres que pg/psql. Una sola configuración evita que
// migraciones y API terminen apuntando accidentalmente a bases diferentes.
function databaseConfig() {
  for (const key of ["PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE"]) {
    if (!process.env[key]) {
      throw Object.assign(new Error(`Falta ${key}: crear y completar .env`), { code: "CONFIG" });
    }
  }
  const port = Number(process.env.PGPORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw Object.assign(new Error("PGPORT debe ser un puerto entre 1 y 65535"), { code: "CONFIG" });
  }
  return {
    host: process.env.PGHOST,
    port,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    connectionTimeoutMillis: 3000,
  };
}

module.exports = databaseConfig;
