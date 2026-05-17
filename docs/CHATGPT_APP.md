# ChatGPT App Publishing Plan

`out-of-black-ink` is currently a Python package and CLI. Publishing it as a ChatGPT App
requires a hosted Apps SDK integration around that converter.

## Current Best Fit

The first ChatGPT App version should expose a document conversion workflow:

1. User uploads a PDF in ChatGPT.
2. The app lets the user choose ink color, page range, render scale, threshold, and saturation.
3. The app converts the PDF using `out_of_black_ink.convert_pdf`.
4. The app returns a converted PDF for download.

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

## Suggested App Tools

Start with one tool:

```text
convert_pdf_to_color_ink
```

Inputs:

- `input_pdf`: uploaded PDF file
- `color`: target color in `#RRGGBB` format
- `pages`: optional comma-separated 1-based pages
- `scale`: render scale, default `2.8`
- `threshold`: brightness threshold, default `235`
- `max_saturation`: neutral gray saturation limit, default `38`

Output:

- Converted PDF file
- Short conversion summary, including page count and options used

## Review Readiness Checklist

- Keep the app focused on one clear job: recolor black and gray PDF content for printing.
- Make file handling explicit: PDFs are processed only to create the converted output.
- Return clear errors for encrypted, corrupted, or unsupported PDFs.
- Add size and page-count limits before public launch.
- Host the MCP server behind HTTPS with logs and metrics.
- Test the connector in ChatGPT after every metadata or tool-schema change.

## Repository Follow-Up

Recommended implementation path:

1. Add `apps/chatgpt/` with an MCP server wrapper around this Python package.
2. Add a minimal web component only if the file/options workflow feels better with UI controls.
3. Deploy the MCP endpoint to a host with reliable streaming support.
4. Connect it from ChatGPT, test with sample PDFs, then submit through the Apps SDK flow.
