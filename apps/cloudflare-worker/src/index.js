const JSON_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,mcp-protocol-version",
  "content-type": "application/json; charset=utf-8",
};

const DEFAULT_LIMITS = {
  maxBodyBytes: 1024 * 1024,
  maxPdfBytes: 10 * 1024 * 1024,
  maxPages: 20,
};

const json = (body, init = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      "cache-control": "no-store",
      ...(init.headers ?? {}),
    },
  });

const readNumber = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const readConfig = (env = {}) => ({
  disabled: env.APP_DISABLED !== "false",
  maxBodyBytes: readNumber(env.MAX_BODY_BYTES, DEFAULT_LIMITS.maxBodyBytes),
  maxPdfBytes: readNumber(env.MAX_PDF_BYTES, DEFAULT_LIMITS.maxPdfBytes),
  maxPages: readNumber(env.MAX_PAGES, DEFAULT_LIMITS.maxPages),
});

const publicStatus = (config) => ({
  service: "out-of-black-ink-mcp",
  status: config.disabled ? "disabled" : "ready",
  budgetControls: {
    maxRequestBodyBytes: config.maxBodyBytes,
    maxPdfBytes: config.maxPdfBytes,
    maxPages: config.maxPages,
    note: "The edge worker starts disabled and does not process PDFs until a guarded backend is added.",
  },
});

const rpcResult = (id, result) =>
  json({
    jsonrpc: "2.0",
    id,
    result,
  });

const rpcError = (id, code, message) =>
  json(
    {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
      },
    },
    { status: code === -32700 ? 400 : 200 }
  );

const handleMcp = async (request, config) => {
  if (config.disabled) {
    return json(
      {
        error: "service_disabled",
        message:
          "The MCP endpoint is deployed but disabled. Set APP_DISABLED=false after adding backend quotas.",
      },
      { status: 503 }
    );
  }

  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > config.maxBodyBytes) {
    return json(
      {
        error: "request_too_large",
        message: `Request body exceeds ${config.maxBodyBytes} bytes.`,
      },
      { status: 413 }
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return rpcError(null, -32700, "Invalid JSON.");
  }

  const { id = null, method, params = {} } = payload;
  if (method === "initialize") {
    return rpcResult(id, {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "out-of-black-ink",
        version: "0.1.0",
      },
    });
  }

  if (method === "tools/list") {
    return rpcResult(id, {
      tools: [
        {
          name: "conversion_status",
          description: "Report the current conversion limits and deployment status.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      ],
    });
  }

  if (method === "tools/call" && params.name === "conversion_status") {
    return rpcResult(id, {
      content: [
        {
          type: "text",
          text: JSON.stringify(publicStatus(config), null, 2),
        },
      ],
    });
  }

  return rpcError(id, -32601, `Unsupported MCP method: ${method}`);
};

export default {
  async fetch(request, env) {
    const config = readConfig(env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: JSON_HEADERS });
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json(publicStatus(config));
    }

    if (url.pathname === "/mcp") {
      if (request.method !== "POST") {
        return json({ error: "method_not_allowed" }, { status: 405 });
      }
      return handleMcp(request, config);
    }

    return json({ error: "not_found" }, { status: 404 });
  },
};
