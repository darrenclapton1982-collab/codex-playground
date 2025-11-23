# Space Invaders 3JS Mobile

A fully featured, mobile-friendly Space Invaders remake that runs on top of Three.js with an orthographic 2D view. The game adds touch pads, HUD controls, rapid + spread fire power cores, shields, elite invaders, and persistent highscores so you can chase points on phones or desktops alike.

## Features

- Three.js powered 2D scene with parallax stars and holographic grid
- Difficulty presets that scale wave size, speed, and bomb frequency
- Elite invaders with extra health and score multipliers
- Player power cores: shield boosts, rapid fire, and spread shots
- On-screen mobile controls (strafe pads, fire button, pause)
- Keyboard support (A/D or arrows to move, Space to fire, P to pause)
- Responsive layout, fixed viewport scaling, and local high score tracking

## Layout

```
projects/space-invaders/
├─ index.html      # Canvas, HUD, mobile controls
├─ styles.css      # Responsive neon-inspired UI and pads
├─ app.js          # Wires UI and starts the game
└─ src/
   ├─ config.js    # Gameplay constants and tuning
   ├─ controls.js  # Keyboard + touch input manager
   └─ game.js      # Three.js game loop, waves, collisions
```

## Running

Install dependencies (lite-server for dev serving; Three.js is loaded from CDN):

```
npm install
```

Start the dev server:

```
npm run dev
```

Open http://localhost:5173 to play. Tap the pads or use your keyboard to clear waves and climb the leaderboard.
