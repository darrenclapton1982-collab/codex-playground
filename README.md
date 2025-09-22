# Codex Playground Monorepo

This repository holds multiple small experiments and prototypes. Each project lives in `projects/<project-name>/` and ships with its own HTML, CSS, JavaScript, and npm dev tooling so it can run locally with one command. Shared guidance and starter templates live at the top level so every new project starts consistent.

## Layout

- `projects/` – checked-in projects. Each folder is self-contained with its own `package.json`.
- `templates/` – boilerplates used when spinning up a new project.
- `scripts/` – helper scripts (e.g. `new-project.ps1`).
- `PROJECT_RULES.md` – the agreed playbook for structure and conventions.

## Creating a project

```
powershell.exe -ExecutionPolicy Bypass -File scripts/new-project.ps1 -ProjectName my-experiment
```

The script copies `templates/web-basic`, replaces placeholders, runs `npm install`, and prints the project path. Inside the project you can then do:

```
cd projects/my-experiment
npm run dev
```

This starts `lite-server` on port 5173 (configurable via `bs-config.json`). Open http://localhost:5173 in your browser to develop.

If you need a quick ad-hoc server for an existing folder you can still use:

```
powershell.exe -ExecutionPolicy Bypass -File scripts/serve.ps1 -Project space-invaders
```

Happy experimenting!
