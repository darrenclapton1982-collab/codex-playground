const body = document.body;
body.classList.add("has-tabs");

const themeToggle = document.getElementById("theme-toggle");
const themePreferenceKey = "codex-playground-theme";
const themeMediaQuery =
    typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;
let manualThemePreference = null;

const updateThemeToggle = (theme) => {
    if (!themeToggle) {
        return;
    }

    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    const label = themeToggle.querySelector(".theme-toggle-label");
    const icon = themeToggle.querySelector(".theme-toggle-icon");
    if (label) {
        label.textContent = isDark ? "Light mode" : "Dark mode";
    }
    if (icon) {
        icon.textContent = isDark ? "☀️" : "🌙";
    }
};

const applyTheme = (theme, { persist } = { persist: false }) => {
    const isDark = theme === "dark";
    body.classList.toggle("dark-mode", isDark);
    updateThemeToggle(theme);
    if (persist) {
        try {
            localStorage.setItem(themePreferenceKey, theme);
            manualThemePreference = theme;
        } catch (error) {
            console.warn("Unable to persist theme preference", error);
        }
    }
};

const resolveInitialTheme = () => {
    let storedTheme = null;
    try {
        storedTheme = localStorage.getItem(themePreferenceKey);
    } catch (error) {
        console.warn("Unable to read theme preference", error);
    }

    if (storedTheme === "light" || storedTheme === "dark") {
        manualThemePreference = storedTheme;
        return storedTheme;
    }

    if (themeMediaQuery?.matches) {
        return "dark";
    }

    return "light";
};

const initialTheme = resolveInitialTheme();
applyTheme(initialTheme);

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const nextTheme = body.classList.contains("dark-mode") ? "light" : "dark";
        applyTheme(nextTheme, { persist: true });
    });
}

const handleSystemThemeChange = (event) => {
    if (manualThemePreference) {
        return;
    }
    const prefersDark = event.matches;
    applyTheme(prefersDark ? "dark" : "light");
};

if (themeMediaQuery) {
    if (typeof themeMediaQuery.addEventListener === "function") {
        themeMediaQuery.addEventListener("change", handleSystemThemeChange);
    } else if (typeof themeMediaQuery.addListener === "function") {
        themeMediaQuery.addListener(handleSystemThemeChange);
    }
}

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

// Idea spark helper
const ideaOutput = document.getElementById("idea-output");
const newIdeaButton = document.getElementById("new-idea");
const copyIdeaButton = document.getElementById("copy-idea");
const ideaToast = document.getElementById("idea-toast");
const ideaPrompts = [
    "Prototype a micro-dashboard for live launch metrics.",
    "Design a welcome flow that adapts to first-time visitors.",
    "Map a swipeable card layout for quick comparisons.",
    "Draft a snack-sized onboarding checklist modal.",
    "Explore a color system that reacts to time of day.",
    "Sketch a team mood tracker with emoji voting.",
    "Build a collaborative idea wall with drag-and-drop cards.",
    "Lay out a minimal changelog feed with filters.",
    "Plot a responsive timeline for product milestones.",
    "Mock a mobile quick-capture panel for voice notes.",
    "Assemble a reusable component library starter grid.",
    "Spin up a guided tour overlay with focus states.",
];
let displayedIdea = ideaOutput?.textContent?.trim() || ideaPrompts[0];
let ideaToastTimer = null;

const updateIdeaToast = (message) => {
    if (!ideaToast) {
        return;
    }
    if (ideaToastTimer) {
        window.clearTimeout(ideaToastTimer);
        ideaToastTimer = null;
    }

    if (!message) {
        ideaToast.hidden = true;
        ideaToast.textContent = "";
        return;
    }

    ideaToast.hidden = false;
    ideaToast.textContent = message;
    ideaToastTimer = window.setTimeout(() => {
        ideaToast.hidden = true;
        ideaToastTimer = null;
    }, 2200);
};

const showIdea = (idea) => {
    if (!ideaOutput) {
        return;
    }
    displayedIdea = idea;
    ideaOutput.textContent = idea;
};

