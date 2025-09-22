# Ping Pong

A minimal browser-based ping pong duel built with HTML canvas and vanilla JavaScript. Battle a responsive CPU paddle, keep the ball in play, and race to five points.

## Getting Started

1. Open `index.html` in a modern desktop browser, or serve the folder with any static file server (for example `npx serve` from this directory).
2. Click **Start** to serve the ball.
3. Use the **Up** and **Down** arrow keys (or **W/S**) to move your paddle.

## Gameplay Notes

- Games are first to five points; the scoreboard updates automatically.
- The CPU paddle tracks the ball with a small delay, giving you room to outmaneuver it.
- The match pauses if you switch tabs or hit the **Pause** button, so you never lose momentum accidentally.

## Tech Stack

- HTML5 canvas for drawing the table, paddles, and ball.
- Modern ES modules (`app.js`) with a tiny event loop for animation.
- Responsive layout and styling in `styles.css`.
