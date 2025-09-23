# Space Invaders Prototype

A full-screen, feature-rich Space Invaders remake showcasing the repo workflow. The game now layers dynamic nebulae, parallax grids, particle storms, synth audio, boss encounters, elite invaders, collectible power cores, and responsive scaling for a spectacle that feels alive.

## Feature Highlights

- Immersive full-screen canvas with animated nebulae, parallax starfield, and energy grid
- Difficulty presets influence wave size, elite probability, combo forgiveness, and rewards
- Diverse invader cast (strikers, tanks, sappers, wardens, snipers) plus boss fights every 5th wave
- Power cores (shield, overdrive, pierce, wingmen) with timers and HUD readouts
- Combo multiplier system with camera shake, particle showers, and score boosts
- Persistent high score, shield tracking, drone wingmen, bullet trails, and pause/fullscreen controls
- Lightweight Web Audio soundtrack + synth SFX triggered during play

## Layout

```
projects/space-invaders/
+-- app.js          # Bootstraps the game, handles resize/fullscreen, connects HUD
+-- bs-config.json  # lite-server configuration
+-- index.html      # Canvas and overlay HUD chrome
+-- package.json    # npm scripts + dev dependency
+-- styles.css      # Full-screen layout and HUD styling
+-- src/
    +-- audio.js    # Web Audio controller for music/SFX
    +-- config.js   # Gameplay constants (difficulty, invaders, power-ups, visuals)
    +-- controls.js # Keyboard bindings
    +-- entities.js # Factories for ships, background, power-ups, boss, particles
    +-- game.js     # State machine, loop, collisions, combo logic, audio hooks
    +-- render.js   # Canvas drawing of background, actors, HUD overlays
```

## Running

Install dependencies (already run by the scaffold script, but safe to repeat):

```
npm install
```

Start the dev server:

```
npm run dev
```

Visit http://localhost:5173 in your browser. Allow audio playback and hit the Fullscreen button for the most immersive experience.

## Controls

- Move with arrow keys or `A` / `D`
- Fire with the space bar
- Pause/resume with `P` or `Esc`
- Collect power cores by flying into them (wingmen auto-fire once active)

Combo chains, elite waves, and the nebula boss are tuned to reward aggressive but agile play—keep the streak alive to chase absurd scores.