const pickRandomIdea = () => {
    if (!ideaPrompts.length) {
        return displayedIdea;
    }

    let idea = ideaPrompts[Math.floor(Math.random() * ideaPrompts.length)];
    if (ideaPrompts.length > 1) {
        let guard = 0;
        while (idea === displayedIdea && guard < 5) {
            idea = ideaPrompts[Math.floor(Math.random() * ideaPrompts.length)];
            guard += 1;
        }
    }
    return idea;
};

if (ideaOutput) {
    showIdea(displayedIdea);
}

if (newIdeaButton) {
    newIdeaButton.addEventListener("click", () => {
        const idea = pickRandomIdea();
        showIdea(idea);
        updateIdeaToast("New spark loaded.");
    });
}

if (copyIdeaButton) {
    copyIdeaButton.addEventListener("click", async () => {
        if (!displayedIdea) {
            return;
        }

        const fallbackCopy = () => {
            const tempInput = document.createElement("textarea");
            tempInput.value = displayedIdea;
            tempInput.setAttribute("readonly", "");
            tempInput.style.position = "absolute";
            tempInput.style.left = "-9999px";
            document.body.appendChild(tempInput);
            tempInput.select();
            try {
                document.execCommand("copy");
                updateIdeaToast("Idea copied to clipboard.");
            } catch (error) {
                console.warn("Copy command failed", error);
                updateIdeaToast("Copy not supported in this browser.");
            }
            document.body.removeChild(tempInput);
        };

        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            try {
                await navigator.clipboard.writeText(displayedIdea);
                updateIdeaToast("Idea copied to clipboard.");
                return;
            } catch (error) {
                console.warn("Clipboard copy failed", error);
            }
        }

        fallbackCopy();
    });
}

// Focus timer
const timerDisplay = document.getElementById("timer-display");
const timerToggle = document.getElementById("timer-toggle");
const timerReset = document.getElementById("timer-reset");
const timerStatus = document.getElementById("timer-status");
const timerPresetButtons = Array.from(document.querySelectorAll(".timer-preset"));
let timerDuration = 25 * 60;
let timerRemaining = timerDuration;
let timerIntervalId = null;
let timerEndTimestamp = null;
let timerRunning = false;

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");
    return `${mins}:${secs}`;
};

const updateTimerDisplay = () => {
    if (timerDisplay) {
        timerDisplay.textContent = formatTime(timerRemaining);
    }
};

const updateTimerStatus = (message) => {
    if (timerStatus) {
        timerStatus.textContent = message;
    }
};

const updateTimerToggleLabel = () => {
    if (!timerToggle) {
        return;
    }
    let label = "Start";
    if (timerRunning) {
        label = "Pause";
    } else if (timerRemaining > 0 && timerRemaining < timerDuration) {
        label = "Resume";
    }
    timerToggle.textContent = label;
};

const clearTimer = () => {
    if (timerIntervalId) {
        window.clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
    timerEndTimestamp = null;
};

const stopTimer = (message, { silent = false } = {}) => {
    if (!timerRunning) {
        if (!silent && message) {
            updateTimerStatus(message);
        }
        updateTimerToggleLabel();
        return;
    }
    timerRunning = false;
    clearTimer();
    if (!silent) {
        updateTimerStatus(message || "Paused for a breather.");
    }
    updateTimerToggleLabel();
};

const handleTimerComplete = () => {
    timerRunning = false;
    clearTimer();
    timerRemaining = 0;
    updateTimerDisplay();
    updateTimerStatus("Timer complete! Take a break.");
    updateTimerToggleLabel();
};

const startTimer = () => {
    if (timerRunning) {
        return;
    }
    if (timerRemaining <= 0) {
        timerRemaining = timerDuration;
    }
    timerRunning = true;
    timerEndTimestamp = Date.now() + timerRemaining * 1000;
    updateTimerStatus("Timer in motion.");
    updateTimerToggleLabel();

    timerIntervalId = window.setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((timerEndTimestamp - now) / 1000));
        timerRemaining = remaining;
        updateTimerDisplay();
        if (remaining <= 0) {
            handleTimerComplete();
        }
    }, 250);
};

