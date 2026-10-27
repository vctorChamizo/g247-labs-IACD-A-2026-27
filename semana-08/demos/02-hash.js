const bcrypt = require("bcryptjs");

async function main() {
  // Contraseña ficticia. await está dentro de async: el archivo es CommonJS.
  const password = "AulaSegura8!";
  const first = await bcrypt.hash(password, 10);
  const second = await bcrypt.hash(password, 10);
  console.log("1. Hash A:", first);
  console.log("2. Hash B:", second);
  console.log("3. Misma contraseña, distinta sal: los hashes difieren.");
  console.log("4. Contraseña correcta:", await bcrypt.compare(password, first));
  console.log("5. Contraseña incorrecta:", await bcrypt.compare("OtraContraseña8!", first));
  const unicode = "🔑".repeat(20);
  console.log("6. Ejemplo Unicode: length =", unicode.length, "; bytes UTF-8 =", Buffer.byteLength(unicode, "utf8"));
  console.log("   Supera 72 bytes: nuestra validación lo rechaza ANTES de bcrypt.");
}
main().catch(() => { console.error("[FALLO] No se completó la demostración de hash."); process.exitCode = 1; });
