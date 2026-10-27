const assert = require("node:assert/strict");
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const errorHandler = require("../src/middleware/errorHandler");

function createSecurityDemo(limit = 100) {
  const app = express();
  app.use(helmet());
  app.use(rateLimit({ windowMs: 60000, limit, standardHeaders: "draft-8", legacyHeaders: false,
    message: { error: "Too many requests" } }));
  app.use(express.json({ limit: "100kb" }));
  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.post("/body", (req, res) => res.json({ accepted: true }));
  // Error ficticio aislado. Esta ruta NO está en la API de tareas.
  app.get("/error", () => { throw new Error("DETALLE_INTERNO_QUE_NO_DEBE_SALIR"); });
  app.use(errorHandler);
  return app;
}

async function withServer(app, action) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  try { await action(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

async function main() {
  // El límite 3 se usa solo en este servidor efímero, no altera la API real.
  await withServer(createSecurityDemo(3), async (base) => {
    const first = await fetch(base + "/health");
    assert.equal(first.headers.get("x-content-type-options"), "nosniff");
    console.log("Helmet: X-Content-Type-Options = nosniff");
    await fetch(base + "/health");
    await fetch(base + "/health");
    assert.equal((await fetch(base + "/health")).status, 429);
    console.log("Petición 4 con límite 3 -> 429 [ESPERADO].");
  });
  await withServer(createSecurityDemo(), async (base) => {
    const huge = await fetch(base + "/body", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "x".repeat(110000) }) });
    assert.equal(huge.status, 413);
    const error = await fetch(base + "/error");
    assert.equal(error.status, 500);
    assert.deepEqual(await error.json(), { error: "Internal server error" });
    console.log("Cuerpo excesivo -> 413. Error interno -> 500 sin detalle [ESPERADO].");
  });
}
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { createSecurityDemo, withServer };