const setTimerPreset = (minutes, announce = true) => {
    timerDuration = minutes * 60;
    if (!timerRunning) {
        timerRemaining = timerDuration;
        updateTimerDisplay();
    }
    timerPresetButtons.forEach((button) => {
        const isActive = Number(button.dataset.timerPreset) === minutes;
        button.classList.toggle("is-active", isActive);
    });
    if (announce) {
        updateTimerStatus(`Preset set to ${minutes} minutes.`);
    }
    updateTimerToggleLabel();
};

if (timerDisplay) {
    updateTimerDisplay();
    setTimerPreset(25, false);
}

if (timerToggle) {
    timerToggle.addEventListener("click", () => {
        if (timerRunning) {
            stopTimer();
        } else {
            startTimer();
        }
    });
}

if (timerReset) {
    timerReset.addEventListener("click", () => {
        stopTimer("Timer reset.");
        timerRemaining = timerDuration;
        updateTimerDisplay();
        updateTimerStatus("Back to the starting line.");
        updateTimerToggleLabel();
    });
}

if (timerPresetButtons.length) {
    timerPresetButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const minutes = Number(button.dataset.timerPreset);
            const wasRunning = timerRunning;
            stopTimer();
            timerRunning = false;
            timerRemaining = minutes * 60;
            setTimerPreset(minutes);
            updateTimerDisplay();
            if (wasRunning) {
                updateTimerStatus("Preset changed. Press start when ready.");
            }
        });
    });
}

// Notes board
const noteForm = document.getElementById("note-form");
const noteInput = document.getElementById("note-input");
const noteList = document.getElementById("note-list");
const noteEmpty = document.getElementById("note-empty");
const noteStorageKey = "codex-playground-notes";
let notes = [];

const saveNotes = () => {
    try {
        localStorage.setItem(noteStorageKey, JSON.stringify(notes));
    } catch (error) {
        console.warn("Unable to persist notes", error);
    }
};

const renderNotes = () => {
    if (!noteList) {
        return;
    }
    noteList.innerHTML = "";
    if (!notes.length) {
        if (noteEmpty) {
            noteEmpty.hidden = false;
        }
        return;
    }

    if (noteEmpty) {
        noteEmpty.hidden = true;
    }

    const fragment = document.createDocumentFragment();
    notes.forEach((note) => {
        const item = document.createElement("li");
        item.className = "note-item";
        item.dataset.noteId = note.id;

        const label = document.createElement("label");
        label.className = "note-label";
        label.setAttribute("for", `note-${note.id}`);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `note-${note.id}`;
        checkbox.checked = note.done;
        checkbox.dataset.noteId = note.id;

        const text = document.createElement("span");
        text.className = note.done ? "note-text is-done" : "note-text";
        text.textContent = note.text;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "note-delete";
        deleteButton.dataset.noteId = note.id;
        deleteButton.setAttribute("aria-label", `Delete note: ${note.text}`);
        deleteButton.textContent = "Remove";

        label.appendChild(checkbox);
        label.appendChild(text);
        item.appendChild(label);
        item.appendChild(deleteButton);

        fragment.appendChild(item);
    });

    noteList.appendChild(fragment);
};

const loadNotes = () => {
    let storedNotes = [];
    try {
        const raw = localStorage.getItem(noteStorageKey);
        if (raw) {
            storedNotes = JSON.parse(raw);
        }
    } catch (error) {
        console.warn("Unable to read stored notes", error);
    }

    if (Array.isArray(storedNotes)) {
        notes = storedNotes
            .filter((note) => note && typeof note.text === "string")
            .map((note) => ({
                id: String(note.id || Date.now() + Math.random()),
                text: note.text,
                done: Boolean(note.done),
            }));
    }
    renderNotes();
};

if (noteForm && noteInput) {
    noteForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const value = noteInput.value.trim();
        if (!value) {
            noteInput.value = "";
            noteInput.focus();
            return;
        }

        const note = {
            id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            text: value,
            done: false,
        };
        notes.unshift(note);
        noteInput.value = "";
        renderNotes();
        saveNotes();
        if (noteEmpty) {
            noteEmpty.hidden = true;
        }
    });
}

