import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";

const request = (path, init = {}) => new Request(`https://example.com${path}`, init);

const rpc = (method, params = {}, id = 1) =>
  request("/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });

test("health endpoint reports ready when enabled", async () => {
  const response = await worker.fetch(request("/health"), { APP_DISABLED: "false" });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.service, "out-of-black-ink-mcp");
  assert.equal(body.status, "ready");
  assert.equal(body.appUrl, "https://doradsoft.github.io/out-of-black-ink/");
});

test("mcp endpoint can still be disabled with APP_DISABLED", async () => {
  const response = await worker.fetch(rpc("initialize"), { APP_DISABLED: "true" });
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error, "service_disabled");
});

test("mcp initialize works when explicitly enabled", async () => {
  const response = await worker.fetch(rpc("initialize"), { APP_DISABLED: "false" });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.result.serverInfo.name, "out-of-black-ink");
  assert.deepEqual(Object.keys(body.result.capabilities), ["tools", "resources"]);
});

test("tools list advertises ChatGPT app metadata", async () => {
  const response = await worker.fetch(rpc("tools/list"), { APP_DISABLED: "false" });
  const body = await response.json();
  const [tool] = body.result.tools;

  assert.equal(tool.name, "open_pdf_recolor_app");
  assert.equal(tool.annotations.readOnlyHint, true);
  assert.equal(tool._meta.ui.resourceUri, "ui://widget/out-of-black-ink.html");
  assert.equal(tool._meta["openai/outputTemplate"], "ui://widget/out-of-black-ink.html");
});

test("resources read returns an MCP app widget", async () => {
  const response = await worker.fetch(
    rpc("resources/read", { uri: "ui://widget/out-of-black-ink.html" }),
    { APP_DISABLED: "false" },
  );
  const body = await response.json();
  const [resource] = body.result.contents;

  assert.equal(resource.mimeType, "text/html;profile=mcp-app");
  assert.match(resource.text, /Open converter/);
  assert.equal(resource._meta.ui.domain, "https://out-of-black-ink-mcp.doradsoft.workers.dev");
});

test("open app tool call returns the public app URL", async () => {
  const response = await worker.fetch(
    rpc("tools/call", { name: "open_pdf_recolor_app", arguments: {} }),
    { APP_DISABLED: "false" },
  );
  const body = await response.json();

  assert.equal(body.result.structuredContent.status, "ready");
  assert.equal(body.result.structuredContent.appUrl, "https://doradsoft.github.io/out-of-black-ink/");
});
