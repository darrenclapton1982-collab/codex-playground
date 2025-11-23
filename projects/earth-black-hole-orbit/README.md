# Earth Black Hole Orbit

Interactive 2D canvas that visualises Earth orbiting a supermassive black hole. Adjust the black hole mass, initial orbital distance, and launch velocity to see how the trajectory changes in real time.

## Scripts

- `npm run dev` — start the local dev server (lite-server on port 5173).
- `npm run build` — placeholder until a real build is required.

## Running the project

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Open the provided local URL to explore the orbit simulation.

## Controls

- **Black hole mass** — sets the gravitational parameter used in the simulation (arbitrary units).
- **Launch distance** — initial distance of Earth from the black hole.
- **Velocity factor** — scales the circular-orbit velocity to make the path more elliptical or plunge inward.
- **Reset** — re-seed the simulation with the current settings.
- **Toggle play/pause** — stop or resume the physics integration.

Trails show the recent path; a capture ring represents the event horizon. Physics uses a simple Newtonian model with a symplectic Euler integrator.