if (noteList) {
    noteList.addEventListener("change", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        const noteId = target.dataset.noteId;
        if (!noteId) {
            return;
        }
        notes = notes.map((note) =>
            note.id === noteId
                ? {
                      ...note,
                      done: target.checked,
                  }
                : note,
        );
        renderNotes();
        saveNotes();
    });

    noteList.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        if (!target.classList.contains("note-delete")) {
            return;
        }

        const noteId = target.dataset.noteId;
        if (!noteId) {
            return;
        }

        notes = notes.filter((note) => note.id !== noteId);
        renderNotes();
        saveNotes();
        if (!notes.length && noteEmpty) {
            noteEmpty.hidden = false;
        }
    });
}

loadNotes();

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
    const bestScoreValue = document.getElementById("best-score-value");
    const bestWaveValue = document.getElementById("best-wave-value");

    if (
        !ctx ||
        !startButton ||
        !scoreValue ||
        !livesValue ||
        !waveValue ||
        !statusMessage ||
        !bestScoreValue ||
        !bestWaveValue
    ) {
        console.warn("Space Invaders setup incomplete: required elements missing.");
        return;
    }

    const bestStatsKey = "codex-space-invaders-best";
    let bestScore = 0;
    let bestWave = 1;
    let highestWaveThisRun = 1;
    let achievedNewBest = false;

    const refreshBestDisplay = () => {
        bestScoreValue.textContent = String(bestScore);
        bestWaveValue.textContent = String(bestWave);
    };

    const persistBestStats = () => {
        try {
            localStorage.setItem(
                bestStatsKey,
                JSON.stringify({
                    score: bestScore,
                    wave: bestWave,
                }),
            );
        } catch (error) {
            console.warn("Unable to persist best score", error);
        }
    };

    const updateBestStats = (potentialScore, potentialWave) => {
        let improved = false;
        if (typeof potentialScore === "number" && potentialScore > bestScore) {
            bestScore = potentialScore;
            improved = true;
        }
        if (typeof potentialWave === "number" && potentialWave > bestWave) {
            bestWave = potentialWave;
            improved = true;
        }
        if (improved) {
            achievedNewBest = true;
            refreshBestDisplay();
            persistBestStats();
        }
        return improved;
    };

    const loadBestStats = () => {
        try {
            const raw = localStorage.getItem(bestStatsKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                    if (typeof parsed.score === "number" && Number.isFinite(parsed.score)) {
                        bestScore = Math.max(0, Math.floor(parsed.score));
                    }
                    if (typeof parsed.wave === "number" && Number.isFinite(parsed.wave)) {
                        bestWave = Math.max(1, Math.floor(parsed.wave));
                    }
                }
            }
        } catch (error) {
            console.warn("Unable to read stored best score", error);
        }
        refreshBestDisplay();
    };

    loadBestStats();

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
        refreshBestDisplay();
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
        highestWaveThisRun = Math.max(highestWaveThisRun, wave);
        updateBestStats(score, highestWaveThisRun);
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
        updateBestStats(score, highestWaveThisRun);
        const baseMessage = message || (didWin ? "Sector secure!" : "Game over.");
        statusMessage.textContent = achievedNewBest ? `${baseMessage} New personal best!` : baseMessage;
        drawScene();
    };

    const advanceWave = () => {
        wave += 1;
        highestWaveThisRun = Math.max(highestWaveThisRun, wave);
        updateHud();
        const improved = updateBestStats(score, highestWaveThisRun);
        statusMessage.textContent = improved
            ? `Wave ${wave} incoming! Personal best!`
            : `Wave ${wave} incoming!`;
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
                    const improved = updateBestStats(score, highestWaveThisRun);
                    statusMessage.textContent = improved
                        ? "Direct hit! New personal best!"
                        : "Direct hit!";
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
            const improved = updateBestStats(score, highestWaveThisRun);
            statusMessage.textContent = improved
                ? "Wave cleared! New personal best!"
                : "Wave cleared!";
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
        highestWaveThisRun = 1;
        achievedNewBest = false;
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
