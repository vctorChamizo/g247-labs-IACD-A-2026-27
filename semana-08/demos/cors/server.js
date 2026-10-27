const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

async function startPages(ports = [5173, 5174]) {
  const servers = [];
  try {
    for (const port of ports) {
      const server = http.createServer((req, res) => {
        // Solo dos archivos conocidos; no convertir la URL del cliente en una ruta.
        const file = req.url === "/" ? "index.html" : req.url === "/client.js" ? "client.js" : null;
        if (!file) { res.writeHead(404); return res.end("Not found"); }
        res.writeHead(200, { "Content-Type": file.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8" });
        res.end(fs.readFileSync(path.join(__dirname, file)));
      });
      servers.push(server);
      await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, resolve); });
    }
    return servers;
  } catch (error) {
    for (const server of servers) if (server.listening) server.close();
    throw error;
  }
}
if (require.main === module) {
  startPages().then((servers) => {
    console.log("CORS permitido: http://localhost:5173 | No permitido: http://localhost:5174");
    const stop = () => servers.forEach((server) => server.close());
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
  }).catch((error) => { console.error(`No se pudieron abrir los puertos de CORS: ${error.code}`); process.exitCode = 1; });
}
module.exports = startPages;
