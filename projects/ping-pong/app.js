const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 420;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const PADDLE_OFFSET = 28;
const BALL_SIZE = 12;
const PLAYER_SPEED = 460;
const AI_SPEED = 320;
const BALL_SPEED = 360;
const WIN_SCORE = 5;
const MIN_VERTICAL_VELOCITY = 90;

const keys = {
    up: false,
    down: false
};

const state = {
    canvas: null,
    ctx: null,
    running: false,
    rafId: null,
    lastTime: 0,
    winner: null,
    ball: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        vx: 0,
        vy: 0
    },
    paddles: {
        left: { x: PADDLE_OFFSET, y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2 },
        right: { x: CANVAS_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH, y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2 }
    },
    scores: { left: 0, right: 0 },
    ui: {
        leftScore: null,
        rightScore: null,
        toggleButton: null,
        statusMessage: null
    }
};

export function init() {
    state.canvas = document.getElementById('game-canvas');
    if (!state.canvas) {
        console.error('Ping Pong: canvas element missing.');
        return;
    }

    state.ctx = state.canvas.getContext('2d');
    if (!state.ctx) {
        console.error('Ping Pong: unable to obtain 2D context.');
        return;
    }

    state.canvas.width = CANVAS_WIDTH;
    state.canvas.height = CANVAS_HEIGHT;

    state.ui.leftScore = document.getElementById('left-score');
    state.ui.rightScore = document.getElementById('right-score');
    state.ui.toggleButton = document.getElementById('toggle');
    state.ui.statusMessage = document.getElementById('status-message');

    if (!state.ui.leftScore || !state.ui.rightScore || !state.ui.toggleButton || !state.ui.statusMessage) {
        console.error('Ping Pong: one or more HUD elements are missing.');
        return;
    }

    state.ui.toggleButton.addEventListener('click', toggleGame);
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', handleBlur);

    resetGame();
    draw();
}

function toggleGame() {
    if (state.running) {
        pauseGame();
        return;
    }

    if (state.winner) {
        resetGame();
    }

    startGame();
}

function startGame() {
    if (state.running) {
        return;
    }

    state.running = true;
    state.ui.toggleButton.textContent = 'Pause';
    if (!state.winner) {
        state.ui.statusMessage.textContent = 'Game on! First to 5 points wins.';
    }

    if (state.ball.vx === 0 && state.ball.vy === 0) {
        const direction = Math.random() < 0.5 ? -1 : 1;
        serveBall(direction);
    }

    state.lastTime = performance.now();
    state.rafId = requestAnimationFrame(gameLoop);
}

function pauseGame(message) {
    state.running = false;
    if (typeof message === 'string') {
        state.ui.statusMessage.textContent = message;
    } else if (!state.winner) {
        state.ui.statusMessage.textContent = 'Paused. Press Resume to continue.';
    }

    state.ui.toggleButton.textContent = state.winner ? 'Restart' : 'Resume';
    draw();
}

function resetGame() {
    state.winner = null;
    state.scores.left = 0;
    state.scores.right = 0;
    updateScores();

    keys.up = false;
    keys.down = false;

    resetPositions();
    state.ball.vx = 0;
    state.ball.vy = 0;

    state.ui.toggleButton.textContent = 'Start';
    state.ui.statusMessage.textContent = 'First to 5 points wins.';
}

function resetPositions() {
    state.ball.x = CANVAS_WIDTH / 2;
    state.ball.y = CANVAS_HEIGHT / 2;

    state.paddles.left.y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
    state.paddles.right.y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
}

function serveBall(direction) {
    const spread = 0.6; // limit the serve angle so rallies start playable
    const offset = Math.random() * spread - spread / 2;
    state.ball.vx = direction * BALL_SPEED;
    state.ball.vy = offset * BALL_SPEED;

    if (Math.abs(state.ball.vy) < MIN_VERTICAL_VELOCITY) {
        state.ball.vy = MIN_VERTICAL_VELOCITY * Math.sign(state.ball.vy || 1);
    }
}

function gameLoop(timestamp) {
    if (!state.running) {
        state.rafId = null;
        return;
    }

    const delta = Math.min((timestamp - state.lastTime) / 1000, 0.1);
    state.lastTime = timestamp;

    update(delta);
    draw();

    state.rafId = requestAnimationFrame(gameLoop);
}

function update(delta) {
    updatePlayer(delta);
    updateAI(delta);
    updateBall(delta);
}

