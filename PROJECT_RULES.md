# Project Rules

These rules describe how projects in this repo are structured. Codex will read this file and follow it whenever a new project or update is requested.

## Directory Layout

- Keep all projects under `projects/<project-name>/`.
- Project names use lowercase letters, numbers, and dashes (example: `stellar-lab`).
- Each project stays self-contained: source, assets, `package.json`, and configuration live inside the project folder.
- Shared utilities or tooling belong at the repo root under `shared/` (create as needed).

## Required Files Inside Every Project

- `package.json` and `package-lock.json` – define scripts and dependencies; must include a `dev` script that serves the project locally.
- `index.html` – main document and entry point.
- `styles.css` – project styles.
- `app.js` – main script; load through `<script type="module" src="app.js"></script>`.
- `README.md` – short description plus run/build/test instructions.
- `bs-config.json` (or equivalent) – dev-server configuration referenced by `npm run dev`.
- Optional folders: `src/`, `assets/`, `data/`, `components/`.

## HTML Standards

- Use semantic landmarks (`<header>`, `<main>`, `<footer>`).
- Link styles via `<link rel="stylesheet" href="styles.css">`.
- Always include `<meta charset>` and a responsive `<meta name="viewport">` tag.
- Keep inline scripts/styles out of HTML (put logic in `app.js`).

## CSS Standards

- Scope styling to the project (no global resets outside of the file).
- Prefer custom properties for shared colors and spacing.
- Organise styles top-down: variables ? layout ? components ? utilities.

## JavaScript Standards

- Use ES modules and `type="module"` entry scripts.
- Export an `init()` function and call it after `DOMContentLoaded` guard.
- Keep constants (selectors, key bindings, config) near the top.
- Add brief comments only when logic is not obvious.

## Adding a New Project

1. Run `scripts/new-project.ps1 -ProjectName <name>` from the repo root.
2. The script copies `templates/web-basic/`, replaces placeholders, and runs `npm install` for you.
3. Update the generated `README.md` with any project-specific notes.
4. Use `npm run dev` inside the project to start the local web server.
5. Keep additional tooling encapsulated within the project folder and documented.

## Updating Existing Projects

- Stay within the project folder unless work truly spans multiple projects.
- If behaviour changes, update the project `README.md` and ensure scripts still run.
- Run or describe basic tests when touching interactive pieces.

## Scripts & Automation

- Put helper scripts under `scripts/`.
- Scripts should accept a project name argument and avoid destructive operations by default.
- `scripts/new-project.ps1` is the canonical way to scaffold new work; update it if requirements evolve.

Following this playbook keeps every experiment isolated, installable, and ready to run with a single command.
