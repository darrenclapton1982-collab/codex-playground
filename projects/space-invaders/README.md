# Space Invaders Prototype

A modular starting point for a richer Space Invaders remake. The goal is to prove out the new monorepo layout and leave clear seams for future expansion.

## Layout

```
projects/space-invaders/
+-- app.js          # Bootstraps the game and DOM wiring
+-- index.html      # Markup for HUD, controls, and canvas
+-- styles.css      # Layout and component styling
+-- package.json    # npm scripts + dev dependencies
+-- bs-config.json  # lite-server configuration
+-- src/
    +-- config.js   # Gameplay constants & presets
    +-- entities.js # Helpers to spawn/update entities
    +-- render.js   # Canvas drawing helpers
    +-- controls.js # Keyboard handling
    +-- game.js     # State machine + loop orchestration
```

## Running

Install dependencies (already done when the scaffold ran, but safe to repeat):

```
npm install
```

Then start the local dev server:

```
npm run dev
```

Open http://localhost:5173 in your browser to play.

## Controls

- Move with arrow keys or `A` / `D`
- Fire with the space bar
- Pause/resume with `P` or `Esc`

Feel free to duplicate the folder and iterate without affecting the template.
