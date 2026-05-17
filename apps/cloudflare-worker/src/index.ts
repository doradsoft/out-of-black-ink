const APP_URL = "https://doradsoft.github.io/out-of-black-ink/";
const OPENAI_APPS_CHALLENGE_TOKEN = "QA_jrKd1qgD89vMtgC6uCO2desrkrL6t_KVaJfZHysE";
const WIDGET_URI = "ui://widget/out-of-black-ink.html";
const WIDGET_PATH = "/widget/out-of-black-ink.html";
const OPENAI_APPS_CHALLENGE_PATH = "/.well-known/openai-apps-challenge";

type Env = {
  APP_DISABLED?: string;
  MAX_BODY_BYTES?: string;
  MAX_PAGES?: string;
  MAX_PDF_BYTES?: string;
};

type Config = {
  disabled: boolean;
  maxBodyBytes: number;
  maxPages: number;
  maxPdfBytes: number;
};

type JsonRpcPayload = {
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
};

type JsonRpcId = number | string | null;

const JSON_HEADERS: HeadersInit = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,mcp-protocol-version",
  "content-type": "application/json; charset=utf-8",
};

const DEFAULT_LIMITS = {
  maxBodyBytes: 32 * 1024,
  maxPdfBytes: 10 * 1024 * 1024,
  maxPages: 20,
};

const json = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      "cache-control": "no-store",
      ...(init.headers ?? {}),
    },
  });

const html = (body: string, init: ResponseInit = {}): Response =>
  new Response(body, {
    ...init,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=300",
      "content-type": "text/html; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });

const text = (body: string, init: ResponseInit = {}): Response =>
  new Response(body, {
    ...init,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });

const readNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const readConfig = (env: Env = {}): Config => ({
  disabled: env.APP_DISABLED === "true",
  maxBodyBytes: readNumber(env.MAX_BODY_BYTES, DEFAULT_LIMITS.maxBodyBytes),
  maxPdfBytes: readNumber(env.MAX_PDF_BYTES, DEFAULT_LIMITS.maxPdfBytes),
  maxPages: readNumber(env.MAX_PAGES, DEFAULT_LIMITS.maxPages),
});

const readLimitedText = async (request: Request, maxBytes: number): Promise<string | null> => {
  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > maxBytes) {
    return null;
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(bytes);
};

const publicStatus = (config: Config) => ({
  service: "out-of-black-ink-mcp",
  status: config.disabled ? "disabled" : "ready",
  appUrl: APP_URL,
  mcpUrl: "https://out-of-black-ink-mcp.doradsoft.workers.dev/mcp",
  budgetControls: {
    maxRequestBodyBytes: config.maxBodyBytes,
    maxPdfBytes: config.maxPdfBytes,
    maxPages: config.maxPages,
    note: "PDF conversion runs in the user's browser; the Worker only serves MCP metadata.",
  },
});

const rpcResult = (id: JsonRpcId, result: unknown): Response =>
  json({
    jsonrpc: "2.0",
    id,
    result,
  });

const rpcError = (id: JsonRpcId, code: number, message: string): Response =>
  json(
    {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
      },
    },
    { status: code === -32700 ? 400 : 200 },
  );

const openConverterTool = () => ({
  name: "open_pdf_recolor_app",
  title: "Open PDF recolor app",
  description:
    "Open a free, client-side PDF recoloring app. It converts black and gray PDF content to color ink in the user's browser without uploading files to a server.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: {
      status: { type: "string" },
      appUrl: { type: "string" },
      maxPdfBytes: { type: "number" },
      maxPages: { type: "number" },
    },
    required: ["status", "appUrl", "maxPdfBytes", "maxPages"],
    additionalProperties: false,
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  _meta: {
    ui: {
      resourceUri: WIDGET_URI,
      visibility: ["model", "app"],
    },
    "openai/outputTemplate": WIDGET_URI,
    "openai/toolInvocation/invoking": "Opening converter",
    "openai/toolInvocation/invoked": "Converter ready",
    "openai/widgetAccessible": true,
  },
  securitySchemes: [{ type: "noauth" }],
});

const toolsList = () => ({
  tools: [
    {
      ...openConverterTool(),
      _meta: {
        ...openConverterTool()._meta,
        securitySchemes: [{ type: "noauth" }],
      },
    },
  ],
});

