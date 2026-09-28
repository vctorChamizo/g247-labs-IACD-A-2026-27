---
name: api-test-conventions
description: Conventions for writing automated tests for the Express tasks API. Use whenever tests for an HTTP route of this project are written or reviewed.
---

# API test conventions

These rules make every test in this project look the same, no matter who (or which agent) writes it.

## Tools

- Use only the Node.js built-in test runner: `node:test` and `node:assert/strict`.
- Do not install any new dependency.
- Send requests with the global `fetch` function.

## File layout

- Put tests in the `tests/` folder.
- Create one file per resource: `tests/health.test.js`, `tests/tasks.test.js`, and so on.
- Tests are run with `npm test`.

## Starting the API inside a test

Import `src/app.js`, never `src/server.js`. Start the app on port `0` so the operating system picks a free port, and close it at the end:

```js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/app");

let server;
let baseUrl;

before(() => {
  server = app.listen(0);
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => {
  server.close();
});
```

## Writing each test

- The test name starts with the HTTP method and the path: `"GET /tasks returns all tasks"`.
- Check the status code first, then the body.
- Each test checks one behaviour only.
- For every route, write at least one test for the expected case.

## Example

```js
test("GET /health returns status ok", async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { status: "ok" });
});
```