function updatePlayer(delta) {
    const paddle = state.paddles.right;
    let velocity = 0;

    if (keys.up && !keys.down) {
        velocity = -PLAYER_SPEED;
    } else if (keys.down && !keys.up) {
        velocity = PLAYER_SPEED;
    }

    if (velocity !== 0) {
        paddle.y += velocity * delta;
        paddle.y = clamp(paddle.y, 0, CANVAS_HEIGHT - PADDLE_HEIGHT);
    }
}

function updateAI(delta) {
    const paddle = state.paddles.left;
    const ball = state.ball;
    const anticipation = ball.vx < 0 ? 1 : 0.55;
    const target = ball.y - PADDLE_HEIGHT / 2;
    const diff = target - paddle.y;
    const maxMove = AI_SPEED * anticipation * delta;

    if (Math.abs(diff) > 3) {
        paddle.y += clamp(diff, -maxMove, maxMove);
        paddle.y = clamp(paddle.y, 0, CANVAS_HEIGHT - PADDLE_HEIGHT);
    }
}

function updateBall(delta) {
    const ball = state.ball;
    const half = BALL_SIZE / 2;

    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;

    if (ball.y - half <= 0) {
        ball.y = half;
        ball.vy *= -1;
    } else if (ball.y + half >= CANVAS_HEIGHT) {
        ball.y = CANVAS_HEIGHT - half;
        ball.vy *= -1;
    }

    const left = state.paddles.left;
    const right = state.paddles.right;

    if (ball.vx < 0 && ball.x - half <= left.x + PADDLE_WIDTH && ball.y >= left.y && ball.y <= left.y + PADDLE_HEIGHT) {
        ball.x = left.x + PADDLE_WIDTH + half;
        bounceFromPaddle(left, 1);
    } else if (ball.vx > 0 && ball.x + half >= right.x && ball.y >= right.y && ball.y <= right.y + PADDLE_HEIGHT) {
        ball.x = right.x - half;
        bounceFromPaddle(right, -1);
    }

    if (ball.x < -BALL_SIZE) {
        awardPoint('right');
    } else if (ball.x > CANVAS_WIDTH + BALL_SIZE) {
        awardPoint('left');
    }
}

function bounceFromPaddle(paddle, direction) {
    const center = paddle.y + PADDLE_HEIGHT / 2;
    const difference = state.ball.y - center;
    const normalised = clamp(difference / (PADDLE_HEIGHT / 2), -1, 1);

    state.ball.vx = direction * BALL_SPEED;
    state.ball.vy = normalised * BALL_SPEED;

    if (Math.abs(state.ball.vy) < MIN_VERTICAL_VELOCITY) {
        state.ball.vy = MIN_VERTICAL_VELOCITY * Math.sign(state.ball.vy || 1);
    }
}

function awardPoint(side) {
    state.scores[side] += 1;
    updateScores();

    const scorerLabel = side === 'right' ? 'You' : 'CPU';

    if (state.scores[side] >= WIN_SCORE) {
        state.winner = side;
        pauseGame(scorerLabel + ' win! Press Restart to play again.');
        return;
    }

    state.ui.statusMessage.textContent = scorerLabel + ' scored!';
    resetPositions();
    serveBall(side === 'left' ? 1 : -1);
}

function updateScores() {
    state.ui.leftScore.textContent = String(state.scores.left);
    state.ui.rightScore.textContent = String(state.scores.right);
}

function draw() {
    if (!state.ctx) {
        return;
    }

    const ctx = state.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'rgba(6, 16, 32, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 16]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(state.paddles.right.x, state.paddles.right.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.fillStyle = '#facc15';
    ctx.fillRect(state.paddles.left.x, state.paddles.left.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(state.ball.x - BALL_SIZE / 2, state.ball.y - BALL_SIZE / 2, BALL_SIZE, BALL_SIZE);
}

function onKeyDown(event) {
    if (event.key === 'ArrowUp' || event.key === 'Up') {
        keys.up = true;
        event.preventDefault();
    } else if (event.key === 'ArrowDown' || event.key === 'Down') {
        keys.down = true;
        event.preventDefault();
    } else if (event.key === 'w' || event.key === 'W') {
        keys.up = true;
    } else if (event.key === 's' || event.key === 'S') {
        keys.down = true;
    }
}

function onKeyUp(event) {
    if (event.key === 'ArrowUp' || event.key === 'Up' || event.key === 'w' || event.key === 'W') {
        keys.up = false;
    }

    if (event.key === 'ArrowDown' || event.key === 'Down' || event.key === 's' || event.key === 'S') {
        keys.down = false;
    }
}

function handleBlur() {
    keys.up = false;
    keys.down = false;
    if (state.running) {
        pauseGame('Paused because the window lost focus.');
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
