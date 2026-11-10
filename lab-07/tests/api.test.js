const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { buildApp } = require("../src/app");

// These first tests do not need PostgreSQL. Extend this suite with a fake
// query(text, params) dependency to test register/login and task ownership.
const db = {
  async query() {
    throw new Error("Unexpected database access in an infrastructure test");
  },
};

test("health route is available", async () => {
  const response = await request(buildApp(db)).get("/health");
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ok" });
});

test.skip("task routes require a token — enable after implementing auth", async () => {
  const response = await request(buildApp(db)).get("/tasks").timeout(1000);
  assert.equal(response.status, 401);
});
