const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../src/config");

function main() {
  const secret = jwtSecret();
  // Identidad ficticia solo para este script; no es un endpoint para emitir tokens.
  const token = jwt.sign({ sub: 999999, role: "user" }, secret, { expiresIn: "1h" });
  console.log("1. Token firmado:", token);
  console.log("2. Payload legible sin secreto (decode NO autentica):", jwt.decode(token));
  console.log("3. Payload verificado:", jwt.verify(token, secret, { algorithms: ["HS256"] }));

  // Una firma modificada deja de ser válida. verify lanza un error.
  try {
    jwt.verify(token + "x", secret);
  } catch (error) {
    console.log("4. Token modificado:", error.name);
  }

  // Caducado desde su creación: no hay que esperar una hora ni introducir sleeps.
  const expired = jwt.sign({ sub: 999999, role: "user" }, secret, { expiresIn: -1 });
  try {
    jwt.verify(expired, secret);
  } catch (error) {
    console.log("5. Token caducado:", error.name, "La API responde 401.");
  }
}
try { main(); } catch (error) { console.error(error.code === "CONFIG" ? error.message : error.name); process.exitCode = 1; }
