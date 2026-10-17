const { describe, test, before, after } = require("node:test");
const assert = require("node:assert");

const dbUrl = process.env.DATABASE_URL;

// Safety rule: these tests create and delete rows, so they must only ever run
// against a local or CI database, never the Render database.
function getSkipReason() {
  if (!dbUrl) {
    if (process.env.CI) {
      throw new Error("DATABASE_URL must be set when running in CI");
    }
    return "DATABASE_URL not set (start a local test Postgres to run the API tests)";
  }
  const host = new URL(dbUrl).hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(`Refusing to run API tests against a non-local database: ${host}`);
  }
  return false;
}

const skip = getSkipReason();

describe("Tasks API", { skip }, () => {
  let server;
  let baseUrl;
  const createdIds = [];

  async function call(method, path, body, rawBody) {
    const options = { method, headers: {} };
    if (rawBody !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = rawBody;
    } else if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    const res = await fetch(baseUrl + path, options);
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  }

  async function createTask(title = "Test task", description) {
    const res = await call("POST", "/api/tasks", { title, description });
    assert.strictEqual(res.status, 201);
    createdIds.push(res.body.id);
    return res.body;
  }

  before(async () => {
    // Loaded here so the app (and its database pool) is only started when the suite runs.
    const app = require("../server/app");
    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    for (const id of createdIds) {
      await call("DELETE", `/api/tasks/${id}`);
    }
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  test("GET /api/health returns ok", async () => {
    const res = await call("GET", "/api/health");
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, { status: "ok" });
  });

  test("POST creates a task with the expected fields", async () => {
    const task = await createTask("Buy milk", "2 litres");
    assert.strictEqual(typeof task.id, "number");
    assert.strictEqual(task.title, "Buy milk");
    assert.strictEqual(task.description, "2 litres");
    assert.strictEqual(task.completed, false);
    assert.ok(!Number.isNaN(Date.parse(task.created_at)));
  });

  test("POST works without a description", async () => {
    const task = await createTask("No description");
    assert.strictEqual(task.title, "No description");
  });

  test("POST rejects a missing title", async () => {
    const res = await call("POST", "/api/tasks", { description: "no title" });
    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body, { error: "Title is required" });
  });

  test("POST rejects a whitespace-only title", async () => {
    const res = await call("POST", "/api/tasks", { title: "   " });
    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body, { error: "Title is required" });
  });

  test("POST rejects a non-string description", async () => {
    const res = await call("POST", "/api/tasks", { title: "Valid", description: 123 });
    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body, { error: "Description must be a string" });
  });

  test("POST rejects malformed JSON", async () => {
    const res = await call("POST", "/api/tasks", undefined, "{ not valid json");
    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body, { error: "Invalid JSON in request body" });
  });

  test("GET lists saved tasks, newest first", async () => {
    const older = await createTask("Older task");
    const newer = await createTask("Newer task");
    const res = await call("GET", "/api/tasks");
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    const ids = res.body.map((task) => task.id);
    assert.ok(ids.includes(older.id));
    assert.ok(ids.includes(newer.id));
    assert.ok(ids.indexOf(newer.id) < ids.indexOf(older.id));
  });

  test("PATCH updates the completed status", async () => {
    const task = await createTask("Finish report");
    const done = await call("PATCH", `/api/tasks/${task.id}`, { completed: true });
    assert.strictEqual(done.status, 200);
    assert.strictEqual(done.body.id, task.id);
    assert.strictEqual(done.body.completed, true);

    const undone = await call("PATCH", `/api/tasks/${task.id}`, { completed: false });
    assert.strictEqual(undone.status, 200);
    assert.strictEqual(undone.body.completed, false);
  });

  test("PATCH rejects a non-boolean completed value", async () => {
    const task = await createTask("Strict boolean");
    const res = await call("PATCH", `/api/tasks/${task.id}`, { completed: "yes" });
    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body, { error: "completed must be true or false" });
  });

  test("PATCH and DELETE reject invalid ids", async () => {
    for (const badId of ["abc", "0", "-1", "99999999999999999999"]) {
      const patch = await call("PATCH", `/api/tasks/${badId}`, { completed: true });
      assert.strictEqual(patch.status, 400, `PATCH ${badId}`);
      assert.deepStrictEqual(patch.body, { error: "Invalid task id" });

      const del = await call("DELETE", `/api/tasks/${badId}`);
      assert.strictEqual(del.status, 400, `DELETE ${badId}`);
      assert.deepStrictEqual(del.body, { error: "Invalid task id" });
    }
  });

  test("DELETE removes a task, and a second delete returns 404", async () => {
    const task = await createTask("Delete me");
    const first = await call("DELETE", `/api/tasks/${task.id}`);
    assert.strictEqual(first.status, 204);
    assert.strictEqual(first.body, null);

    const second = await call("DELETE", `/api/tasks/${task.id}`);
    assert.strictEqual(second.status, 404);
    assert.deepStrictEqual(second.body, { error: "Task not found" });
  });

  test("PATCH on a deleted task returns 404", async () => {
    const task = await createTask("Gone soon");
    await call("DELETE", `/api/tasks/${task.id}`);
    const res = await call("PATCH", `/api/tasks/${task.id}`, { completed: true });
    assert.strictEqual(res.status, 404);
    assert.deepStrictEqual(res.body, { error: "Task not found" });
  });
});
