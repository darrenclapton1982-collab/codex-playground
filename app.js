const body = document.body;
body.classList.add("has-tabs");

const tabButtons = Array.from(document.querySelectorAll(".tab-link"));
const panels = Array.from(document.querySelectorAll(".tab-panel"));

const activateTab = (id) => {
    tabButtons.forEach((button) => {
        const isActive = button.dataset.target === id;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", String(isActive));
        button.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    panels.forEach((panel) => {
        const isActive = panel.id === id;
        panel.classList.toggle("is-active", isActive);
        panel.setAttribute("tabindex", isActive ? "0" : "-1");
    });
};

const handleTabKeydown = (event) => {
    const { key } = event;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) {
        return;
    }

    event.preventDefault();

    const currentIndex = tabButtons.indexOf(event.currentTarget);
    if (currentIndex === -1) {
        return;
    }

    let nextIndex = currentIndex;

    if (key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
    } else if (key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % tabButtons.length;
    } else if (key === "Home") {
        nextIndex = 0;
    } else if (key === "End") {
        nextIndex = tabButtons.length - 1;
    }

    const nextTab = tabButtons[nextIndex];
    if (!nextTab) {
        return;
    }

    activateTab(nextTab.dataset.target);
    nextTab.focus();
};

tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        activateTab(button.dataset.target);
    });

    button.addEventListener("keydown", handleTabKeydown);
});

activateTab("get-started");

const canvas = document.getElementById("game-canvas");
if (canvas) {
    initSpaceInvaders(canvas);
} else {
    console.warn("Space Invaders setup skipped: canvas element not found.");
}

