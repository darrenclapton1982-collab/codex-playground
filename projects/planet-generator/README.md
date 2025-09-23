# Procedural Planet Generator

A modular Three.js playground that builds a fully procedural planet with biome-aware terrain, animated clouds, reflective oceans, and a glowing atmosphere. Terrain is sculpted with simplex noise inspired by Minecraft's cliffs and plateaus, and the scene includes custom camera controls without OrbitControls.

## Features

- Multi-octave simplex terrain displacement with biome-based vertex colouring
- Animated oceans, atmosphere glow, and volumetric cloud shell driven by shader materials
- Directional sunlight with soft shadows, ambient fill, and a configurable day/night rotation
- Custom pointer-driven camera controls with zoom, rotation, and reset (no OrbitControls)
- Overlay UI to pause/resume rotation and fine-tune rotation speed

## Getting Started

```bash
npm install
npm run dev
```

This starts lite-server on http://localhost:5173. The scene auto-resizes with the window and listens for pointer/touch input on the canvas.

## Controls

- **Rotate** - click/touch and drag the planet
- **Zoom** - scroll the mouse wheel or pinch on touch devices
- **Pause / Resume** - toggle using the control panel
- **Adjust speed** - use the slider to tweak the day/night cycle rate
- **Reset camera** - returns to the default orbiting camera position

## Project Structure

- `app.js` - entry point wiring the main initializer
- `src/` - modular source split into terrain generation, materials, controls, and render loop
- `styles.css` - layout and UI styling for the viewport and control overlay

Enjoy exploring new worlds!
