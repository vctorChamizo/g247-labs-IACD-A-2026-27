const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { Client, Pool } = require("pg");
const { migrate, seed } = require("../src/db/migrations");
const databaseConfig = require("../src/db/config");
const createApp = require("../src/app");
const createModel = require("../src/models/tasksModel");

test("PostgreSQL real: migraciones, restricciones y API", async (t) => {
  const config = databaseConfig();
  const name = `g247_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Client({ ...config, database: "postgres" });
  let db;
  let server;
  let created = false;
  await admin.connect();
  try {
    // Solo se elimina el nombre aleatorio creado por esta prueba, nunca la DB
    // indicada en PGDATABASE. Las migraciones se prueban desde una DB vacía.
    await admin.query(`CREATE DATABASE "${name}"`);
    created = true;
    db = new Pool({ ...config, database: name });
    await t.test("Conectar no significa tener esquema", async () => {
      assert.equal((await db.query("SELECT 1 AS n")).rows[0].n, 1);
      await assert.rejects(db.query("SELECT * FROM tasks"), { code: "42P01" });
    });
    await t.test("Aplicar por pasos y evolucionar filas existentes", async () => {
      await migrate(db, { step: true });
      await migrate(db, { step: true });
      const user = (await db.query("INSERT INTO users (email) VALUES ($1) RETURNING id", ["previo@example.com"])).rows[0];
      await db.query("INSERT INTO tasks (title, user_id) VALUES ($1, $2)", ["Existía antes de priority", user.id]);
      await assert.rejects(db.query("SELECT priority FROM tasks"), { code: "42703" });
      await migrate(db, { step: true });
      assert.equal((await db.query("SELECT priority FROM tasks")).rows[0].priority, "normal");
      assert.equal((await migrate(db)).appliedNow.length, 0);
    });
    await t.test("Seed repetible, FK, UNIQUE y CHECK", async () => {
      await seed(db);
      const before = (await db.query("SELECT count(*) FROM tasks")).rows[0].count;
      await seed(db);
      assert.equal((await db.query("SELECT count(*) FROM tasks")).rows[0].count, before);
      await assert.rejects(db.query("INSERT INTO users (email) VALUES ($1)", ["ana@example.com"]), { code: "23505" });
      await assert.rejects(db.query("INSERT INTO tasks (title, user_id) VALUES ('X', -1)"), { code: "23503" });
      await assert.rejects(db.query("INSERT INTO tasks (title, user_id) SELECT '', id FROM users LIMIT 1"), { code: "23514" });
    });
    server = createApp(db).listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(url, method = "GET", body) {
      return fetch(base + url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    }
    await t.test("CRUD HTTP, DTO, JOIN y parametrización", async () => {
      assert.equal((await request("/health/db")).status, 200);
      const userId = (await db.query("SELECT id FROM users WHERE email=$1", ["ana@example.com"])).rows[0].id;
      const response = await request("/tasks", "POST", { title: "Prueba persistida", done: false, userId });
      assert.equal(response.status, 201);
      const task = await response.json();
      assert.equal(response.headers.get("location"), `/tasks/${task.id}`);
      assert.equal(Object.hasOwn(task, "internal_note"), false);
      assert.equal(task.priority, "normal");
      assert.equal((await request(`/tasks/${task.id}`)).status, 200);
      const replaced = await request(`/tasks/${task.id}`, "PUT", { title: "Reemplazada", done: false, userId });
      assert.equal((await replaced.json()).title, "Reemplazada");
      const changed = await request(`/tasks/${task.id}`, "PATCH", { done: true });
      assert.equal((await changed.json()).done, true);
      const model = createModel(db);
      assert.equal((await model.findForEmail("ana@example.com")).length, 3);
      assert.deepEqual(await model.findForEmail("' OR 1=1 --"), []);
      assert.equal((await request(`/tasks/${task.id}`, "DELETE")).status, 204);
      assert.equal((await request(`/tasks/${task.id}`)).status, 404);
    });
    await t.test("Errores HTTP claros y health independiente", async () => {
      assert.equal((await request("/tasks", "POST", { title: "X", done: false, userId: 2147483647 })).status, 400);
      assert.equal((await request("/tasks", "POST", { title: "" })).status, 400);
      assert.equal((await request("/tasks/abc")).status, 400);
      assert.equal((await request("/tasks/2147483647", "DELETE")).status, 404);
      assert.equal((await request("/unknown")).status, 404);
      for (const id of ["0", "-1", "1.5", "2147483648", "1%20OR%201=1"]) {
        assert.equal((await request(`/tasks/${id}`)).status, 400);
      }
      for (const body of [null, {}, { title: "  ", done: false, userId: 1 }, { title: "X", done: "false", userId: 1 }, { title: "X", done: false, userId: "1" }]) {
        assert.equal((await request("/tasks", "POST", body)).status, 400);
      }
      assert.equal((await request("/tasks/1", "PUT", { done: false })).status, 400);
      for (const body of [{}, { done: "true" }, { title: "X" }, { done: true, title: "X" }]) {
        assert.equal((await request("/tasks/1", "PATCH", body)).status, 400);
      }
      const malformed = await fetch(base + "/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"title":' });
      assert.equal(malformed.status, 400);
      assert.equal(typeof (await malformed.json()).error, "string");
      await db.query("ALTER TABLE tasks RENAME COLUMN priority TO priority_test");
      assert.equal((await request("/health")).status, 200);
      assert.equal((await request("/health/db")).status, 503);
      await db.query("ALTER TABLE tasks RENAME COLUMN priority_test TO priority");
    });
    await t.test("UTF-8, comillas y persistencia entre conexiones nuevas", async () => {
      const userId = (await db.query("SELECT id FROM users ORDER BY id LIMIT 1")).rows[0].id;
      const model = createModel(db);
      const title = "Revisión de O'Reilly: áéíóú, ñ y 🐘";
      const task = await model.create({ title, done: false, userId });
      const independent = new Pool({ ...config, database: name });
      try {
        assert.equal((await createModel(independent).findById(task.id)).title, title);
      } finally {
        await independent.end();
      }
      assert.equal(await model.remove(task.id), true);
      assert.equal(await model.remove(task.id), false);
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (db) await db.end();
    if (created) await admin.query(`DROP DATABASE "${name}"`);
    await admin.end();
  }
});
