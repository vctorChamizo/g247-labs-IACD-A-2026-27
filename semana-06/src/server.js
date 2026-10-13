// dotenv carga las variables de .env antes de consultar process.env.
require("dotenv").config();

const app = require("./app");

const PORT = Number(process.env.PORT) || 3000;

// server.js solo abre el puerto. La aplicación se construye en app.js para poder reutilizarla y probarla.
app.listen(PORT, () => {
  console.log(`Tasks REST API listening on http://localhost:${PORT}`);
});
