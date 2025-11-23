import { createSpaceInvadersGame } from "./src/game.js";
import { InputManager } from "./src/controls.js";

let gameHandle = null;
let input = null;

function setStatus(message) {
    const statusMessage = document.getElementById("status-message");
    if (statusMessage) {
        statusMessage.textContent = message;
    }
}

function getHudElements() {
    return {
        scoreValue: document.getElementById("score-value"),
        livesValue: document.getElementById("lives-value"),
        waveValue: document.getElementById("wave-value"),
        highScoreValue: document.getElementById("highscore-value"),
        shieldValue: document.getElementById("shield-value"),
        powerUpReadout: document.getElementById("powerup-readout")
    };
}

function hookButtons(game) {
    const pauseButton = document.getElementById("pause-game");
    const mobilePause = document.getElementById("mobile-pause");

    const updatePauseState = () => {
        const paused = game.isPaused();
        pauseButton.textContent = paused ? "Resume" : "Pause";
        pauseButton.setAttribute("aria-pressed", paused ? "true" : "false");
        mobilePause.textContent = paused ? "▶" : "II";
    };

    const toggle = () => {
        if (!game.isRunning()) return;
        game.togglePause();
        updatePauseState();
    };

    pauseButton.addEventListener("click", toggle);
    mobilePause.addEventListener("click", toggle);

    return updatePauseState;
}

export function init() {
    const canvas = document.getElementById("game-canvas");
    const startButton = document.getElementById("start-game");
    const pauseButton = document.getElementById("pause-game");
    const difficultySelect = document.getElementById("difficulty-select");
    const hud = getHudElements();

    input = new InputManager();
    const touchButtons = Array.from(document.querySelectorAll(".touch-btn"));
    input.bindButtons(touchButtons);

    gameHandle = createSpaceInvadersGame(canvas, hud, input, setStatus);

    const updatePauseState = hookButtons(gameHandle);

    const startGame = () => {
        gameHandle.start(difficultySelect.value);
        pauseButton.disabled = false;
        updatePauseState();
    };

    startButton.addEventListener("click", startGame);
    window.addEventListener("blur", () => {
        if (gameHandle && gameHandle.isRunning() && !gameHandle.isPaused()) {
            gameHandle.togglePause();
            updatePauseState();
        }
    });
}

export function destroyCurrentGame() {
    if (input) {
        input.destroy();
        input = null;
    }
    if (gameHandle) {
        gameHandle.destroy();
        gameHandle = null;
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

window.addEventListener("beforeunload", destroyCurrentGame);
