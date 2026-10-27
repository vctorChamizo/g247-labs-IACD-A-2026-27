const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const pagination = require("../src/utils/pagination");
const { credentialsSchema, createTaskSchema, replaceTaskSchema } = require("../src/validators/schemas");

test("Paginación: cadena entera, defaults y límites", () => {
  assert.deepEqual(pagination({}), { page: 1, limit: 20, offset: 0 });
  assert.deepEqual(pagination({ page: "2", limit: "3" }), { page: 2, limit: 3, offset: 3 });
  for (const page of ["2abc", "2.7", "Infinity", "", ["1", "2"], {}]) {
    assert.equal(pagination({ page }).page, 1);
  }
  assert.equal(pagination({ page: "0" }).page, 1);
  assert.equal(pagination({ limit: "999" }).limit, 100);
  assert.equal(pagination({ page: "999999" }).page, 100000);
});

test("Zod: trim, booleanos, claves permitidas y bytes de bcrypt", () => {
  assert.deepEqual(createTaskSchema.parse({ title: "  Tarea  " }), { title: "Tarea", done: false });
  for (const value of [{ title: "  " }, { title: 123 }, { title: "X", done: "false" }, { title: "X", userId: 2 }]) {
    assert.equal(createTaskSchema.safeParse(value).success, false);
  }
  assert.equal(replaceTaskSchema.safeParse({ title: "X" }).success, false);
  const email = "ana@example.com";
  assert.equal(credentialsSchema.safeParse({ email, password: "a".repeat(72) }).success, true);
  assert.equal(credentialsSchema.safeParse({ email, password: "a".repeat(73) }).success, false);
  assert.equal(credentialsSchema.safeParse({ email, password: "🔑".repeat(20) }).success, false);
  assert.equal(credentialsSchema.safeParse({ email, password: "AulaSegura8!", role: "admin" }).success, false);
});

test("El servidor no arranca sin secretos/configuración ni con puerto inválido", () => {
  const run = (changes) => spawnSync(process.execPath, [path.join(__dirname, "../src/server.js")], {
    env: { ...process.env, DATABASE_URL: "postgresql://u:p@127.0.0.1/demo", JWT_SECRET: "x".repeat(64), ...changes }, encoding: "utf8", timeout: 5000,
  });
  for (const [changes, expected] of [[{ JWT_SECRET: "" }, /JWT_SECRET/], [{ DATABASE_URL: "" }, /DATABASE_URL/], [{ PORT: "abc" }, /PORT/]]) {
    const result = run(changes);
    assert.equal(result.status, 1);
    assert.match(result.stderr, expected);
    assert.equal(result.stderr.includes("postgresql://u:p"), false);
  }
});