function initSpaceInvaders(canvas) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const startButton = document.getElementById("start-game");
    const scoreValue = document.getElementById("score-value");
    const livesValue = document.getElementById("lives-value");
    const waveValue = document.getElementById("wave-value");
    const statusMessage = document.getElementById("status-message");

    if (!ctx || !startButton || !scoreValue || !livesValue || !waveValue || !statusMessage) {
        console.warn("Space Invaders setup incomplete: required elements missing.");
        return;
    }

    const stars = Array.from({ length: 70 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.4,
        a: Math.random() * 0.4 + 0.4,
    }));

    const keys = new Set();
    const player = {
        x: width / 2 - 22,
        y: height - 60,
        width: 44,
        height: 20,
        speed: 260,
    };

    let invaders = [];
    let invaderDirection = 1;
    let invaderSpeed = 40;
    const invaderDrop = 28;

    let playerShots = [];
    let enemyShots = [];

    let running = false;
    let score = 0;
    let lives = 3;
    let wave = 1;
    let playerCooldown = 0;
    let enemyFireTimer = 0;
    let enemyFireInterval = 1.4;
    let lastTimestamp = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const intersects = (a, b) =>
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;

    const updateHud = () => {
        scoreValue.textContent = String(score);
        livesValue.textContent = String(lives);
        waveValue.textContent = String(wave);
    };

    const drawBackground = () => {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#03132a");
        gradient.addColorStop(1, "#050b19");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        stars.forEach((star) => {
            ctx.globalAlpha = star.a;
            ctx.fillStyle = "#e2e8f0";
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
        ctx.fillRect(0, height - 32, width, 32);
    };

    const drawPlayer = () => {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(0, -player.height / 2);
        ctx.lineTo(player.width / 2, player.height / 2);
        ctx.lineTo(0, player.height / 4);
        ctx.lineTo(-player.width / 2, player.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };

    const drawInvaders = () => {
        ctx.fillStyle = "#fbbf24";
        invaders.forEach((inv) => {
            ctx.save();
            ctx.translate(inv.x + inv.width / 2, inv.y + inv.height / 2);
            ctx.scale(1.1, 1);
            ctx.beginPath();
            ctx.rect(-inv.width / 2, -inv.height / 2, inv.width, inv.height);
            ctx.fill();
            ctx.restore();
        });
    };

    const drawShots = () => {
        ctx.fillStyle = "#f8fafc";
        playerShots.forEach((shot) => {
            ctx.fillRect(shot.x, shot.y, shot.width, shot.height);
        });

        ctx.fillStyle = "#f87171";
        enemyShots.forEach((shot) => {
            ctx.fillRect(shot.x, shot.y, shot.width, shot.height);
        });
    };

    const drawScene = () => {
        drawBackground();
        drawInvaders();
        drawShots();
        drawPlayer();
    };

    const spawnWave = () => {
        const cols = 8;
        const rows = 4 + Math.min(wave - 1, 3);
        const invaderWidth = 34;
        const invaderHeight = 26;
        const horizontalGap = 48;
        const verticalGap = 38;
        const startX = (width - (cols - 1) * horizontalGap) / 2 - invaderWidth / 2;
        const startY = 70;

        invaders = [];
        for (let r = 0; r < rows; r += 1) {
            for (let c = 0; c < cols; c += 1) {
                invaders.push({
                    x: startX + c * horizontalGap,
                    y: startY + r * verticalGap,
                    width: invaderWidth,
                    height: invaderHeight,
                    col: c,
                });
            }
        }

        invaderDirection = 1;
        invaderSpeed = 35 + wave * 6;
        enemyFireInterval = Math.max(0.6, 1.4 - wave * 0.12);
        enemyFireTimer = 0;
        playerShots = [];
        enemyShots = [];
        playerCooldown = 0;
        drawScene();
    };

    const resetPlayer = () => {
        player.x = width / 2 - player.width / 2;
    };

    const firePlayerShot = () => {
        if (playerCooldown > 0 || !running) {
            return;
        }

        playerShots.push({
            x: player.x + player.width / 2 - 2,
            y: player.y - 14,
            width: 4,
            height: 14,
            speed: 520,
        });
        playerCooldown = 0.25;
    };

    const fireEnemyShot = () => {
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
        enemyShots.push({
            x: shooter.x + shooter.width / 2 - 3,
            y: shooter.y + shooter.height,
            width: 6,
            height: 16,
            speed: 180 + wave * 18,
        });
    };

    const loseLife = (message) => {
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
    };

    const endGame = (didWin, message) => {
        running = false;
        startButton.disabled = false;
        statusMessage.textContent = message || (didWin ? "Sector secure!" : "Game over." );
        drawScene();
    };

    const advanceWave = () => {
        wave += 1;
        updateHud();
        statusMessage.textContent = `Wave ${wave} incoming!`;
        setTimeout(() => {
            if (!running) {
                return;
            }
            spawnWave();
        }, 900);
    };

    const loop = (timestamp) => {
        if (!running) {
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
        player.x = clamp(player.x, 12, width - player.width - 12);

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

            if (
                (invaderDirection === 1 && rightEdge >= width - 30) ||
                (invaderDirection === -1 && leftEdge <= 30)
            ) {
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

            for (let j = invaders.length - 1; j >= 0; j -= 1) {
                const inv = invaders[j];
                if (intersects(shot, inv)) {
                    playerShots.splice(i, 1);
                    invaders.splice(j, 1);
                    score += 100;
                    updateHud();
                    statusMessage.textContent = "Direct hit!";
                    break;
                }
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
            score += 200;
            updateHud();
            statusMessage.textContent = "Wave cleared!";
            advanceWave();
        }

        drawScene();
        requestAnimationFrame(loop);
    };

    const handleKeyDown = (event) => {
        if (event.repeat) {
            return;
        }

        switch (event.key) {
            case "ArrowLeft":
            case "a":
            case "A":
                keys.add("left");
                event.preventDefault();
                break;
            case "ArrowRight":
            case "d":
            case "D":
                keys.add("right");
                event.preventDefault();
                break;
            case " ":
            case "Space":
                event.preventDefault();
                firePlayerShot();
                break;
            default:
                break;
        }
    };

    const handleKeyUp = (event) => {
        switch (event.key) {
            case "ArrowLeft":
            case "a":
            case "A":
                keys.delete("left");
                break;
            case "ArrowRight":
            case "d":
            case "D":
                keys.delete("right");
                break;
            default:
                break;
        }
    };

    startButton.addEventListener("click", () => {
        running = true;
        score = 0;
        lives = 3;
        wave = 1;
        updateHud();
        resetPlayer();
        statusMessage.textContent = "Defend the sector!";
        startButton.disabled = true;
        spawnWave();
        lastTimestamp = performance.now();
        requestAnimationFrame((timestamp) => {
            lastTimestamp = timestamp;
            requestAnimationFrame(loop);
        });
    });

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);

    canvas.addEventListener("click", () => {
        if (!running) {
            startButton.focus();
        }
    });

    updateHud();
    drawScene();
}
