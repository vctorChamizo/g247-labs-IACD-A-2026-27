const pool = require("./db/pool");
const app = require("./app")(pool);
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("[CONFIG] PORT debe ser un puerto entre 1 y 65535.");
  process.exitCode = 1;
  pool.end();
  return;
}
const server = app.listen(port, () => console.log(`API: http://localhost:${port}`));
server.on("error", (error) => {
  console.error(error.code === "EADDRINUSE"
    ? `[API] Puerto ${port} ocupado. Detener la otra API o cambiar PORT en .env.`
    : `[API] No se pudo abrir el puerto (${error.code || "desconocido"}).`);
  process.exitCode = 1;
  pool.end();
});

// Cerrar el servidor también cierra el pool: Ctrl+C no deja conexiones abiertas.
function stop() {
  server.close(() => pool.end().catch(console.error));
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
