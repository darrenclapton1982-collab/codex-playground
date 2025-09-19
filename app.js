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

tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        activateTab(button.dataset.target);
    });
});

activateTab("get-started");

const canvas = document.getElementById("game-canvas");
if (canvas) {
    initOrbHopper(canvas);
} else {
    console.warn("Orb Hopper setup skipped: canvas element not found.");
}

function initOrbHopper(canvas) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const startButton = document.getElementById("start-game");
    const scoreValue = document.getElementById("score-value");
    const timerValue = document.getElementById("timer-value");
    const statusMessage = document.getElementById("status-message");

    if (!ctx || !startButton || !scoreValue || !timerValue || !statusMessage) {
        console.warn("Orb Hopper setup incomplete: required elements missing.");
        return;
    }

    const player = {
        x: width / 2,
        y: height / 2,
        size: 26,
        speed: 180,
    };

    const orb = {
        x: 0,
        y: 0,
        radius: 14,
    };

    const keys = new Set();
    let lastTimestamp = 0;
    let score = 0;
    let timer = 30;
    let running = false;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const spawnOrb = () => {
        const margin = orb.radius + 10;
        orb.x = Math.random() * (width - margin * 2) + margin;
        orb.y = Math.random() * (height - margin * 2) + margin;
    };

    const updateScore = () => {
        scoreValue.textContent = String(score);
    };

    const updateTimer = () => {
        timerValue.textContent = String(Math.ceil(timer));
    };

    const drawBackground = () => {
        ctx.save();
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#0c7b93");
        gradient.addColorStop(1, "#095a6a");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = gridSize; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = gridSize; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        ctx.restore();
    };

    const drawPlayer = () => {
        ctx.save();
        ctx.fillStyle = "#f8fafc";
        ctx.shadowColor = "rgba(255, 255, 255, 0.45)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.rect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
        ctx.fill();
        ctx.restore();
    };

    const drawOrb = () => {
        ctx.save();
        ctx.fillStyle = "#ffe066";
        ctx.shadowColor = "rgba(255, 224, 102, 0.6)";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    const drawScene = () => {
        drawBackground();
        drawOrb();
        drawPlayer();
    };

    const movePlayer = (delta) => {
        const distance = player.speed * delta;
        if (keys.has("up")) {
            player.y -= distance;
        }
        if (keys.has("down")) {
            player.y += distance;
        }
        if (keys.has("left")) {
            player.x -= distance;
        }
        if (keys.has("right")) {
            player.x += distance;
        }

        const half = player.size / 2;
        player.x = clamp(player.x, half, width - half);
        player.y = clamp(player.y, half, height - half);
    };

    const normaliseKey = (key) => {
        switch (key) {
            case "ArrowUp":
            case "w":
            case "W":
                return "up";
            case "ArrowDown":
            case "s":
            case "S":
                return "down";
            case "ArrowLeft":
            case "a":
            case "A":
                return "left";
            case "ArrowRight":
            case "d":
            case "D":
                return "right";
            default:
                return null;
        }
    };

    const handleKeyDown = (event) => {
        const direction = normaliseKey(event.key);
        if (!direction) {
            return;
        }

        event.preventDefault();
        keys.add(direction);
    };

    const handleKeyUp = (event) => {
        const direction = normaliseKey(event.key);
        if (!direction) {
            return;
        }

        keys.delete(direction);
    };

    const isCollidingWithOrb = () => {
        const dx = player.x - orb.x;
        const dy = player.y - orb.y;
        const radius = Math.sqrt(2 * (player.size / 2) ** 2);
        const distance = Math.hypot(dx, dy);
        return distance <= radius + orb.radius - 4;
    };

    const loop = (timestamp) => {
        if (!running) {
            return;
        }

        const delta = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;
        timer = Math.max(0, timer - delta);

        movePlayer(delta);

        if (isCollidingWithOrb()) {
            score += 10;
            updateScore();
            spawnOrb();
            statusMessage.textContent = "Nice scoop! Keep going.";
        }

        updateTimer();
        drawScene();

        if (timer <= 0) {
            running = false;
            startButton.disabled = false;
            statusMessage.textContent = score > 0 ? `Time! You banked ${score} points.` : "Time! Give it another shot.";
            return;
        }

        requestAnimationFrame(loop);
    };

    startButton.addEventListener("click", () => {
        running = true;
        score = 0;
        timer = 30;
        updateScore();
        updateTimer();
        spawnOrb();
        statusMessage.textContent = "Collect the glowing orbs!";
        startButton.disabled = true;
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

    const reset = () => {
        running = false;
        score = 0;
        timer = 30;
        player.x = width / 2;
        player.y = height / 2;
        spawnOrb();
        updateScore();
        updateTimer();
        startButton.disabled = false;
        statusMessage.textContent = "Ready when you are!";
        drawScene();
    };

    reset();
}
