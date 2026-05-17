# Cloudflare Worker

This repository includes a Cloudflare Worker scaffold for the future ChatGPT App endpoint.

Production URL after deployment:

<https://out-of-black-ink-mcp.doradsoft.workers.dev/>

## Why It Starts Disabled

The Worker deploys with:

```toml
APP_DISABLED = "true"
```

That means:

- `/` and `/health` return deployment status.
- `/mcp` returns `503 service_disabled`.
- No PDF conversion runs in the cloud.
- No OpenAI API calls are made.

This is intentional. The edge endpoint should exist before it is connected to ChatGPT, but
public users should not be able to spend compute until a quota-backed backend is added.

## Budget Controls

The Worker currently enforces cheap request-level limits:

- `MAX_BODY_BYTES`: `1048576`
- `MAX_PDF_BYTES`: `10485760`
- `MAX_PAGES`: `20`

These are exposed in `/health` and are ready to be enforced by the future conversion backend.
For real PDF conversion, keep Cloudflare as the gate and send accepted jobs to a fixed-size
backend with autoscaling disabled.

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

## Enabling `/mcp`

Do not enable `/mcp` for public use until the backend has:

- authentication or a shared access gate,
- per-user/day limits,
- global daily/monthly job limits,
- max file size and page count checks,
- immediate file deletion,
- an emergency kill switch.

When ready, change `APP_DISABLED` to `"false"` in
`apps/cloudflare-worker/wrangler.toml` and deploy again.
