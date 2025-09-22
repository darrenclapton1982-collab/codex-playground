# Space Invaders Prototype

A modular starting point for a richer Space Invaders remake. The goal is to prove out the new monorepo layout and leave clear seams for future expansion.

## Layout

```
projects/space-invaders/
+-- app.js          # Bootstraps the game and DOM wiring
+-- index.html      # Markup for HUD, controls, and canvas
+-- styles.css      # Layout and component styling
+-- src/
    +-- config.js   # Gameplay constants & presets
    +-- entities.js # Helpers to spawn/update entities
    +-- render.js   # Canvas drawing helpers
    +-- controls.js # Keyboard handling
    +-- game.js     # State machine + loop orchestration
```

## Running

Open `index.html` in a modern browser. No build tooling required.

## Controls

- Move with arrow keys or `A` / `D`
- Fire with the space bar
- Pause/resume with `P` or `Esc`

Feel free to duplicate the folder and iterate without affecting the template.
