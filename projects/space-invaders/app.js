import { createSpaceInvadersGame } from "./src/game.js";

let destroyGame = null;

export function init() {
    const canvas = document.getElementById("game-canvas");
    const startButton = document.getElementById("start-game");
    const pauseButton = document.getElementById("pause-game");
    const difficultySelect = document.getElementById("difficulty-select");
    const scoreValue = document.getElementById("score-value");
    const livesValue = document.getElementById("lives-value");
    const waveValue = document.getElementById("wave-value");
    const highScoreValue = document.getElementById("highscore-value");
    const statusMessage = document.getElementById("status-message");

    if (
        !canvas ||
        !startButton ||
        !pauseButton ||
        !difficultySelect ||
        !scoreValue ||
        !livesValue ||
        !waveValue ||
        !highScoreValue ||
        !statusMessage
    ) {
        console.warn("Space Invaders: required UI elements missing; aborting init.");
        return;
    }

    destroyCurrentGame();

    destroyGame = createSpaceInvadersGame({
        canvas,
        startButton,
        pauseButton,
        difficultySelect,
        hud: { scoreValue, livesValue, waveValue, highScoreValue },
        statusMessage
    });
}

function destroyCurrentGame() {
    if (typeof destroyGame === "function") {
        destroyGame();
        destroyGame = null;
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

window.addEventListener("beforeunload", destroyCurrentGame);
