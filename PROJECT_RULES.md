# Project Rules

These rules describe how projects in this repo are structured. Codex will read this file and follow it whenever a new project or update is requested.

## Directory Layout

- Keep all projects under `projects/<project-name>/`.
- Project names use lowercase letters, numbers, and dashes (example: `stellar-lab`).
- Each project stays self-contained: HTML, CSS, JS, assets, and project-specific config live inside the project folder.
- Shared assets or tooling belong at the repo root under `shared/` (create as needed).

## Required Files Inside Every Project

- `index.html` – main document and entry point.
- `styles.css` – project styles.
- `app.js` – main script; load through `<script type="module" src="app.js"></script>`.
- `README.md` – short description and manual steps (build/run/test).
- Optional folders: `assets/`, `data/`, `components/`.

## HTML Standards

- Use semantic landmarks (`<header>`, `<main>`, `<footer>`).
- Link styles via `<link rel="stylesheet" href="styles.css">`.
- Always include `<meta charset>` and responsive `<meta name="viewport">`.
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

1. Pick a name and create `projects/<project-name>/`.
2. Copy the contents of `templates/web-basic/` into the new folder.
3. Replace `{{PROJECT_NAME}}` placeholders.
4. Update the project `README.md` with setup/build instructions.
5. If extra tooling is required, encapsulate it within the project folder or document it.

## Updating Existing Projects

- Stay within the project folder unless work truly spans multiple projects.
- If behaviour changes, update the project `README.md`.
- Run or describe basic tests when touching interactive pieces.

## Scripts & Automation

- Put helper scripts under `scripts/`.
- Scripts should accept a project name argument and avoid destructive operations by default.

Following this playbook keeps every experiment isolated and predictable.
