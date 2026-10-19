const pool = require("../src/db/pool");
const { migrate, seed } = require("../src/db/migrations");
const diagnose = require("../src/db/diagnose");

async function main() {
  if (process.argv.includes("--seed")) {
    await seed(pool);
    return console.log("[OK] Datos de ejemplo preparados.");
  }
  const result = await migrate(pool, {
    step: process.argv.includes("--step"),
    status: process.argv.includes("--status"),
  });
  for (const name of result.appliedNow) console.log("[APLICADA]", name);
  console.log("Aplicadas:", result.applied.length, "Pendientes:", result.pending.length);
  for (const name of result.pending) console.log("[PENDIENTE]", name);
}
main().catch((error) => {
  console.error(diagnose(error));
  process.exitCode = 1;
}).finally(() => pool.end());
