import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";

const request = (path, init = {}) => new Request(`https://example.com${path}`, init);

test("health endpoint reports disabled default", async () => {
  const response = await worker.fetch(request("/health"), {});
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.service, "out-of-black-ink-mcp");
  assert.equal(body.status, "disabled");
});

test("mcp endpoint is disabled by default", async () => {
  const response = await worker.fetch(
    request("/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    }),
    {}
  );
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error, "service_disabled");
});

test("mcp initialize works when explicitly enabled", async () => {
  const response = await worker.fetch(
    request("/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    }),
    { APP_DISABLED: "false" }
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.result.serverInfo.name, "out-of-black-ink");
});
