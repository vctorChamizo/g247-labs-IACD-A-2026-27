// dotenv carga las variables definidas en el fichero .env antes de usar process.env.
require("dotenv").config();

const app = require("./app");

// Los valores de entorno son strings. Number() convierte PORT antes de pasarlo a app.listen.
const PORT = Number(process.env.PORT) || 3000;

// server.js es deliberadamente pequeño: abre el puerto e informa de la dirección.
app.listen(PORT, () => {
  console.log(`Tasks API listening on http://localhost:${PORT}`);
});
