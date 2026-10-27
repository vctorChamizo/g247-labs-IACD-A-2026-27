const { Pool } = require("pg");
const { databaseConfig } = require("../config");

function createPool() {
  // Un pool por proceso, compartido por los modelos. No uno por petición HTTP.
  const pool = new Pool(databaseConfig());
  pool.on("error", (error) => console.error("[DB] Conexión inactiva perdida:", error.code || "desconocido"));
  return pool;
}
module.exports = createPool;
