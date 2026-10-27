function errorHandler(error, req, res, next) {
  // Los errores de JSON y tamaño conservan 400/413; no convertirlos todos en 500.
  if (error.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON body" });
  if (error.type === "entity.too.large") return res.status(413).json({ error: "Payload too large" });
  if (error.status >= 400 && error.status < 500) return res.status(error.status).json({ error: error.message });
  const code = error.code || error.errors?.[0]?.code;
  const unavailable = ["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "57P01", "57P02", "57P03", "42P01", "42703", "3D000", "28P01"].includes(code) || error.message === "Connection terminated unexpectedly";
  // El servidor registra un identificador técnico, sin SQL, password ni token.
  console.error("[API]", code || "INTERNAL_ERROR");
  res.status(unavailable ? 503 : 500).json({ error: unavailable ? "Database unavailable" : "Internal server error" });
}
module.exports = errorHandler;
