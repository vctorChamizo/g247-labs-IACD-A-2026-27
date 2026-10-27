const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });

function configurationError(message) {
  return Object.assign(new Error(message), { code: "CONFIG" });
}

// Cada proceso pide solo lo que necesita: preparar la DB no requiere JWT_SECRET.
function databaseConfig() {
  let url;
  try {
    url = new URL(process.env.DATABASE_URL);
  } catch {
    throw configurationError("Falta DATABASE_URL o no es una URL PostgreSQL válida.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2) {
    throw configurationError("DATABASE_URL debe indicar servidor y nombre de base PostgreSQL.");
  }
  return { connectionString: url.href, connectionTimeoutMillis: 3000, max: 5 };
}

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw configurationError("JWT_SECRET necesita al menos 32 bytes. Generar un secreto aleatorio y guardarlo en .env.");
  }
  return secret;
}

function serverConfig() {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw configurationError("PORT debe ser un puerto entre 1 y 65535.");
  }
  const origins = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",").map((value) => value.trim());
  if (origins.some((origin) => { try { return new URL(origin).origin !== origin; } catch { return true; } })) {
    throw configurationError("CORS_ORIGINS debe contener orígenes completos separados por comas, sin rutas ni wildcard.");
  }
  return { port, origins };
}

module.exports = { databaseConfig, jwtSecret, serverConfig, configurationError };
