const createApp = require("./app");
const createPool = require("./db/pool");
const { jwtSecret, serverConfig } = require("./config");
const diagnose = require("./db/diagnose");

try {
  // Fallar al iniciar si falta configuración, no después del primer login.
  const secret = jwtSecret();
  const { port, origins } = serverConfig();
  const db = createPool();
  const server = createApp({ db, secret, origins }).listen(port, () => console.log(`API: http://localhost:${port}`));
  server.on("error", (error) => {
    console.error(error.code === "EADDRINUSE" ? `[API] Puerto ${port} ocupado.` : "[API] Error de arranque.");
    process.exitCode = 1;
    db.end();
  });
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    server.close(() => db.end().catch(() => { process.exitCode = 1; }));
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
} catch (error) {
  console.error(diagnose(error));
  process.exitCode = 1;
}
