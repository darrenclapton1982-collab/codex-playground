# Neon Paddle

Neon Paddle transforms the classic browser ping-pong prototype into a full-screen arena with modern effects, adaptive AI, and punchy audio.

## Highlights
- Full-screen neon arena with dynamic lighting, particle bursts, and ball trails.
- Three difficulty tiers (Chill, Arcade, Pro) with smarter AI, faster volleys, and stat tracking.
- Keyboard, mouse, and touch control support with pause and resume on blur.
- Live HUD with rally stats, match toasts, countdown serves, and post-game summary.
- Lightweight Web Audio effects for hits, walls, scoring, and match finales.

## Getting Started
1. Open `index.html` in a modern desktop browser or serve the directory (`npx serve`).
2. Pick a difficulty and start the match. The game remembers the current settings until you change them.
3. Use the on-screen buttons to pause, toggle fullscreen, or mute sound.

## Controls
- Move paddle: Arrow keys or W / S.
- Pointer or touch: Drag or swipe within the arena.
- Pause or resume: Spacebar, the pause button, or focus loss.
- Toggle fullscreen: F or the fullscreen button.
- Mute audio: M or the sound button.

## Tech Notes
- Canvas renders the arena at 1280x720 and scales to any viewport while preserving aspect ratio.
- Adaptive AI predicts ball paths with difficulty-specific speed, reaction, and error tuning.
- Web Audio API builds the entire soundscape without external assets.
- Styles rely on modern CSS (flexbox, grid, clamp) with dark-mode friendly colors.

Have feedback or ideas for the next polish pass? Pop open an issue or tweak away.
