# 09 — MCP, Plugins, and Claude Code Setup

This document covers external tooling that helps Claude Code work on this project efficiently. None of it is strictly required — the project will build with just the basics — but the recommendations below cut friction noticeably.

## Claude Code skills (this repo)

Custom skills live under `.claude/skills/`. They're auto-discovered by Claude Code and loaded when their triggering description matches.

### Skills included

| Skill                | When it fires                                                                               | What it does                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shader-development` | Writing or modifying GLSL shaders, debugging visual output, adding a new `PostFXPipeline`.  | Loads the relevant chunks of `04-shaders-reference.md`, the Phaser PostFX docs, and a checklist for shader work (sRGB handling, two-pass setup, uniform updates). |
| `vue-component`      | Creating or refactoring a Vue 3 component.                                                  | Loads the conventions from `08-coding-standards.md`, the typed-defineProps pattern, and the layout primitives.                                                    |
| `eye-condition`      | Adding a new condition end-to-end (type + store field + sidebar panel + pipeline + shader). | Walks through the 6-step checklist: type → defaults → ranges → UI panel → pipeline → wire-up.                                                                     |

The skill files themselves are the canonical reference; check `.claude/skills/*/SKILL.md`.

## Claude Code slash commands

Custom commands live under `.claude/commands/`. Each is a markdown file; the filename (without extension) is the command name.

| Command                       | Purpose                                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/next-step`                  | Find the first unchecked step in `07-roadmap.md` and execute it according to CLAUDE.md's "How to work" section.        |
| `/implement-condition <name>` | Walk through adding a brand-new condition (use the `eye-condition` skill).                                             |
| `/audit-shaders`              | Review all `.frag.glsl` files for the common issues listed in `04-shaders-reference.md` (precision, sRGB, validation). |

## MCP servers — recommended

[Model Context Protocol](https://docs.claude.com/en/docs/agents-and-tools/mcp) servers give Claude Code extra abilities. None are required, but these pay off on this project:

### Filesystem MCP

The default — Claude Code has read/write access to the project directory anyway. No setup needed.

### GitHub MCP (recommended)

If you want Claude Code to open issues, manage labels, or fetch information about the repo state.

```bash
claude mcp add github -- npx -y @modelcontextprotocol/server-github
```

Set `GITHUB_PERSONAL_ACCESS_TOKEN` in your environment. Use cases here:

- Pre-populate issues from the v1.1 backlog in `07-roadmap.md`.
- Auto-create issues for each unchecked roadmap step (optional workflow).
- Read repo settings to verify the GH Pages base path matches what's in `vite.config.ts`.

### Fetch MCP (recommended for shader work)

Lets Claude Code fetch external URLs directly (Phaser docs, the references in `03-eye-conditions.md`).

```bash
claude mcp add fetch -- npx -y @modelcontextprotocol/server-fetch
```

Useful when iterating on a shader where the reference is online. Without it, Claude works from training-data knowledge or doc snippets you paste in.

### Puppeteer / Playwright MCP (optional)

For visual regression testing once the app is partially built. Not needed for v1 but useful if you want screenshots in the README or to spot-check that all conditions render.

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

### Skip these

- **Database MCPs** — no DB in this project.
- **Browser-control MCPs for non-test reasons** — overkill.
- **Slack / Linear / Notion MCPs** — out of scope unless you're using them for your own workflow.

## VS Code / editor extensions

These help humans contributing alongside Claude Code:

| Extension                      | Why                                                    |
| ------------------------------ | ------------------------------------------------------ |
| Volar (Vue Language Features)  | Vue 3 + TS support in the editor.                      |
| WebGL GLSL Editor (or similar) | GLSL syntax highlighting for `.glsl` and `.frag.glsl`. |
| ESLint, Prettier               | Lint/format integration.                               |

## Node and npm

- Node ≥ 20 (LTS). Older versions may work but aren't tested.
- npm is fine; pnpm or yarn work too if preferred. The lockfile is committed.

## Optional: GitHub Pages auto-deploy

The user explicitly opted out of CI/CD, but if they ever change their mind, this is the minimal workflow. Drop it in `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: docs }
      - id: deployment
        uses: actions/deploy-pages@v4
```

With this, GH Pages source becomes "GitHub Actions" instead of "Deploy from a branch", and the committed `docs/` folder becomes irrelevant. Don't add it unless asked.

## Local dev shortcuts

Add these to `package.json` scripts once the project is scaffolded:

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.vue",
    "format": "prettier --write .",
    "type-check": "vue-tsc --noEmit",
  },
}
```
