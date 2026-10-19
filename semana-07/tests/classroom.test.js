const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { Client, Pool } = require("pg");
const config = require("../src/db/config");
const createApp = require("../src/app");

test("Recorrido de clase: comandos, SQL exportado y colección Postman", { timeout: 90000 }, async (t) => {
  const connection = config();
  const database = `g247_class_${randomUUID().replaceAll("-", "")}`;
  const cwd = path.join(__dirname, "..");
  const env = { ...process.env, PGDATABASE: database };
  const admin = new Client({ ...connection, database: "postgres" });
  let db;
  let server;
  let created = false;
  await admin.connect();

  function command(file, args = [], exit = 0, expected, changes = {}) {
    // process.execPath evita npm.cmd/bash y rutas de ejecutables distintas entre
    // sistemas. Se ejecutan los mismos JS que invocan los scripts npm del README.
    const result = spawnSync(process.execPath, [file, ...args], {
      cwd, env: { ...env, ...changes }, encoding: "utf8", timeout: 20000,
    });
    assert.equal(result.error, undefined);
    const output = result.stdout + result.stderr;
    assert.equal(result.status, exit, output);
    if (expected) assert.match(output, expected);
    return output;
  }
  try {
    await t.test("Crear DB, migrar por pasos, sembrar y comprobar", () => {
      command("scripts/checkDatabase.js", [], 1, /3D000/);
      command("scripts/createDatabase.js", [], 0, /Base creada/);
      created = true;
      command("scripts/createDatabase.js", [], 0, /ya existe/);
      command("scripts/checkDatabase.js", [], 1, /42P01/);
      command("scripts/migrate.js", ["--step"]);
      command("scripts/migrate.js", ["--step"]);
      command("scripts/checkDatabase.js", [], 1, /42703/);
      command("scripts/migrate.js", ["--step"]);
      command("scripts/migrate.js", [], 0, /Pendientes: 0/);
      command("scripts/migrate.js", ["--seed"]);
      command("scripts/checkDatabase.js", [], 0, /OK 3\/3/);
      command("scripts/demoModel.js", [], 0, /obtenidas = 0/);
      command("scripts/demoErrors.js", [], 0, /23514/);
      command("scripts/checkDatabase.js", ["--wrong-port"], 1, /ECONNREFUSED|EACCES|EPERM/);
      command("scripts/checkDatabase.js", [], 1, /Falta PGDATABASE/, { PGDATABASE: "" });
      command("scripts/checkDatabase.js", [], 1, /PGPORT debe ser/, { PGPORT: "incorrecto" });
    });
    db = new Pool({ ...connection, database });
    await t.test("Export SQL de referencia y consultas de pgAdmin válidos", async () => {
      const client = await db.connect();
      let inTransaction = false;
      try {
        await client.query("BEGIN");
        inTransaction = true;
        await client.query("CREATE SCHEMA reference_test");
        await client.query("SET LOCAL search_path TO reference_test");
        await client.query(readFileSync(path.join(cwd, "db/design/export-reference.sql"), "utf8"));
        await client.query("ROLLBACK");
        inTransaction = false;
        await client.query(readFileSync(path.join(cwd, "db/queries.sql"), "utf8"));
      } finally {
        if (inTransaction) await client.query("ROLLBACK");
        client.release();
      }
    });
    server = createApp(db).listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    const base = `http://127.0.0.1:${server.address().port}`;
    await t.test("Colección Postman: las 10 peticiones y sus assertions", async () => {
      const collection = JSON.parse(readFileSync(path.join(cwd, "postman/Semana-07.postman_collection.json"), "utf8"));
      const userId = (await db.query("SELECT id FROM users WHERE email=$1", ["ana@example.com"])).rows[0].id;
      const values = new Map(collection.variable.map(({ key, value }) => [key, value]));
      values.set("baseUrl", base);
      values.set("userId", userId);
      const render = (value) => value.replace(/\{\{(\w+)\}\}/g, (_, key) => values.get(key));
      for (const item of collection.item) {
        const request = item.request;
        const response = await fetch(render(request.url), {
          method: request.method,
          headers: Object.fromEntries(request.header.map(({ key, value }) => [key, value])),
          ...(request.body ? { body: render(request.body.raw) } : {}),
        });
        const body = await response.text();
        // El runner reproduce el subconjunto pm que usa esta colección. No
        // pretende verificar la interfaz gráfica de la aplicación Postman.
        const pm = {
          test: (label, callback) => callback(),
          response: { to: { have: { status: (status) => assert.equal(response.status, status, item.name) } }, json: () => JSON.parse(body) },
          collectionVariables: { set: (key, value) => values.set(key, value) },
        };
        for (const event of item.event) vm.runInNewContext(event.script.exec.join("\n"), { pm }, { timeout: 1000 });
      }
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (db) await db.end();
    if (created) await admin.query(`DROP DATABASE "${database}"`);
    await admin.end();
  }
});
