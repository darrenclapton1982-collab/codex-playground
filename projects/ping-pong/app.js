const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const PADDLE_WIDTH = 18;
const PADDLE_HEIGHT = 120;
const PLAYER_SPEED = 780;
const POINTER_SPEED = 920;
const CPU_OFFSET = 56;
const PLAYER_OFFSET = 56;
const BALL_SIZE = 20;
const BALL_BASE_SPEED = 560;
const BALL_MAX_SPEED = 960;
const BALL_ACCELERATION = 32;
const BALL_TRAIL_LENGTH = 18;
const WIN_SCORE = 11;
const COUNTDOWN_START = 3;

const DIFFICULTIES = {
    chill: {
        key: 'chill',
        label: 'Chill',
        description: 'Relaxed volleys, forgiving CPU, perfect for warming up.',
        aiSpeed: 420,
        reaction: 0.48,
        errorMargin: 140,
        spinScale: 0.82
    },
    arcade: {
        key: 'arcade',
        label: 'Arcade',
        description: 'Fast paced rallies with a focused opponent that adapts quickly.',
        aiSpeed: 540,
        reaction: 0.34,
        errorMargin: 90,
        spinScale: 1
    },
    pro: {
        key: 'pro',
        label: 'Pro',
        description: 'Surgical precision and heavy spin. Expect blistering volleys.',
        aiSpeed: 640,
        reaction: 0.22,
        errorMargin: 48,
        spinScale: 1.18
    }
};

const DIFFICULTY_DEFAULT = 'arcade';

const state = {
    root: null,
    canvas: null,
    ctx: null,
    phase: 'menu',
    pausedPhase: 'playing',
    lastTime: 0,
    display: {
        width: window.innerWidth,
        height: window.innerHeight,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        dpr: Math.min(window.devicePixelRatio || 1, 2)
    },
    ball: {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
        vx: 0,
        vy: 0,
        speed: BALL_BASE_SPEED,
        size: BALL_SIZE,
        trail: [],
        lastHitBy: null
    },
    paddles: {
        cpu: createPaddle(CPU_OFFSET),
        player: createPaddle(GAME_WIDTH - PLAYER_OFFSET - PADDLE_WIDTH)
    },
    scores: {
        cpu: 0,
        player: 0
    },
    stats: {
        currentRally: 0,
        longestRally: 0,
        totalRallies: 0,
        rallySum: 0,
        smashes: 0
    },
    background: {
        gridOffset: 0,
        stars: []
    },
    particles: [],
    controls: {
        keys: {
            up: false,
            down: false
        },
        pointerActive: false,
        pointerY: GAME_HEIGHT / 2
    },
    difficultyKey: DIFFICULTY_DEFAULT,
    difficulty: DIFFICULTIES[DIFFICULTY_DEFAULT],
    countdown: {
        active: false,
        remaining: 0,
        lastDisplayed: '',
        direction: 1
    },
    goalTimer: 0,
    toastTimer: null,
    toastHideTimer: null,
    audio: {
        ctx: null,
        master: null,
        enabled: true
    },
    ui: {
        overlay: null,
        screens: {},
        pauseButton: null,
        soundButton: null,
        fullscreenButton: null,
        startButton: null,
        resumeButton: null,
        restartButton: null,
        playAgainButton: null,
        changeDifficultyButton: null,
        matchInfo: null,
        rallyInfo: null,
        scores: {
            cpu: null,
            player: null
        },
        toast: null,
        countdown: null,
        difficultyButtons: [],
        difficultyDescription: null
    }
};

function createPaddle(x) {
    const y = (GAME_HEIGHT - PADDLE_HEIGHT) / 2;
    return {
        x,
        y,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        velocity: 0,
        targetY: y
    };
}

