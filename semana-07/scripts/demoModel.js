const pool = require("../src/db/pool");
const model = require("../src/models/tasksModel")(pool);
const diagnose = require("../src/db/diagnose");

async function main() {
  // Primera demostración: una función JS produce filas mediante SELECT.
  console.table(await model.findAll());
  // Segunda: la relación users -> tasks se consulta con JOIN y un parámetro.
  console.table(await model.findForEmail("ana@example.com"));
  // Las comillas no se interpretan como SQL: no hay un usuario con este email.
  const rows = await model.findForEmail("' OR 1=1 --");
  console.log("Entrada tratada como dato; filas esperadas = 0; obtenidas =", rows.length);
}
main().catch((error) => {
  console.error(diagnose(error));
  process.exitCode = 1;
}).finally(() => pool.end());
