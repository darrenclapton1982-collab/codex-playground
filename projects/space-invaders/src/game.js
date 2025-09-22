import { HIGH_SCORE_KEY, PLAYER_LIMITS, difficultyPresets } from "./config.js";
import {
    createPlayer,
    createStars,
    makeEnemyShot,
    makePlayerShot,
    resetPlayerPosition,
    spawnWave
} from "./entities.js";
import { createKeyboardControls } from "./controls.js";
import { drawScene } from "./render.js";

export function createSpaceInvadersGame(dom) {
    const {
        canvas,
        startButton,
        pauseButton,
        difficultySelect,
        hud: { scoreValue, livesValue, waveValue, highScoreValue },
        statusMessage
    } = dom;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.warn("Space Invaders: canvas context unavailable.");
        return () => {};
    }

    const width = canvas.width;
    const height = canvas.height;

    const stars = createStars(width, height);
    const player = createPlayer(width, height);
    const keys = new Set();

    let preset = difficultyPresets[difficultySelect.value] || difficultyPresets.standard;
    let invaders = [];
    let invaderDirection = 1;
    let invaderSpeed = preset.invaderSpeedBase;
    let invaderDrop = preset.invaderDrop;

    let playerShots = [];
    let enemyShots = [];

    let running = false;
    let paused = false;
    let score = 0;
    let lives = 3;
    let wave = 1;
    let playerCooldown = 0;
    let playerCooldownDelay = preset.playerCooldown;
    let enemyFireTimer = 0;
    let enemyFireInterval = preset.enemyFireIntervalBase;
    let enemyShotSpeed = preset.enemyShotSpeedBase;
    let lastTimestamp = 0;
    let highScore = loadHighScore();

    const detachKeyboard = createKeyboardControls(keys, {
        firePlayerShot,
        togglePause: () => togglePause()
    });
    const handleWindowBlur = () => togglePause(true);
    window.addEventListener("blur", handleWindowBlur);

    const handlePauseClick = () => togglePause();
    const handleDifficultyChange = () => {
        applyDifficulty(difficultySelect.value);
        if (!running) {
            statusMessage.textContent = `Difficulty set to ${difficultySelect.value}.`;
        }
    };

    startButton.addEventListener("click", startGame);
    pauseButton.addEventListener("click", handlePauseClick);
    difficultySelect.addEventListener("change", handleDifficultyChange);

    pauseButton.disabled = true;
    pauseButton.setAttribute("aria-pressed", "false");
    updateHud();
    drawScene(ctx, buildRenderState());

    function buildRenderState() {
        return {
            width,
            height,
            stars,
            player,
            invaders,
            playerShots,
            enemyShots
        };
    }

    function loadHighScore() {
        try {
            const stored = window.localStorage?.getItem(HIGH_SCORE_KEY);
            return stored ? Number(stored) || 0 : 0;
        } catch (error) {
            console.warn("Space Invaders: unable to read high score", error);
            return 0;
        }
    }

    function setHighScore(value) {
        highScore = value;
        highScoreValue.textContent = String(highScore);
        try {
            window.localStorage?.setItem(HIGH_SCORE_KEY, String(highScore));
        } catch (error) {
            console.warn("Space Invaders: unable to store high score", error);
        }
    }

    function checkHighScore() {
        if (score > highScore) {
            setHighScore(score);
            if (running) {
                statusMessage.textContent = "New high score!";
            }
        }
    }

    function updateHud() {
        scoreValue.textContent = String(score);
        livesValue.textContent = String(lives);
        waveValue.textContent = String(wave);
        highScoreValue.textContent = String(highScore);
    }

    function applyDifficulty(key) {
        preset = difficultyPresets[key] || difficultyPresets.standard;
        player.speed = preset.playerSpeed;
        playerCooldownDelay = preset.playerCooldown;
        invaderDrop = preset.invaderDrop;
        if (!running) {
            invaderSpeed = preset.invaderSpeedBase;
            enemyFireInterval = preset.enemyFireIntervalBase;
            enemyShotSpeed = preset.enemyShotSpeedBase;
        }
    }

    function spawnNewWave() {
        invaders = spawnWave(width, wave, preset);
        invaderDirection = 1;
        invaderSpeed = preset.invaderSpeedBase + (wave - 1) * preset.invaderSpeedRamp;
        enemyFireInterval = Math.max(
            preset.enemyFireIntervalFloor,
            preset.enemyFireIntervalBase - (wave - 1) * preset.enemyFireIntervalStep
        );
        enemyShotSpeed = preset.enemyShotSpeedBase + (wave - 1) * preset.enemyShotSpeedRamp;
        enemyFireTimer = 0;
        playerShots = [];
        enemyShots = [];
        playerCooldown = 0;
        drawScene(ctx, buildRenderState());
    }

    function firePlayerShot() {
        if (playerCooldown > 0 || !running || paused) {
            return;
        }
        playerShots.push(makePlayerShot(player));
        playerCooldown = playerCooldownDelay;
    }

    function fireEnemyShot() {
        if (!invaders.length) {
            return;
        }
        const columns = new Map();
        invaders.forEach((inv) => {
            const current = columns.get(inv.col);
            if (!current || inv.y > current.y) {
                columns.set(inv.col, inv);
            }
        });
        const shooters = Array.from(columns.values());
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        enemyShots.push(makeEnemyShot(shooter, enemyShotSpeed));
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function intersects(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    function resetPlayer() {
        resetPlayerPosition(player, width, height);
    }

    function startGame() {
        applyDifficulty(difficultySelect.value);
        running = true;
        paused = false;
        score = 0;
        lives = 3;
        wave = 1;
        keys.clear();
        updateHud();
        resetPlayer();
        statusMessage.textContent = "Defend the sector!";
        startButton.disabled = true;
        pauseButton.disabled = false;
        pauseButton.textContent = "Pause";
        pauseButton.setAttribute("aria-pressed", "false");
        difficultySelect.disabled = true;
        spawnNewWave();
        lastTimestamp = performance.now();
        requestAnimationFrame((timestamp) => {
            lastTimestamp = timestamp;
            requestAnimationFrame(loop);
        });
    }

    function endGame(didWin, message) {
        running = false;
        paused = false;
        startButton.disabled = false;
        pauseButton.disabled = true;
        pauseButton.textContent = "Pause";
        pauseButton.setAttribute("aria-pressed", "false");
        difficultySelect.disabled = false;
        statusMessage.textContent = message || (didWin ? "Sector secure!" : "Game over.");
        checkHighScore();
        drawScene(ctx, buildRenderState());
    }

    function loseLife(message) {
        lives -= 1;
        updateHud();
        if (lives <= 0) {
            endGame(false, message || "The fleet has fallen.");
            return;
        }
        statusMessage.textContent = message ? `${message} ${lives} lives left.` : `${lives} lives remain.`;
        resetPlayer();
        playerShots = [];
        enemyShots = [];
        playerCooldown = 0;
    }

    function advanceWave() {
        wave += 1;
        updateHud();
        statusMessage.textContent = `Wave ${wave} incoming!`;
        setTimeout(() => {
            if (!running) {
                return;
            }
            spawnNewWave();
        }, 900);
    }

    function togglePause(forceState) {
        if (!running) {
            return;
        }
        const nextState = typeof forceState === "boolean" ? forceState : !paused;
        if (nextState === paused) {
            return;
        }
        paused = nextState;
        pauseButton.setAttribute("aria-pressed", String(paused));
        pauseButton.textContent = paused ? "Resume" : "Pause";
        statusMessage.textContent = paused ? "Paused." : "Back to the fight!";
        if (!paused) {
            lastTimestamp = performance.now();
        }
        drawScene(ctx, buildRenderState());
    }

    function loop(timestamp) {
        if (!running) {
            return;
        }

        if (paused) {
            lastTimestamp = timestamp;
            requestAnimationFrame(loop);
            return;
        }

        const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
        lastTimestamp = timestamp;

        playerCooldown = Math.max(0, playerCooldown - delta);
        enemyFireTimer += delta;

        const moveDistance = player.speed * delta;
        if (keys.has("left")) {
            player.x -= moveDistance;
        }
        if (keys.has("right")) {
            player.x += moveDistance;
        }
        player.x = clamp(player.x, PLAYER_LIMITS.left, width - player.width - PLAYER_LIMITS.right);

        if (enemyFireTimer >= enemyFireInterval) {
            fireEnemyShot();
            enemyFireTimer = 0;
        }

        if (invaders.length) {
            let leftEdge = Infinity;
            let rightEdge = -Infinity;
            invaders.forEach((inv) => {
                inv.x += invaderDirection * invaderSpeed * delta;
                if (inv.x < leftEdge) {
                    leftEdge = inv.x;
                }
                if (inv.x + inv.width > rightEdge) {
                    rightEdge = inv.x + inv.width;
                }
            });

            if ((invaderDirection === 1 && rightEdge >= width - 30) || (invaderDirection === -1 && leftEdge <= 30)) {
                invaderDirection *= -1;
                invaders.forEach((inv) => {
                    inv.y += invaderDrop;
                });
            }

            for (let i = invaders.length - 1; i >= 0; i -= 1) {
                const inv = invaders[i];
                if (inv.y + inv.height >= player.y - 4) {
                    loseLife("Invaders broke through!");
                    if (!running) {
                        return;
                    }
                    invaders.splice(i, 1);
                }
            }
        }

        for (let i = playerShots.length - 1; i >= 0; i -= 1) {
            const shot = playerShots[i];
            shot.y -= shot.speed * delta;
            if (shot.y + shot.height < 0) {
                playerShots.splice(i, 1);
                continue;
            }
            let didHit = false;
            for (let j = invaders.length - 1; j >= 0; j -= 1) {
                const inv = invaders[j];
                if (intersects(shot, inv)) {
                    playerShots.splice(i, 1);
                    invaders.splice(j, 1);
                    score += 100;
                    updateHud();
                    checkHighScore();
                    statusMessage.textContent = "Direct hit!";
                    didHit = true;
                    break;
                }
            }
            if (didHit) {
                continue;
            }
        }

        for (let i = enemyShots.length - 1; i >= 0; i -= 1) {
            const shot = enemyShots[i];
            shot.y += shot.speed * delta;
            if (shot.y > height) {
                enemyShots.splice(i, 1);
                continue;
            }
            if (intersects(shot, player)) {
                enemyShots.splice(i, 1);
                loseLife("You took a hit!");
                if (!running) {
                    return;
                }
            }
        }

        if (!invaders.length) {
            score += preset.waveBonus;
            updateHud();
            checkHighScore();
            statusMessage.textContent = "Wave cleared!";
            advanceWave();
        }

        drawScene(ctx, buildRenderState());
        requestAnimationFrame(loop);
    }

    function destroy() {
        window.removeEventListener("blur", handleWindowBlur);
        detachKeyboard();
        startButton.removeEventListener("click", startGame);
        pauseButton.removeEventListener("click", handlePauseClick);
        difficultySelect.removeEventListener("change", handleDifficultyChange);
    }

    return destroy;
}