function init() {
    state.root = document.getElementById('game-root');
    state.canvas = document.getElementById('game-canvas');
    if (!state.canvas) {
        console.error('Neon Paddle: canvas element missing.');
        return;
    }

    state.ctx = state.canvas.getContext('2d');
    if (!state.ctx) {
        console.error('Neon Paddle: unable to obtain 2D context.');
        return;
    }

    state.ui.overlay = document.getElementById('overlay');
    state.ui.screens = {
        menu: state.ui.overlay?.querySelector('[data-screen="menu"]') || null,
        pause: state.ui.overlay?.querySelector('[data-screen="pause"]') || null,
        gameover: state.ui.overlay?.querySelector('[data-screen="gameover"]') || null
    };
    state.ui.pauseButton = document.getElementById('pause-button');
    state.ui.soundButton = document.getElementById('sound-button');
    state.ui.fullscreenButton = document.getElementById('fullscreen-button');
    state.ui.startButton = document.getElementById('start-button');
    state.ui.resumeButton = document.getElementById('resume-button');
    state.ui.restartButton = document.getElementById('restart-button');
    state.ui.playAgainButton = document.getElementById('play-again-button');
    state.ui.changeDifficultyButton = document.getElementById('change-difficulty-button');
    state.ui.matchInfo = document.getElementById('match-info');
    state.ui.rallyInfo = document.getElementById('rally-info');
    state.ui.scores.cpu = document.getElementById('score-left');
    state.ui.scores.player = document.getElementById('score-right');
    state.ui.toast = document.getElementById('toast');
    state.ui.countdown = document.getElementById('countdown');
    state.ui.difficultyButtons = Array.from(document.querySelectorAll('.difficulty-button'));
    state.ui.difficultyDescription = document.getElementById('difficulty-description');

    bindUIEvents();
    createStars(72);
    resetMatchState(true);
    updateMatchInfo();
    updateScores();
    updateRallyInfo();
    updateSoundButton();
    updateFullscreenButton();
    updatePauseButton();
    resizeCanvas();
    showOverlay('menu');

    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('blur', handleBlur, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    state.canvas.addEventListener('pointerdown', onPointerDown);
    state.canvas.addEventListener('pointermove', onPointerMove);
    state.canvas.addEventListener('pointerup', onPointerUp);
    state.canvas.addEventListener('pointercancel', onPointerUp);
    state.canvas.addEventListener('pointerleave', onPointerUp);

    requestAnimationFrame(gameLoop);
}

function bindUIEvents() {
    state.ui.difficultyButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const key = button.dataset.difficulty;
            if (key) {
                selectDifficulty(key);
            }
        });
    });

    if (state.ui.startButton) {
        state.ui.startButton.addEventListener('click', () => {
            primeAudio();
            startMatch();
        });
    }

    if (state.ui.pauseButton) {
        state.ui.pauseButton.addEventListener('click', () => {
            primeAudio();
            if (state.phase === 'paused') {
                togglePause(false);
            } else {
                togglePause(true);
            }
        });
    }

    if (state.ui.resumeButton) {
        state.ui.resumeButton.addEventListener('click', () => {
            primeAudio();
            togglePause(false);
        });
    }

    if (state.ui.restartButton) {
        state.ui.restartButton.addEventListener('click', () => {
            primeAudio();
            startMatch();
        });
    }

    if (state.ui.playAgainButton) {
        state.ui.playAgainButton.addEventListener('click', () => {
            primeAudio();
            startMatch();
        });
    }

    if (state.ui.changeDifficultyButton) {
        state.ui.changeDifficultyButton.addEventListener('click', () => {
            primeAudio();
            state.phase = 'menu';
            showOverlay('menu');
            updatePauseButton();
            resetMatchState(true);
        });
    }

    if (state.ui.soundButton) {
        state.ui.soundButton.addEventListener('click', () => {
            state.audio.enabled = !state.audio.enabled;
            if (state.audio.enabled) {
                primeAudio();
            }
            updateSoundButton();
            setToast(state.audio.enabled ? 'Sound on' : 'Sound muted', 'info', 900);
        });
    }

    if (state.ui.fullscreenButton) {
        state.ui.fullscreenButton.addEventListener('click', () => {
            toggleFullscreen();
        });
    }
}
function gameLoop(timestamp) {
    if (!state.lastTime) {
        state.lastTime = timestamp;
    }
    const delta = Math.min((timestamp - state.lastTime) / 1000, 0.1);
    state.lastTime = timestamp;

    update(delta);
    render();

    requestAnimationFrame(gameLoop);
}

function update(delta) {
    updateBackground(delta);
    updateParticles(delta);

    switch (state.phase) {
        case 'menu':
        case 'gameover':
            updateIdle(delta);
            break;
        case 'countdown':
            updatePlayer(delta);
            updateCpu(delta);
            updateCountdown(delta);
            break;
        case 'playing':
            updatePlayer(delta);
            updateCpu(delta);
            updateBall(delta);
            break;
        case 'goal':
            updatePlayer(delta);
            updateCpu(delta);
            updateGoal(delta);
            break;
        case 'paused':
            break;
        default:
            break;
    }
}

