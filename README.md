**English** · [Español](README.es.md)

# Mailspring Claude Assistant

An unofficial plugin for [Mailspring](https://getmailspring.com/) that brings Claude (Anthropic)
straight into your email client: **summarize entire threads** and **improve your replies** before
sending them, without leaving the composer. Everything is processed as **plain text** — the plugin
never touches your emails' HTML.

<p align="center">
  <img src="docs/screenshots/demo.gif" width="850" alt="Plugin demo: thread summary and reply improvement in action">
</p>

> ⚠️ This is a personal, unofficial project, unaffiliated with Mailspring or Anthropic.
> It uses the Anthropic API with **your own** key (pay per use).

> 📷 **Note:** the screenshots and the demo GIF are currently in Spanish — the plugin's interface
> itself is in English (and follows Mailspring's language setting). English screenshots are on the
> way.

---

## Features

### ✳ Summarize thread

A panel that summarizes the whole conversation (including open action items), shown both in the
thread header and inside the composer while you write. Hit **Generate summary** and the result is
cached per thread: it shows up instantly when you come back, and if new messages arrive it prompts
you to regenerate. Collapse it whenever you don't need it.

<p align="center">
  <img src="docs/screenshots/resumen-hilo.png" width="850" alt="Generated thread summary, with controls to regenerate and hide, plus the summary metadata">
</p>

<p align="center"><em>The summary lives in the thread header (and in the composer too), sharing a single cached result.</em></p>

### ✳ Improve reply

Write your draft however it comes out, give it a free-form instruction ("make it more formal",
"shorten it", "translate it to English") and Claude proposes an improved version. You review it in a
preview and choose **Apply** or **Discard** — your signature and the quoted message stay untouched.

<p align="center">
  <img src="docs/screenshots/mejorar-respuesta.png" width="850" alt="Improve panel open with the draft loaded and the instruction field">
</p>

<p align="center"><em>1. Write your draft · 2. Open the improve panel · 3. Tell it in your own words what to change.</em></p>

<p align="center">
  <img src="docs/screenshots/mejorar-respuesta-preview.png" width="850" alt="Preview of the improved text with the Discard and Apply buttons">
</p>

<p align="center"><em>Claude shows you the result before touching anything: Apply inserts it, Discard leaves your draft alone.</em></p>

<p align="center">
  <img src="docs/screenshots/mejorar-respuesta-aplicado.png" width="850" alt="The improved text inserted into the message body, with the signature preserved">
</p>

<p align="center"><em>The improved text lands in the body, ready to send; your signature and the thread quote are preserved.</em></p>

### ✳ Interface language

The plugin follows Mailspring's own language setting (**Preferences → General → Interface
Language**). It currently ships translations for **English**, **Spanish**, **Portuguese** and
**Brazilian Portuguese**; any other language falls back to English. Translations are welcome —
see [Contributing](#contributing).

Summaries and improved replies are **not** affected by this setting: Claude follows the language of
the thread or draft itself, so a German email gets a German summary regardless of your interface
language.

---

## Requirements

- **Mailspring 1.22** or newer.
- An **Anthropic API key**, from [console.anthropic.com](https://console.anthropic.com) (pay per
  use). Recommended: set a monthly spending limit.

## Installation (users)

No coding or compiling needed — the plugin ships pre-built.

1. Go to **[Releases](https://github.com/cafeinablog/mailspring-claude-assistant/releases)** and
   download `mailspring-claude-assistant.zip` from the latest version.
2. Unzip it. You'll get a folder named `mailspring-claude-assistant`.
3. Move it into Mailspring's plugins folder, depending on your OS:
   - **Windows:** `%APPDATA%\Mailspring\packages`
   - **macOS:** `~/Library/Application Support/Mailspring/packages`
   - **Linux:** `~/.config/Mailspring/packages`

   (On Windows you can paste `%APPDATA%\Mailspring\packages` into the Explorer address bar to get
   there directly.)
4. **Restart Mailspring.**
5. Open **Preferences → Claude** and paste your API key. Done!

## Configuration

Everything lives in **Preferences → Claude**:

- **API key** — your Anthropic key.
- **Models** — which model to use for summarizing and for improving. For more detailed summaries,
  pick a higher-quality model; to save money, a cheaper one.
- **Default instruction** (optional) — text that comes pre-filled in the improve panel.

<p align="center">
  <img src="docs/screenshots/preferencias.png" width="850" alt="Claude tab in Preferences, with the masked API key, per-task models and the default instruction">
</p>

<p align="center"><em>The Claude tab in Preferences: your API key (masked), the model for each feature, and the default instruction.</em></p>

## Privacy and security

- Your API key is stored **in plain text** in Mailspring's local config (`config.json`), on your
  computer only. Mailspring offers no encrypted storage for plugins.
- The content of the emails you summarize or improve is sent to the Anthropic API for processing.
  See [Anthropic's privacy policy](https://www.anthropic.com/legal/privacy).
- Recommended: use an API key with a **spending limit** and, if you like, an expiry date.

---

## Development

The source lives in `src/` (TypeScript/JSX) and compiles to `lib/` (plain JavaScript, which is what
Mailspring actually loads and what's versioned in the repo — Mailspring doesn't transpile).

```bash
git clone https://github.com/cafeinablog/mailspring-claude-assistant.git
cd mailspring-claude-assistant
npm install
npm run build
```

For iterative development, link the repo into the plugins folder with a *junction* (Windows) or
*symlink*, and reload Mailspring with **Ctrl+Shift+R** after each `npm run build`:

```powershell
New-Item -ItemType Junction `
  -Path "$env:APPDATA\Mailspring\packages\mailspring-claude-assistant" `
  -Target (Get-Location)
```

### Adding a translation

All user-facing strings live in one file, [`src/i18n.js`](src/i18n.js). To add a language, copy the
`en` block, translate the values (keys stay untouched) and add it under its language code. Note
that Mailspring reports the full locale with region (`es-MX`, `pt-BR`, `es_419`), so an entry keyed
`pt` covers every Portuguese variant, while a specific `pt-BR` entry takes precedence over it when
the variants genuinely differ.

### Branches

- **`main`** — stable, published version (what's distributed in *Releases*).
- **`develop`** — work in progress. Changes land here and get promoted to `main` with a new version
  when ready.

## Contributing

Issues and suggestions are welcome at
[Issues](https://github.com/cafeinablog/mailspring-claude-assistant/issues). If you send a Pull
Request, target the `develop` branch.

## Project supervision

<p align="center">
  <img src="docs/screenshots/pinina-mailspring-claude-assistant.jpg" width="600" alt="Pinina, the project cat, sitting on her tower next to the development monitor">
</p>

<p align="center"><em>Pinina supervising development. All code was reviewed from her tower. 🐱</em></p>

## About Cafeina.Blog

This plugin is a side project of **[Cafeina.Blog](https://cafeina.blog)** — a personal project by
Daniel Yanes Arroyo dedicated to building tools and content that help businesses and entrepreneurs
optimize how they work: spreadsheet templates for financial planning, sales forecasting, expense
tracking and KPI measurement, plus a weekly blog on business, marketing and productivity.

Same idea behind both: practical tools, no unnecessary theory. (And yes — Pinina supervises over
there too.)

*Cafeina.Blog is published in Spanish.*

## License

[MIT](LICENSE)