const widgetHtml = (config: Config): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>out-of-black-ink</title>
    <style>
      :root {
        color: #172026;
        background: #ffffff;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
      }

      main {
        display: grid;
        gap: 14px;
        padding: 18px;
      }

      h1 {
        margin: 0;
        font-size: 1.35rem;
        line-height: 1.2;
        letter-spacing: 0;
      }

      p {
        margin: 0;
        color: #4a5960;
        line-height: 1.5;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 4px;
      }

      button,
      a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        border-radius: 6px;
        padding: 8px 12px;
        border: 0;
        background: #0078aa;
        color: #ffffff;
        cursor: pointer;
        font: inherit;
        font-weight: 750;
        text-decoration: none;
      }

      .secondary {
        border: 1px solid #cbd7d1;
        background: #f5f7f4;
        color: #172026;
      }

      .limits {
        border-top: 1px solid #e3e9e4;
        padding-top: 12px;
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>out-of-black-ink</h1>
      <p>
        Convert black and gray PDF content to color ink. The converter runs in your browser,
        so PDF files are not uploaded to this app server.
      </p>
      <div class="actions">
        <button id="open-app" type="button">Open converter</button>
        <a class="secondary" href="${APP_URL}" target="_blank" rel="noreferrer">Open in browser</a>
      </div>
      <p class="limits">
        Suggested free limits: PDFs up to ${Math.round(config.maxPdfBytes / 1024 / 1024)} MB and
        ${config.maxPages} pages.
      </p>
    </main>
    <script>
      const appUrl = ${JSON.stringify(APP_URL)};
      const openApp = () => {
        if (window.openai?.openExternal) {
          window.openai.openExternal({ href: appUrl });
          return;
        }
        window.open(appUrl, "_blank", "noopener,noreferrer");
      };

      if (window.openai?.setOpenInAppUrl) {
        window.openai.setOpenInAppUrl({ href: appUrl });
      }

      document.querySelector("#open-app").addEventListener("click", openApp);
      window.openai?.notifyIntrinsicHeight?.();
    </script>
  </body>
</html>`;

const widgetResource = (config: Config) => ({
  contents: [
    {
      uri: WIDGET_URI,
      mimeType: "text/html;profile=mcp-app",
      text: widgetHtml(config),
      title: "out-of-black-ink",
      _meta: {
        ui: {
          prefersBorder: true,
          csp: {
            connectDomains: [],
            resourceDomains: [],
          },
          domain: "https://out-of-black-ink-mcp.doradsoft.workers.dev",
        },
        "openai/widgetDescription":
          "A small launcher for a free client-side PDF recoloring app.",
        "openai/widgetPrefersBorder": true,
        "openai/widgetCSP": {
          connect_domains: [],
          resource_domains: [],
          redirect_domains: ["https://doradsoft.github.io"],
        },
        "openai/widgetDomain": "https://out-of-black-ink-mcp.doradsoft.workers.dev",
      },
    },
  ],
});

const callOpenConverter = (id: JsonRpcId, config: Config): Response => {
  const structuredContent = {
    status: "ready",
    appUrl: APP_URL,
    maxPdfBytes: config.maxPdfBytes,
    maxPages: config.maxPages,
  };

  return rpcResult(id, {
    structuredContent,
    content: [
      {
        type: "text",
        text: `Open the PDF recolor app: ${APP_URL}`,
      },
    ],
    _meta: {
      ui: { resourceUri: WIDGET_URI },
      "openai/outputTemplate": WIDGET_URI,
      appUrl: APP_URL,
      limits: {
        maxPdfBytes: config.maxPdfBytes,
        maxPages: config.maxPages,
      },
    },
  });
};

const handleRpc = (payload: JsonRpcPayload, config: Config): Response => {
  const { id = null, method, params = {} } = payload;

  if (method === "notifications/initialized") {
    return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*" } });
  }

  if (config.disabled) {
    return json(
      {
        error: "service_disabled",
        message: "The MCP endpoint is deployed but disabled. Set APP_DISABLED=false to enable.",
      },
      { status: 503 },
    );
  }

  if (method === "initialize") {
    return rpcResult(id, {
      protocolVersion:
        typeof params.protocolVersion === "string"
          ? params.protocolVersion
          : "2024-11-05",
      capabilities: {
        tools: {},
        resources: {},
      },
      serverInfo: {
        name: "out-of-black-ink",
        version: "0.1.0",
      },
    });
  }

  if (method === "ping") {
    return rpcResult(id, {});
  }

  if (method === "tools/list") {
    return rpcResult(id, toolsList());
  }

  if (method === "resources/list") {
    return rpcResult(id, {
      resources: [
        {
          uri: WIDGET_URI,
          name: "out-of-black-ink widget",
          title: "out-of-black-ink",
          description: "Launcher widget for the client-side PDF recolor app.",
          mimeType: "text/html;profile=mcp-app",
        },
      ],
    });
  }

  if (method === "resources/templates/list") {
    return rpcResult(id, { resourceTemplates: [] });
  }

  if (method === "resources/read") {
    if (params.uri !== WIDGET_URI) {
      return rpcError(id, -32602, `Unknown resource URI: ${params.uri}`);
    }
    return rpcResult(id, widgetResource(config));
  }

  if (method === "prompts/list") {
    return rpcResult(id, { prompts: [] });
  }

  if (method === "tools/call") {
    if (params.name === "open_pdf_recolor_app") {
      return callOpenConverter(id, config);
    }
    if (params.name === "conversion_status") {
      return rpcResult(id, {
        structuredContent: publicStatus(config),
        content: [{ type: "text", text: JSON.stringify(publicStatus(config), null, 2) }],
      });
    }
    return rpcError(id, -32602, `Unknown tool: ${params.name}`);
  }

  return rpcError(id, -32601, `Unsupported MCP method: ${method}`);
};

const handleMcp = async (request: Request, config: Config): Promise<Response> => {
  const body = await readLimitedText(request, config.maxBodyBytes);
  if (body === null) {
    return json(
      {
        error: "request_too_large",
        message: `Request body exceeds ${config.maxBodyBytes} bytes.`,
      },
      { status: 413 },
    );
  }

  let payload;
  try {
    payload = JSON.parse(body) as JsonRpcPayload;
  } catch {
    return rpcError(null, -32700, "Invalid JSON.");
  }

  return handleRpc(payload, config);
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const config = readConfig(env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: JSON_HEADERS });
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json(publicStatus(config));
    }

    if (request.method === "GET" && url.pathname === OPENAI_APPS_CHALLENGE_PATH) {
      return text(OPENAI_APPS_CHALLENGE_TOKEN);
    }

    if (request.method === "GET" && url.pathname === WIDGET_PATH) {
      return html(widgetHtml(config));
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
