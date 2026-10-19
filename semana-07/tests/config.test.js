const { test } = require("node:test");
const assert = require("node:assert/strict");
const databaseConfig = require("../src/db/config");
const diagnose = require("../src/db/diagnose");

test("Configuración: variables ausentes, puerto inválido y mensajes sin contraseña", () => {
  const original = { ...process.env };
  try {
    Object.assign(process.env, { PGHOST: "127.0.0.1", PGPORT: "5432", PGUSER: "postgres", PGPASSWORD: "valor_solo_de_test", PGDATABASE: "aula_web" });
    assert.equal(databaseConfig().port, 5432);
    delete process.env.PGDATABASE;
    assert.throws(databaseConfig, /Falta PGDATABASE/);
    process.env.PGDATABASE = "aula_web";
    for (const port of ["0", "65536", "texto", "5432.5"]) {
      process.env.PGPORT = port;
      assert.throws(databaseConfig, /PGPORT/);
    }
    assert.match(diagnose({ code: "CONFIG", message: "Falta PGDATABASE" }), /Falta PGDATABASE/);
    assert.match(diagnose({ code: "28P01", message: "valor_solo_de_test" }), /Contraseña incorrecta/);
    assert.equal(diagnose({ code: "28P01", message: "valor_solo_de_test" }).includes("valor_solo_de_test"), false);
    assert.match(diagnose({ errors: [{ code: "ECONNREFUSED" }] }), /Servidor parado/);
    assert.match(diagnose({ code: "42501" }), /CREATEDB/);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
  }
});
