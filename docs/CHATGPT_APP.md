# ChatGPT App Publishing Plan

`out-of-black-ink` is currently a Python package, a client-side web app, and a free
Cloudflare Worker MCP endpoint for ChatGPT Developer Mode.

The current free ChatGPT App path does not run PDF conversion on the server. The Cloudflare
Worker exposes the MCP endpoint and a ChatGPT widget that opens the GitHub Pages converter.
PDF conversion remains client-side in the user's browser.

## Current Best Fit

The first ChatGPT App version exposes a launch workflow:

1. User asks ChatGPT to open the PDF recolor app.
2. ChatGPT calls `open_pdf_recolor_app`.
3. The app renders a small widget.
4. The widget opens the GitHub Pages converter.
5. The user chooses a PDF locally in the browser and converts it without uploading it.

## Apps SDK Requirements

According to the OpenAI Apps SDK docs, a ChatGPT App needs:

- A Model Context Protocol (MCP) server that exposes the app's tools to ChatGPT.
- An optional web component if the app needs an embedded UI in ChatGPT.
- A deployed, stable HTTPS endpoint for `/mcp` before it can be connected and submitted.

Useful OpenAI docs:

- Apps SDK overview: <https://developers.openai.com/apps-sdk>
- Quickstart: <https://developers.openai.com/apps-sdk/quickstart>
- MCP server concept: <https://developers.openai.com/apps-sdk/concepts/mcp-server>
- Deploy guide: <https://developers.openai.com/apps-sdk/deploy>

## Live Developer Endpoint

Use this URL in ChatGPT Developer Mode:

```text
https://out-of-black-ink-mcp.doradsoft.workers.dev/mcp
```

Current tool:

- `open_pdf_recolor_app`: opens the free client-side converter.

Current widget:

- `ui://widget/out-of-black-ink.html`
- MIME type: `text/html;profile=mcp-app`
- Privacy policy: <https://doradsoft.github.io/out-of-black-ink/privacy.html>

## Validation

1. In ChatGPT, open `Settings > Apps & Connectors > Advanced settings`.
2. Enable Developer Mode.
3. Go to `Settings > Connectors`.
4. Create a connector with:

   ```text
   https://out-of-black-ink-mcp.doradsoft.workers.dev/mcp
   ```

5. In a new chat, ask:

   ```text
   Open the out-of-black-ink PDF recolor app.
   ```

Expected result: ChatGPT should discover the app, call `open_pdf_recolor_app`, and render the
widget with an `Open converter` button.

## Review Readiness Checklist

- Keep the app focused on one clear job: recolor black and gray PDF content for printing.
- Make file handling explicit: the free version processes PDFs in the user's browser.
- Keep the MCP server free of PDF processing until hard backend quotas exist.
- Host the MCP server behind HTTPS.
- Test the connector in ChatGPT after every metadata, tool-schema, or widget change.
- Keep the privacy policy up to date.

## Repository Follow-Up

Future server-side conversion path:

1. Add a backend with a fixed monthly cost and autoscaling disabled.
2. Put the Cloudflare Worker in front as the quota gate.
3. Add authentication or per-user quotas.
4. Add a server-side `convert_pdf_to_color_ink` tool only after cost controls are enforced.
