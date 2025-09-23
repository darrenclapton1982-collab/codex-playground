import { createSpaceInvadersGame } from "./src/game.js";

let gameHandle = null;
let resizeHandler = null;
let fullscreenHandler = null;
let fullscreenToggleHandler = null;

export function init() {
    const canvas = document.getElementById("game-canvas");
    const startButton = document.getElementById("start-game");
    const pauseButton = document.getElementById("pause-game");
    const difficultySelect = document.getElementById("difficulty-select");
    const scoreValue = document.getElementById("score-value");
    const livesValue = document.getElementById("lives-value");
    const waveValue = document.getElementById("wave-value");
    const highScoreValue = document.getElementById("highscore-value");
    const shieldValue = document.getElementById("shield-value");
    const powerUpReadout = document.getElementById("powerup-readout");
    const statusMessage = document.getElementById("status-message");
    const fullscreenButton = document.getElementById("fullscreen-toggle");

    if (
        !canvas ||
        !startButton ||
        !pauseButton ||
        !difficultySelect ||
        !scoreValue ||
        !livesValue ||
        !waveValue ||
        !highScoreValue ||
        !shieldValue ||
        !powerUpReadout ||
        !statusMessage ||
        !fullscreenButton
    ) {
        console.warn("Space Invaders: required UI elements missing; aborting init.");
        return;
    }

    destroyCurrentGame();

    gameHandle = createSpaceInvadersGame({
        canvas,
        startButton,
        pauseButton,
        fullscreenButton,
        difficultySelect,
        hud: { scoreValue, livesValue, waveValue, highScoreValue, shieldValue, powerUpReadout },
        statusMessage
    });

    const applyResize = () => {
        if (!gameHandle) {
            return;
        }
        const dpr = window.devicePixelRatio || 1;
        gameHandle.resize(window.innerWidth, window.innerHeight, dpr);
    };

    resizeHandler = applyResize;
    fullscreenHandler = () => {
        const isFullscreen = Boolean(document.fullscreenElement);
        fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
        fullscreenButton.textContent = isFullscreen ? "Windowed" : "Fullscreen";
        applyResize();
    };
    fullscreenToggleHandler = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {
                statusMessage.textContent = "Fullscreen request blocked.";
            });
        } else {
            document.exitFullscreen?.().catch(() => {
                statusMessage.textContent = "Could not exit fullscreen.";
            });
        }
    };

    window.addEventListener("resize", resizeHandler);
    document.addEventListener("fullscreenchange", fullscreenHandler);
    fullscreenButton.addEventListener("click", fullscreenToggleHandler);

    applyResize();
}

function destroyCurrentGame() {
    if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = null;
    }
    if (fullscreenHandler) {
        document.removeEventListener("fullscreenchange", fullscreenHandler);
        fullscreenHandler = null;
    }
    const fullscreenButton = document.getElementById("fullscreen-toggle");
    if (fullscreenButton && fullscreenToggleHandler) {
        fullscreenButton.removeEventListener("click", fullscreenToggleHandler);
        fullscreenToggleHandler = null;
    }

    if (gameHandle && typeof gameHandle.destroy === "function") {
        gameHandle.destroy();
    }
    gameHandle = null;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

window.addEventListener("beforeunload", destroyCurrentGame);
