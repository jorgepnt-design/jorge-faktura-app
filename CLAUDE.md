# CLAUDE.md

This file provides guidance for AI assistants working in this repository.

## Project Overview

**Jorge Faktura App** is a German-language invoicing (Faktura = invoice) web application. Currently it is a minimal static HTML starter scaffold — a single page that confirms the app is running. The intent is to grow this into a functional invoicing tool.

- **Language of UI:** German (`lang="de"`)
- **Stage:** Early scaffold / proof-of-concept
- **Origin:** Bootstrapped via Google AI Studio

## Current Repository Structure

```
jorge-faktura-app/
├── CLAUDE.md       # This file
├── README.md       # Project readme (AI Studio banner + link)
└── index.html      # Single-page HTML entry point
```

## Tech Stack

Currently **plain static HTML** with no build tooling, no framework, and no dependencies. Before adding any framework or toolchain, confirm the direction with the user — the project may stay lightweight or grow into a full-stack app.

### If/when the project evolves

Likely candidates to add based on the project purpose (invoicing app):
- **Frontend framework:** React, Vue, or plain HTML + Alpine.js (keep it simple)
- **Styling:** Tailwind CSS or plain CSS
- **Backend/API:** Node.js + Express, or a serverless approach
- **Database:** SQLite (local), PostgreSQL, or a hosted solution
- **PDF generation:** For invoice output (e.g., `pdfkit`, browser `print`)

Do not introduce dependencies without a clear need.

## Development Conventions

### Language
- UI text must be in **German**. All labels, messages, placeholders, and user-facing strings should use German.
- Code (variable names, functions, comments, commit messages) should be in **English**.

### HTML / Styling
- Prefer external CSS files over inline styles as the project grows.
- Keep the `lang="de"` attribute on `<html>`.
- Use semantic HTML5 elements.

### File Organization (once the project grows)
Follow a flat, simple structure unless complexity demands more:
```
index.html
css/
  main.css
js/
  app.js
assets/
  logo.svg
```

### Commits
- Write commit messages in English.
- Use the imperative mood: `Add invoice form`, not `Added invoice form`.
- Keep the first line under 72 characters.

## Running the App

No build step is required. Open `index.html` directly in a browser, or serve it with any static file server:

```bash
# Python (built-in)
python3 -m http.server 8080

# Node (npx)
npx serve .
```

## Testing

No test framework is configured. If tests are added, document the setup here and add an npm script.

## Environment Variables

None required at this time.

## Git Workflow

- **Main branch:** `main`
- Feature work is done on dedicated branches and merged via pull request.
- Do not push directly to `main`.

## What Not To Do

- Do not add dependencies speculatively. Only add what is actively needed.
- Do not convert to a framework without user direction.
- Do not change the UI language to English — all user-facing text must remain German.
- Do not add a build pipeline until the project needs one.
