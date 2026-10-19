const { Pool } = require("pg");
const databaseConfig = require("./config");

// Un pool compartido reutiliza conexiones. No se crea un Pool por petición.
const pool = new Pool({ ...databaseConfig(), max: 5 });
pool.on("error", (error) => {
  console.error("[DB] Conexión inactiva perdida:", error.code || "desconocido");
});
module.exports = pool;