function render() {
    const ctx = state.ctx;
    if (!ctx) {
        return;
    }

    const { width, height, dpr } = state.display;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx, width, height);

    ctx.save();
    ctx.translate(state.display.offsetX, state.display.offsetY);
    ctx.scale(state.display.scale, state.display.scale);
    drawArena(ctx);
    ctx.restore();

    ctx.restore();
}

function drawArena(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, GAME_WIDTH, GAME_HEIGHT);
    gradient.addColorStop(0, 'rgba(2, 12, 28, 0.95)');
    gradient.addColorStop(0.5, 'rgba(3, 22, 46, 0.92)');
    gradient.addColorStop(1, 'rgba(0, 7, 18, 0.96)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawStarfield(ctx);
    drawNet(ctx);
    drawGlow(ctx);
    drawPaddles(ctx);
    drawBall(ctx);
    drawParticlesLayer(ctx);
}

function drawBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, height, width, 0);
    gradient.addColorStop(0, '#020617');
    gradient.addColorStop(0.5, '#030d21');
    gradient.addColorStop(1, '#01050f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const spacing = 140;
    const offset = state.background.gridOffset % spacing;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    for (let x = offset - spacing; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = offset - spacing; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawStarfield(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.75;
    for (const star of state.background.stars) {
        const size = star.size;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawNet(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.setLineDash([18, 22]);
    ctx.lineDashOffset = (state.background.gridOffset * 0.5) % 40;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH / 2, 40);
    ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT - 40);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

function drawGlow(ctx) {
    ctx.save();
    const glow = ctx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT / 2, 0, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT / 1.2);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.restore();
}

function drawPaddles(ctx) {
    drawPaddle(ctx, state.paddles.cpu, 'rgba(59, 130, 246, 0.85)', 'rgba(56, 189, 248, 0.5)');
    drawPaddle(ctx, state.paddles.player, 'rgba(94, 234, 212, 0.85)', 'rgba(94, 234, 212, 0.55)');
}

function drawPaddle(ctx, paddle, fill, glow) {
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
    ctx.fillStyle = fill;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.restore();
}

function drawBall(ctx) {
    const ball = state.ball;
    const half = ball.size / 2;

    ctx.save();

    for (let i = ball.trail.length - 1; i >= 0; i -= 1) {
        const trail = ball.trail[i];
        const ratio = i / ball.trail.length;
        const opacity = Math.max(0, Math.min(1, trail.life));
        ctx.globalAlpha = opacity * 0.35;
        ctx.fillStyle = 'rgba(56, 189, 248, 1)';
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, half * (0.7 + ratio * 0.2), 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1;
    const gradient = ctx.createRadialGradient(ball.x - half * 0.3, ball.y - half * 0.3, 4, ball.x, ball.y, half * 1.4);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(0.4, '#bae6fd');
    gradient.addColorStop(1, '#38bdf8');
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.75)';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, half, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawParticlesLayer(ctx) {
    ctx.save();
    for (const particle of state.particles) {
        const radius = particle.size;
        ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function updatePlayer(delta) {
    const paddle = state.paddles.player;
    const previousY = paddle.y;

    if (state.controls.pointerActive) {
        const target = clamp(state.controls.pointerY - PADDLE_HEIGHT / 2, 0, GAME_HEIGHT - PADDLE_HEIGHT);
        const diff = target - paddle.y;
        const maxMove = POINTER_SPEED * delta;
        if (Math.abs(diff) <= maxMove) {
            paddle.y = target;
        } else {
            paddle.y += Math.sign(diff) * maxMove;
        }
    } else {
        let velocity = 0;
        if (state.controls.keys.up && !state.controls.keys.down) {
            velocity = -PLAYER_SPEED;
        } else if (state.controls.keys.down && !state.controls.keys.up) {
            velocity = PLAYER_SPEED;
        }
        paddle.y = clamp(paddle.y + velocity * delta, 0, GAME_HEIGHT - PADDLE_HEIGHT);
    }

    paddle.velocity = (paddle.y - previousY) / Math.max(delta, 0.0001);
}

function updateCpu(delta) {
    const paddle = state.paddles.cpu;
    const previousY = paddle.y;
    const diff = state.difficulty;
    let targetCenter = GAME_HEIGHT / 2;

    if (state.ball.vx < 0) {
        targetCenter = predictBallY(paddle.x + paddle.width / 2);
    } else {
        const idle = GAME_HEIGHT / 2 + Math.sin(state.lastTime * 0.0018) * 60;
        targetCenter = idle;
    }

    const bias = (Math.random() - 0.5) * diff.errorMargin;
    paddle.targetY = clamp(targetCenter - PADDLE_HEIGHT / 2 + bias, 12, GAME_HEIGHT - PADDLE_HEIGHT - 12);

    const deltaY = paddle.targetY - paddle.y;
    const maxMove = diff.aiSpeed * delta;
    if (Math.abs(deltaY) > 0.5) {
        paddle.y += clamp(deltaY, -maxMove, maxMove);
    }
    paddle.y = clamp(paddle.y, 0, GAME_HEIGHT - PADDLE_HEIGHT);
    paddle.velocity = (paddle.y - previousY) / Math.max(delta, 0.0001);
}

function updateBall(delta) {
    const ball = state.ball;
    const half = ball.size / 2;

    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;

    ball.trail.unshift({ x: ball.x, y: ball.y, life: 1 });
    if (ball.trail.length > BALL_TRAIL_LENGTH) {
        ball.trail.length = BALL_TRAIL_LENGTH;
    }
    ball.trail.forEach((trace) => {
        trace.life -= delta * 3.8;
    });
    ball.trail = ball.trail.filter((trace) => trace.life > 0);

    if (ball.y - half <= 0) {
        ball.y = half;
        ball.vy *= -1;
        playWallBounce();
        spawnParticles(ball.x, half + 2, 10, 'rgba(56, 189, 248, 0.65)', 120);
    } else if (ball.y + half >= GAME_HEIGHT) {
        ball.y = GAME_HEIGHT - half;
        ball.vy *= -1;
        playWallBounce();
        spawnParticles(ball.x, GAME_HEIGHT - half - 2, 10, 'rgba(56, 189, 248, 0.65)', 120);
    }

    const cpu = state.paddles.cpu;
    const player = state.paddles.player;

    if (ball.vx < 0 && ball.x - half <= cpu.x + cpu.width && ball.y + half >= cpu.y && ball.y - half <= cpu.y + cpu.height) {
        ball.x = cpu.x + cpu.width + half;
        bounceBallFromPaddle(cpu, 1);
    } else if (ball.vx > 0 && ball.x + half >= player.x && ball.y + half >= player.y && ball.y - half <= player.y + player.height) {
        ball.x = player.x - half;
        bounceBallFromPaddle(player, -1);
    }

    if (ball.x < -ball.size * 2) {
        awardPoint('player');
    } else if (ball.x > GAME_WIDTH + ball.size * 2) {
        awardPoint('cpu');
    }
}

function bounceBallFromPaddle(paddle, direction) {
    const ball = state.ball;
    const relative = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
    const clamped = clamp(relative, -1, 1);
    const spin = paddle.velocity * 0.32;
    state.ball.speed = clamp(state.ball.speed + BALL_ACCELERATION, BALL_BASE_SPEED, BALL_MAX_SPEED);

    const vy = (state.ball.speed * clamped * 0.9) + spin;
    ball.vx = direction * Math.sqrt(Math.max(state.ball.speed ** 2 - vy ** 2, BALL_BASE_SPEED ** 2 * 0.35));
    ball.vy = vy;

    ball.lastHitBy = direction > 0 ? 'cpu' : 'player';
    state.stats.currentRally += 1;

    if (ball.lastHitBy === 'player' && state.ball.speed > BALL_BASE_SPEED + 220) {
        state.stats.smashes += 1;
    }

    playPaddleBounce();
    spawnParticles(ball.x, ball.y, 14, direction > 0 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(94, 234, 212, 0.8)', 200);
}

function updateCountdown(delta) {
    if (!state.countdown.active) {
        return;
    }

    state.countdown.remaining -= delta;

    if (state.countdown.remaining <= 0) {
        state.countdown.active = false;
        if (state.ui.countdown) {
            state.ui.countdown.textContent = 'Go!';
            window.setTimeout(() => {
                if (!state.countdown.active && state.ui.countdown) {
                    state.ui.countdown.textContent = '';
                }
            }, 320);
        }
        startRally(state.countdown.direction);
        return;
    }

    const nextValue = Math.ceil(state.countdown.remaining);
    if (String(nextValue) !== state.countdown.lastDisplayed) {
        state.countdown.lastDisplayed = String(nextValue);
        if (state.ui.countdown) {
            state.ui.countdown.textContent = String(nextValue);
        }
        playCountdownTone(nextValue);
    }
}

function updateGoal(delta) {
    state.goalTimer -= delta;
    if (state.goalTimer <= 0) {
        enterCountdown(state.countdown.direction);
    }
}
function updateIdle(delta) {
    const base = (GAME_HEIGHT - PADDLE_HEIGHT) / 2;
    const sway = Math.sin(state.lastTime * 0.0012) * 80;
    const swayOpposite = Math.cos(state.lastTime * 0.0014) * 80;
    state.paddles.player.y = clamp(base + sway, 0, GAME_HEIGHT - PADDLE_HEIGHT);
    state.paddles.cpu.y = clamp(base + swayOpposite, 0, GAME_HEIGHT - PADDLE_HEIGHT);
    state.ball.x = GAME_WIDTH / 2 + Math.sin(state.lastTime * 0.0011) * 160;
    state.ball.y = GAME_HEIGHT / 2 + Math.cos(state.lastTime * 0.0013) * 90;
    state.ball.trail = [];
}

function updateBackground(delta) {
    state.background.gridOffset += delta * 48;
    const stars = state.background.stars;
    for (const star of stars) {
        star.y += star.speed * delta * 60;
        if (star.y > GAME_HEIGHT + 20) {
            star.y = -20;
            star.x = Math.random() * GAME_WIDTH;
        }
        star.size += Math.sin(state.lastTime * 0.002 + star.seed) * 0.01;
        star.size = clamp(star.size, star.baseSize * 0.6, star.baseSize * 1.4);
    }
}

function updateParticles(delta) {
    state.particles.forEach((particle) => {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.life -= delta;
    });
    state.particles = state.particles.filter((particle) => particle.life > 0);
}

function updatePlayerScoreboard() {
    updateScores();
    updateRallyInfo();
    updatePauseButton();
}

function startMatch() {
    hideOverlay();
    resetMatchState(true);
    updatePauseButton();
    setToast('Match start', 'info', 1000);
    const direction = Math.random() < 0.5 ? -1 : 1;
    enterCountdown(direction);
}

function resetMatchState(resetScores) {
    if (resetScores) {
        state.scores.cpu = 0;
        state.scores.player = 0;
        state.stats.longestRally = 0;
        state.stats.totalRallies = 0;
        state.stats.rallySum = 0;
        state.stats.smashes = 0;
    }
    state.stats.currentRally = 0;
    resetPositions();
    updateScores();
    updateRallyInfo();
    state.ball.speed = BALL_BASE_SPEED;
}

function resetPositions() {
    state.ball.x = GAME_WIDTH / 2;
    state.ball.y = GAME_HEIGHT / 2;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.speed = BALL_BASE_SPEED;
    state.ball.trail = [];
    state.paddles.cpu = createPaddle(CPU_OFFSET);
    state.paddles.player = createPaddle(GAME_WIDTH - PLAYER_OFFSET - PADDLE_WIDTH);
}

function setCountdown(direction) {
    state.countdown.active = true;
    state.countdown.remaining = COUNTDOWN_START;
    state.countdown.direction = direction;
    state.countdown.lastDisplayed = '';
    if (state.ui.countdown) {
        state.ui.countdown.textContent = String(COUNTDOWN_START);
    }
}

function enterCountdown(direction) {
    state.phase = 'countdown';
    state.pausedPhase = 'countdown';
    setCountdown(direction);
}

function startRally(direction) {
    state.phase = 'playing';
    state.pausedPhase = 'playing';
    state.ball.speed = BALL_BASE_SPEED;
    serveBall(direction);
    updatePauseButton();
    playServeTone();
}

function serveBall(direction) {
    const angle = (Math.random() * 0.5 - 0.25) * (direction > 0 ? -1 : 1);
    state.ball.vx = Math.cos(angle) * state.ball.speed * direction;
    state.ball.vy = Math.sin(angle) * state.ball.speed;
    if (Math.abs(state.ball.vy) < 120) {
        state.ball.vy = 120 * Math.sign(state.ball.vy || 1);
    }
    state.ball.trail = [];
    state.stats.currentRally = 0;
}

function awardPoint(side) {
    const scorer = side === 'player' ? 'player' : 'cpu';
    state.scores[scorer] += 1;

    state.stats.totalRallies += 1;
    state.stats.rallySum += state.stats.currentRally;
    state.stats.longestRally = Math.max(state.stats.longestRally, state.stats.currentRally);
    state.stats.currentRally = 0;

    updatePlayerScoreboard();

    playScoreTone(scorer);
    setToast(scorer === 'player' ? 'You scored' : 'CPU scored', scorer === 'player' ? 'success' : 'danger');

    const burstX = scorer === 'player' ? GAME_WIDTH - 80 : 80;
    spawnParticles(burstX, GAME_HEIGHT / 2, 32, scorer === 'player' ? 'rgba(94, 234, 212, 0.9)' : 'rgba(59, 130, 246, 0.9)', 260);

    if (state.scores[scorer] >= WIN_SCORE) {
        endMatch(scorer);
        return;
    }

    state.goalTimer = 1.2;
    state.phase = 'goal';
    state.countdown.direction = scorer === 'player' ? -1 : 1;
    resetPositions();
}

function endMatch(winner) {
    state.phase = 'gameover';
    state.pausedPhase = 'playing';
    resetPositions();
    updatePauseButton();

    const title = document.getElementById('gameover-title');
    const subtitle = document.getElementById('gameover-subtitle');
    if (title) {
        title.textContent = winner === 'player' ? 'Victory' : 'Defeat';
    }
    if (subtitle) {
        if (winner === 'player') {
            subtitle.textContent = 'You outpaced the CPU and claimed the match.';
        } else {
            subtitle.textContent = 'The CPU held control this time. Adjust and retry.';
        }
    }

    const avg = state.stats.totalRallies > 0 ? state.stats.rallySum / state.stats.totalRallies : 0;
    const longestEl = document.getElementById('stat-longest');
    const avgEl = document.getElementById('stat-average');
    const smashEl = document.getElementById('stat-smashes');
    if (longestEl) {
        longestEl.textContent = state.stats.longestRally.toFixed(0);
    }
    if (avgEl) {
        avgEl.textContent = avg.toFixed(1);
    }
    if (smashEl) {
        smashEl.textContent = state.stats.smashes.toFixed(0);
    }

    showOverlay('gameover');
    playMatchEndTone(winner);
}
function updatePauseButton() {
    const button = state.ui.pauseButton;
    if (!button) {
        return;
    }
    const disabled = state.phase === 'menu' || state.phase === 'gameover';
    button.disabled = disabled;
    button.textContent = state.phase === 'paused' ? 'Resume' : 'Pause';
}

function updateScores() {
    if (state.ui.scores.cpu) {
        state.ui.scores.cpu.textContent = String(state.scores.cpu);
    }
    if (state.ui.scores.player) {
        state.ui.scores.player.textContent = String(state.scores.player);
    }
}

function updateMatchInfo() {
    if (!state.ui.matchInfo) {
        return;
    }
    state.ui.matchInfo.textContent = `Difficulty: ${state.difficulty.label} | Race to ${WIN_SCORE}`;
}

function updateRallyInfo() {
    if (!state.ui.rallyInfo) {
        return;
    }
    state.ui.rallyInfo.textContent = `Current rally: ${state.stats.currentRally} | Longest: ${state.stats.longestRally}`;
}

function togglePause(forcePause) {
    if (state.phase === 'menu' || state.phase === 'gameover') {
        return;
    }

    const shouldPause = forcePause === true || (forcePause !== false && state.phase !== 'paused');

    if (shouldPause && state.phase !== 'paused') {
        state.pausedPhase = state.phase;
        state.phase = 'paused';
        showOverlay('pause');
        updatePauseButton();
        setToast('Paused', 'info', 900);
        return;
    }

    if (!shouldPause && state.phase === 'paused') {
        state.phase = state.pausedPhase;
        hideOverlay();
        updatePauseButton();
        setToast('Resume', 'info', 700);
    }
}

function selectDifficulty(key) {
    const difficulty = DIFFICULTIES[key];
    if (!difficulty) {
        return;
    }
    state.difficultyKey = key;
    state.difficulty = difficulty;
    state.ui.difficultyButtons.forEach((button) => {
        button.classList.toggle('is-active', button.dataset.difficulty === key);
    });
    if (state.ui.difficultyDescription) {
        state.ui.difficultyDescription.textContent = difficulty.description;
    }
    updateMatchInfo();
}

function resizeCanvas() {
    const { innerWidth, innerHeight } = window;
    state.display.width = innerWidth;
    state.display.height = innerHeight;

    const scale = Math.min(innerWidth / GAME_WIDTH, innerHeight / GAME_HEIGHT);
    state.display.scale = scale;
    state.display.offsetX = (innerWidth - GAME_WIDTH * scale) / 2;
    state.display.offsetY = (innerHeight - GAME_HEIGHT * scale) / 2;

    state.canvas.style.width = `${innerWidth}px`;
    state.canvas.style.height = `${innerHeight}px`;
    state.canvas.width = Math.round(innerWidth * state.display.dpr);
    state.canvas.height = Math.round(innerHeight * state.display.dpr);
}

function showOverlay(screen) {
    if (!state.ui.overlay) {
        return;
    }
    state.ui.overlay.classList.add('is-active');
    Object.entries(state.ui.screens).forEach(([key, panel]) => {
        if (!panel) {
            return;
        }
        panel.hidden = key !== screen;
    });
}

function hideOverlay() {
    if (!state.ui.overlay) {
        return;
    }
    state.ui.overlay.classList.remove('is-active');
}

function setToast(message, tone = 'info', duration = 1400) {
    const toast = state.ui.toast;
    if (!toast) {
        return;
    }
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.hidden = false;
    toast.classList.add('is-visible');

    if (state.toastTimer) {
        window.clearTimeout(state.toastTimer);
    }
    if (state.toastHideTimer) {
        window.clearTimeout(state.toastHideTimer);
    }

    state.toastTimer = window.setTimeout(() => {
        toast.classList.remove('is-visible');
        state.toastHideTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 280);
    }, duration);
}

function spawnParticles(x, y, count, color, speed) {
    for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const magnitude = (Math.random() * 0.5 + 0.5) * speed;
        state.particles.push({
            x,
            y,
            vx: Math.cos(angle) * magnitude,
            vy: Math.sin(angle) * magnitude,
            life: 0.45 + Math.random() * 0.35,
            maxLife: 0.7,
            size: Math.random() * 6 + 2,
            color
        });
    }
}

function createStars(count) {
    state.background.stars = Array.from({ length: count }).map(() => {
        const baseSize = Math.random() * 1.6 + 0.4;
        return {
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT,
            size: baseSize,
            baseSize,
            speed: Math.random() * 0.65 + 0.28,
            seed: Math.random() * Math.PI * 2,
            color: Math.random() > 0.5 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(14, 165, 233, 0.38)'
        };
    });
}
function predictBallY(targetX) {
    const ball = state.ball;
    if (ball.vx >= 0) {
        return GAME_HEIGHT / 2;
    }
    const time = (targetX - ball.x) / ball.vx;
    if (!Number.isFinite(time) || time < 0) {
        return GAME_HEIGHT / 2;
    }
    let projected = ball.y + ball.vy * time;
    const minY = BALL_SIZE / 2;
    const maxY = GAME_HEIGHT - BALL_SIZE / 2;
    while (projected < minY || projected > maxY) {
        if (projected < minY) {
            projected = minY + (minY - projected);
        } else if (projected > maxY) {
            projected = maxY - (projected - maxY);
        }
    }
    return projected;
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            state.controls.keys.up = true;
            event.preventDefault();
            break;
        case 'ArrowDown':
        case 'KeyS':
            state.controls.keys.down = true;
            event.preventDefault();
            break;
        case 'Space':
            event.preventDefault();
            primeAudio();
            if (state.phase === 'menu') {
                startMatch();
            } else {
                togglePause();
            }
            break;
        case 'KeyF':
            event.preventDefault();
            toggleFullscreen();
            break;
        case 'KeyM':
            event.preventDefault();
            if (state.ui.soundButton) {
                state.ui.soundButton.click();
            }
            break;
        default:
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            state.controls.keys.up = false;
            event.preventDefault();
            break;
        case 'ArrowDown':
        case 'KeyS':
            state.controls.keys.down = false;
            event.preventDefault();
            break;
        default:
            break;
    }
}

function onPointerDown(event) {
    primeAudio();
    state.controls.pointerActive = true;
    state.controls.pointerY = getPointerY(event);
    if (state.canvas.setPointerCapture) {
        state.canvas.setPointerCapture(event.pointerId);
    }
}

function onPointerMove(event) {
    if (!state.controls.pointerActive) {
        return;
    }
    state.controls.pointerY = getPointerY(event);
}

function onPointerUp(event) {
    state.controls.pointerActive = false;
    if (state.canvas.releasePointerCapture) {
        try {
            state.canvas.releasePointerCapture(event.pointerId);
        } catch (err) {
            // ignore
        }
    }
}

function getPointerY(event) {
    const rect = state.canvas.getBoundingClientRect();
    const relative = clamp(event.clientY - rect.top, 0, rect.height);
    const scaleY = GAME_HEIGHT / rect.height;
    return clamp(relative * scaleY, 0, GAME_HEIGHT);
}

function handleBlur() {
    if (state.phase === 'playing' || state.phase === 'countdown' || state.phase === 'goal') {
        togglePause(true);
    }
}

function handleVisibilityChange() {
    if (document.hidden && (state.phase === 'playing' || state.phase === 'countdown' || state.phase === 'goal')) {
        togglePause(true);
    }
}

function toggleFullscreen() {
    const element = state.root || document.documentElement;
    if (!document.fullscreenElement) {
        element.requestFullscreen?.().catch(() => {});
    } else {
        document.exitFullscreen?.().catch(() => {});
    }
}

function updateFullscreenButton() {
    const button = state.ui.fullscreenButton;
    if (!button) {
        return;
    }
    const active = Boolean(document.fullscreenElement);
    button.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
}

function updateSoundButton() {
    const button = state.ui.soundButton;
    if (!button) {
        return;
    }
    button.textContent = state.audio.enabled ? 'Sound: On' : 'Sound: Off';
    button.setAttribute('aria-pressed', state.audio.enabled ? 'true' : 'false');
}

function primeAudio() {
    if (!state.audio.enabled) {
        return;
    }
    ensureAudioContext();
}

function ensureAudioContext() {
    if (!state.audio.enabled) {
        return null;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
        state.audio.enabled = false;
        updateSoundButton();
        return null;
    }
    if (!state.audio.ctx) {
        state.audio.ctx = new AudioCtx();
        state.audio.master = state.audio.ctx.createGain();
        state.audio.master.gain.value = 0.22;
        state.audio.master.connect(state.audio.ctx.destination);
    }
    if (state.audio.ctx.state === 'suspended') {
        state.audio.ctx.resume().catch(() => {});
    }
    return state.audio.ctx;
}

function playTone({ frequency, duration, volume = 0.28, type = 'sine', glide = 0, fade = 0.16 }) {
    const ctx = ensureAudioContext();
    if (!ctx || !state.audio.master) {
        return;
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (glide !== 0) {
        osc.frequency.linearRampToValueAtTime(frequency + glide, now + duration);
    }

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.linearRampToValueAtTime(0, now + Math.max(duration - fade, 0.02));
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(state.audio.master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
}

function playPaddleBounce() {
    playTone({ frequency: 360, duration: 0.16, volume: 0.26, type: 'triangle', glide: 40 });
}

function playWallBounce() {
    playTone({ frequency: 260, duration: 0.14, volume: 0.22, type: 'sine', glide: -20 });
}

function playScoreTone(scorer) {
    if (scorer === 'player') {
        playTone({ frequency: 520, duration: 0.36, volume: 0.32, type: 'sawtooth', glide: 120 });
    } else {
        playTone({ frequency: 220, duration: 0.32, volume: 0.26, type: 'triangle', glide: -60 });
    }
}

function playMatchEndTone(winner) {
    if (winner === 'player') {
        playTone({ frequency: 660, duration: 0.5, volume: 0.34, type: 'sawtooth', glide: 180 });
        playTone({ frequency: 880, duration: 0.4, volume: 0.28, type: 'triangle', glide: 60 });
    } else {
        playTone({ frequency: 220, duration: 0.6, volume: 0.3, type: 'sine', glide: -80 });
    }
}

function playCountdownTone(value) {
    if (value === 1) {
        playTone({ frequency: 480, duration: 0.24, volume: 0.26, type: 'triangle', glide: 90 });
        return;
    }
    playTone({ frequency: 340 + (COUNTDOWN_START - value) * 40, duration: 0.18, volume: 0.22, type: 'triangle' });
}

function playServeTone() {
    playTone({ frequency: 420, duration: 0.22, volume: 0.28, type: 'square', glide: 60 });
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}







