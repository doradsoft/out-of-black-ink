# ChatGPT App Validation

The free validation target is:

```text
https://out-of-black-ink-mcp.doradsoft.workers.dev/mcp
```

## MCP Protocol Checks

Health:

```bash
curl https://out-of-black-ink-mcp.doradsoft.workers.dev/health
```

Initialize:

```bash
curl -s https://out-of-black-ink-mcp.doradsoft.workers.dev/mcp \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

List tools:

```bash
curl -s https://out-of-black-ink-mcp.doradsoft.workers.dev/mcp \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

Read widget resource:

```bash
curl -s https://out-of-black-ink-mcp.doradsoft.workers.dev/mcp \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"resources/read","params":{"uri":"ui://widget/out-of-black-ink.html"}}'
```

Call tool:

```bash
curl -s https://out-of-black-ink-mcp.doradsoft.workers.dev/mcp \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"open_pdf_recolor_app","arguments":{}}}'
```

## ChatGPT Developer Mode

1. Open ChatGPT settings.
2. Go to `Apps & Connectors > Advanced settings`.
3. Enable Developer Mode.
4. Go to `Settings > Connectors`.
5. Create a connector with the MCP URL above.
6. Start a new chat and ask:

   ```text
   Open the out-of-black-ink PDF recolor app.
   ```

Expected result:

- ChatGPT discovers `open_pdf_recolor_app`.
- ChatGPT renders the out-of-black-ink widget.
- The widget opens the GitHub Pages converter.

## Positive Prompts

```text
Open the PDF recolor app.
```

```text
I need to print a PDF but my black cartridge is empty.
```

```text
Help me convert black text in a PDF to blue ink.
```

## Negative Prompts

The app should not be selected for these:

```text
Summarize this PDF.
```

```text
Edit the text inside this PDF.
```

```text
Translate this document.
```
