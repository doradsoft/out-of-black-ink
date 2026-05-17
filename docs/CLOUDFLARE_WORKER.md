# Cloudflare Worker

This repository includes a Cloudflare Worker for the ChatGPT App endpoint.

Production URL after deployment:

<https://out-of-black-ink-mcp.doradsoft.workers.dev/>

## Why It Starts Disabled

The Worker used to start disabled. It now deploys with:

```toml
APP_DISABLED = "false"
```

That means:

- `/` and `/health` return deployment status.
- `/mcp` accepts JSON-RPC MCP requests.
- `open_pdf_recolor_app` opens the free client-side converter.
- No PDF conversion runs in the cloud.
- No OpenAI API calls are made.

This is intentional. The edge endpoint is active for ChatGPT metadata and widget rendering,
but public users cannot spend server-side PDF conversion compute because there is no
server-side conversion path.

## Budget Controls

The Worker currently enforces cheap request-level limits:

- `MAX_BODY_BYTES`: `1048576`
- `MAX_PDF_BYTES`: `10485760`
- `MAX_PAGES`: `20`

These are exposed in `/health` and shown in the ChatGPT widget. For future server-side PDF
conversion, keep Cloudflare as the gate and send accepted jobs to a fixed-size backend with
autoscaling disabled.

## GitHub Secrets

The deploy workflow requires these repository secrets:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

The token only needs Worker deploy permissions, such as:

```text
Developer Platform > Workers Scripts > Edit
```

## Deploy

Deploys run automatically when files under `apps/cloudflare-worker/` change on `master`.

You can also run the workflow manually:

```text
Actions > Cloudflare Worker > Run workflow
```

## ChatGPT Developer Mode

Use this URL:

```text
https://out-of-black-ink-mcp.doradsoft.workers.dev/mcp
```

The endpoint advertises:

- tool: `open_pdf_recolor_app`
- widget: `ui://widget/out-of-black-ink.html`
- privacy page: <https://doradsoft.github.io/out-of-black-ink/privacy.html>

## Emergency Disable

Set this in `apps/cloudflare-worker/wrangler.toml` and deploy:

```toml
APP_DISABLED = "true"
```

Use this if a ChatGPT integration behaves unexpectedly. Do not add server-side conversion until
the backend has:

- authentication or a shared access gate,
- per-user/day limits,
- global daily/monthly job limits,
- max file size and page count checks,
- immediate file deletion,
- an emergency kill switch.
