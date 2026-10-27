const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID, randomBytes } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const vm = require("node:vm");
const { Client, Pool } = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { databaseConfig } = require("../src/config");
const createApp = require("../src/app");
const migrate = require("../src/db/migrate");
const { seed, DEMO_PASSWORD } = require("../db/seed");

test("PostgreSQL real: recorrido de autenticación, permisos y validación", { timeout: 90000 }, async (t) => {
  const config = databaseConfig();
  const name = `g247_w8_${randomUUID().replaceAll("-", "")}`;
  const url = new URL(config.connectionString);
  url.pathname = "/postgres";
  const admin = new Client({ ...config, connectionString: url.href });
  const secret = randomBytes(32).toString("hex");
  let db, server, created = false, base;
  let ana, luis, anaToken, luisToken, anaTask, luisTask;
  await admin.connect();
  function command(file, args = [], overrides = {}) {
    return spawnSync(process.execPath, [path.join(__dirname, "..", file), ...args], {
      env: { ...process.env, DATABASE_URL: url.href, JWT_SECRET: secret, ...overrides }, encoding: "utf8", timeout: 20000,
    });
  }
  async function request(route, { method = "GET", token, body, headers = {} } = {}) {
    return fetch(base + route, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }
  async function start() {
    server = createApp({ db, secret, requestLimit: 1000 }).listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    base = `http://127.0.0.1:${server.address().port}`;
  }
  try {
    url.pathname = `/${name}`;
    const result = command("scripts/createDatabase.js");
    assert.equal(result.status, 0, result.stderr);
    created = true;
    db = new Pool({ ...config, connectionString: url.href });

    await t.test("Comandos de creación/check y DB vacía", () => {
      assert.equal(command("scripts/createDatabase.js").status, 0);
      const check = command("scripts/database.js", ["check"]);
      assert.equal(check.status, 1);
      assert.match(check.stderr, /42P01/);
      const absent = new URL(url); absent.pathname += "_missing";
      assert.match(command("scripts/database.js", ["check"], { DATABASE_URL: absent.href }).stderr, /3D000/);
    });
    await t.test("Protege una base anterior sin historial; rollback conserva datos", async () => {
      await db.query("CREATE TABLE users (id INTEGER)");
      await db.query("INSERT INTO users VALUES (123)");
      await assert.rejects(migrate(db), { code: "CONFIG" });
      assert.equal((await db.query("SELECT id FROM users")).rows[0].id, 123);
      await db.query("DROP TABLE users"); // Solo la tabla creada por este test aislado.
    });
    await t.test("Migraciones SQL y seed repetibles, contraseñas hasheadas", async () => {
      assert.equal((await migrate(db, { status: true })).pending.length, 2);
      assert.equal((await migrate(db)).appliedNow.length, 2);
      assert.equal((await migrate(db)).appliedNow.length, 0);
      await seed(db); await seed(db);
      assert.equal((await db.query("SELECT count(*)::int AS n FROM tasks")).rows[0].n, 10);
      const users = (await db.query("SELECT * FROM users ORDER BY email")).rows;
      [ana, luis] = users;
      assert.equal(users.length, 2);
      for (const user of users) {
        assert.notEqual(user.password_hash, DEMO_PASSWORD);
        assert.equal(bcrypt.getRounds(user.password_hash), 10);
        assert.equal(await bcrypt.compare(DEMO_PASSWORD, user.password_hash), true);
      }
      const tasks = (await db.query("SELECT id, user_id FROM tasks ORDER BY id")).rows;
      anaTask = tasks.find((row) => row.user_id === ana.id).id;
      luisTask = tasks.find((row) => row.user_id === luis.id).id;
      const check = command("scripts/database.js", ["check"]);
      assert.equal(check.status, 0, check.stderr);
      assert.match(check.stdout, /OK 3\/3/);
    });
    await start();
    await t.test("Salud pública y rutas protegidas sin token: 401", async () => {
      assert.equal((await request("/health")).status, 200);
      assert.equal((await request("/health/db")).status, 200);
      for (const [route, method] of [["/tasks", "GET"], ["/tasks", "POST"], [`/tasks/${anaTask}`, "GET"], [`/tasks/${anaTask}`, "PUT"], [`/tasks/${anaTask}`, "DELETE"]]) {
        assert.equal((await request(route, { method })).status, 401);
      }
    });
    await t.test("Login real, payload mínimo, firma y caducidad de una hora", async () => {
      for (const [user, set] of [[ana, (token) => { anaToken = token; }], [luis, (token) => { luisToken = token; }]]) {
        const response = await request("/auth/login", { method: "POST", body: { email: user.email, password: DEMO_PASSWORD } });
        assert.equal(response.status, 200);
        const body = await response.json();
        assert.deepEqual(Object.keys(body), ["token"]);
        const payload = jwt.verify(body.token, secret);
        assert.equal(payload.sub, user.id);
        assert.equal(payload.role, "user");
        assert.equal(payload.exp - payload.iat, 3600);
        assert.equal(Object.hasOwn(payload, "password_hash"), false);
        set(body.token);
      }
    });
    await t.test("Email desconocido y contraseña incorrecta producen el mismo 401", async () => {
      const bodies = [];
      for (const email of [ana.email, "unknown@example.com"]) {
        const response = await request("/auth/login", { method: "POST", body: { email, password: "Incorrecta8!" } });
        assert.equal(response.status, 401);
        bodies.push(await response.json());
      }
      assert.deepEqual(bodies[0], bodies[1]);
    });
    await t.test("Bearer estricto, token manipulado, caducado y algoritmo incorrecto", async () => {
      const parts = anaToken.split(".");
      parts[1] = Buffer.from(JSON.stringify({ ...jwt.decode(anaToken), sub: luis.id })).toString("base64url");
      const tokens = [parts.join("."), jwt.sign({ sub: ana.id, role: "user" }, secret, { expiresIn: -1 }), jwt.sign({ sub: ana.id, role: "user" }, secret, { algorithm: "HS384", expiresIn: "1h" })];
      for (const token of tokens) assert.equal((await request("/tasks", { token })).status, 401);
      for (const header of [anaToken, `Basic ${anaToken}`, `Bearer ${anaToken} extra`]) {
        assert.equal((await request("/tasks", { headers: { Authorization: header } })).status, 401);
      }
    });
    await t.test("Propiedad: propia 200, ajena 403 e inexistente 404", async () => {
      assert.equal((await request(`/tasks/${anaTask}`, { token: anaToken })).status, 200);
      for (const [method, body] of [["GET", undefined], ["PUT", { title: "Intrusión", done: true }], ["PATCH", { done: true }], ["DELETE", undefined]]) {
        assert.equal((await request(`/tasks/${luisTask}`, { method, body, token: anaToken })).status, 403);
      }
      assert.equal((await request("/tasks/2147483647", { token: anaToken })).status, 404);
      assert.equal((await request(`/tasks/${luisTask}`, { token: luisToken })).status, 200);
    });
    await t.test("CRUD completo; no suplantar propietario y no exponer seed_key", async () => {
      assert.equal((await request("/tasks", { method: "POST", token: anaToken, body: { title: "X", userId: luis.id } })).status, 400);
      const response = await request("/tasks", { method: "POST", token: anaToken, body: { title: "  Revisión de O'Reilly 🔑  " } });
      assert.equal(response.status, 201);
      const task = await response.json();
      assert.deepEqual(Object.keys(task).sort(), ["done", "id", "title", "userId"]);
      assert.equal(task.userId, ana.id); assert.equal(task.done, false);
      assert.equal(response.headers.get("location"), `/tasks/${task.id}`);
      assert.equal((await request(`/tasks/${task.id}`, { method: "PUT", token: anaToken, body: { title: "Completa", done: false } })).status, 200);
      const patch = await request(`/tasks/${task.id}`, { method: "PATCH", token: anaToken, body: { done: true } });
      assert.equal((await patch.json()).done, true);
      assert.equal((await request(`/tasks/${task.id}`, { method: "DELETE", token: anaToken })).status, 204);
      assert.equal((await request(`/tasks/${task.id}`, { token: anaToken })).status, 404);
    });
    await t.test("Páginas estables y solo del propietario; límites y entradas no enteras", async () => {
      const first = await (await request("/tasks?page=1&limit=2", { token: anaToken })).json();
      const second = await (await request("/tasks?page=2&limit=2", { token: anaToken })).json();
      assert.equal(first.items.length, 2); assert.equal(second.items.length, 2);
      assert.equal(first.items.some((a) => second.items.some((b) => a.id === b.id)), false);
      for (const task of [...first.items, ...second.items]) assert.equal(task.userId, ana.id);
      const all = await (await request("/tasks?limit=999&page=0", { token: anaToken })).json();
      assert.equal(all.page, 1); assert.equal(all.limit, 100); assert.equal(all.items.length, 7);
      for (const query of ["page=2abc", "page=2.7", "page=1&page=2"]) {
        assert.equal((await (await request(`/tasks?${query}`, { token: anaToken })).json()).page, 1);
      }
      assert.equal((await (await request("/tasks?page=999", { token: anaToken })).json()).items.length, 0);
    });
    await t.test("Registro: sin hash/rol en respuesta, duplicados y carreras -> 409", async () => {
      const body = { email: "nuevo@example.com", password: "RegistroSeguro8!" };
      const responses = await Promise.all([request("/auth/register", { method: "POST", body }), request("/auth/register", { method: "POST", body })]);
      assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
      const user = await responses.find((r) => r.status === 201).json();
      assert.deepEqual(Object.keys(user).sort(), ["email", "id"]);
      assert.equal((await request("/auth/register", { method: "POST", body: { ...body, email: "admin@example.com", role: "admin" } })).status, 400);
      assert.equal((await request("/auth/register", { method: "POST", body: { email: "unicode@example.com", password: "🔑".repeat(20) } })).status, 400);
    });
    await t.test("Zod y JSON: 400 antes de insertar; cuerpo excesivo -> 413", async () => {
      const before = (await db.query("SELECT count(*) AS n FROM tasks")).rows[0].n;
      for (const body of [{}, { title: "  " }, { title: 42 }, { title: "X", done: "false" }]) {
        assert.equal((await request("/tasks", { method: "POST", token: anaToken, body })).status, 400);
      }
      const malformed = await fetch(base + "/tasks", { method: "POST", headers: { Authorization: `Bearer ${anaToken}`, "Content-Type": "application/json" }, body: '{"title":' });
      assert.equal(malformed.status, 400);
      assert.equal((await request("/tasks", { method: "POST", token: anaToken, body: { title: "x".repeat(110000) } })).status, 413);
      assert.equal((await db.query("SELECT count(*) AS n FROM tasks")).rows[0].n, before);
      assert.equal((await request("/tasks/abc", { token: anaToken })).status, 400);
    });
    await t.test("CORS: preflight sin token; Postman/fetch Node no bloquean origen ajeno", async () => {
      const allowed = await request("/tasks", { method: "OPTIONS", headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization" } });
      assert.equal(allowed.status, 204);
      assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");
      const other = await request("/health", { headers: { Origin: "http://localhost:5174" } });
      assert.equal(other.status, 200);
      assert.equal(other.headers.get("access-control-allow-origin"), null);
    });
    await t.test("SQL parametrizado y restricciones reales", async () => {
      const usersModel = require("../src/models/usersModel")(db);
      assert.equal(await usersModel.findByEmail("' OR 1=1 --"), undefined);
      await assert.rejects(db.query("INSERT INTO tasks (user_id,title) VALUES (-1,'X')"), { code: "23503" });
      await assert.rejects(db.query("INSERT INTO tasks (user_id,title) VALUES ($1,'   ')", [ana.id]), { code: "23514" });
    });
    await t.test("Reiniciar HTTP conserva tareas y token; esquema incompatible -> 503", async () => {
      await new Promise((resolve) => server.close(resolve));
      await start();
      assert.equal((await request(`/tasks/${anaTask}`, { token: anaToken })).status, 200);
      await db.query("ALTER TABLE users RENAME COLUMN password_hash TO password_hash_test");
      try {
        assert.equal((await request("/health")).status, 200);
        assert.equal((await request("/health/db")).status, 503);
      } finally {
        await db.query("ALTER TABLE users RENAME COLUMN password_hash_test TO password_hash");
      }
    });
    await t.test("Scripts aislados JWT, hash, validación y seguridad ejecutables", () => {
      for (const file of ["demos/01-jwt.js", "demos/02-hash.js", "demos/03-validation.js", "demos/04-security.js"]) {
        const result = command(file);
        assert.equal(result.status, 0, `${file}: ${result.stderr}`);
      }
    });
    await t.test("Colección Postman completa: peticiones, variables y assertions", async () => {
      const collection = JSON.parse(fs.readFileSync(path.join(__dirname, "../postman/Semana-08.postman_collection.json"), "utf8"));
      const variables = new Map(collection.variable.map(({ key, value }) => [key, value]));
      variables.set("baseUrl", base);
      const render = (value) => value.replace(/\{\{(\w+)\}\}/g, (_, key) => variables.get(key));
      let count = 0;
      for (const folder of collection.item) {
        for (const item of folder.item) {
          const pm = { collectionVariables: { get: (key) => variables.get(key), set: (key, value) => variables.set(key, value) }, test: (label, action) => action() };
          for (const event of item.event.filter((event) => event.listen === "prerequest")) {
            vm.runInNewContext(event.script.exec.join("\n"), { pm }, { timeout: 1000 });
          }
          const response = await fetch(render(item.request.url), {
            method: item.request.method,
            headers: Object.fromEntries(item.request.header.map(({ key, value }) => [key, render(value)])),
            ...(item.request.body ? { body: render(item.request.body.raw) } : {}),
          });
          const text = await response.text();
          pm.response = {
            json: () => JSON.parse(text), headers: response.headers,
            to: { have: { status: (expected) => assert.equal(response.status, expected, item.name) } },
          };
          for (const event of item.event.filter((event) => event.listen === "test")) {
            vm.runInNewContext(event.script.exec.join("\n"), { pm }, { timeout: 1000 });
          }
          count++;
        }
      }
      console.log(`Colección verificada: ${count} peticiones.`);
    });
  } finally {
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
    if (db) await db.end();
    if (created) await admin.query(`DROP DATABASE "${name}"`);
    await admin.end();
  }
});
