const canvas = document.querySelector('#space');
const ctx = canvas.getContext('2d');
const controls = {
    mass: document.querySelector('#mass'),
    distance: document.querySelector('#distance'),
    velocity: document.querySelector('#velocity'),
    massOutput: document.querySelector('#mass-output'),
    distanceOutput: document.querySelector('#distance-output'),
    velocityOutput: document.querySelector('#velocity-output'),
    toggle: document.querySelector('[data-action="toggle"]'),
    reset: document.querySelector('[data-action="reset"]'),
    readout: document.querySelector('.readout')
};

const state = {
    running: true,
    G: 1,
    mass: Number(controls.mass.value),
    distance: Number(controls.distance.value),
    velocityFactor: Number(controls.velocity.value),
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    trail: [],
    lastTime: performance.now(),
    accumulator: 0,
    step: 0.02
};

function scaleFactor() {
    const viewRadius = 380;
    return Math.min(canvas.width, canvas.height) / (2 * viewRadius);
}

function toCanvas({ x, y }) {
    const scale = scaleFactor();
    return {
        x: canvas.width / 2 + x * scale,
        y: canvas.height / 2 - y * scale
    };
}

function fromInputs() {
    state.mass = Number(controls.mass.value);
    state.distance = Number(controls.distance.value);
    state.velocityFactor = Number(controls.velocity.value);

    controls.massOutput.textContent = `${state.mass.toFixed(1)}`;
    controls.distanceOutput.textContent = `${state.distance.toFixed(0)}`;
    controls.velocityOutput.textContent = `${state.velocityFactor.toFixed(2)}×`;
}

function resetOrbit() {
    fromInputs();
    state.trail = [];
    state.position = { x: state.distance, y: 0 };
    const circularVelocity = Math.sqrt((state.G * state.mass) / state.distance);
    state.velocity = { x: 0, y: circularVelocity * state.velocityFactor };
}

function integrate(stepSize) {
    const r = Math.hypot(state.position.x, state.position.y);
    const invR3 = 1 / Math.pow(r, 3);
    const accelScale = -state.G * state.mass * invR3;

    state.velocity.x += accelScale * state.position.x * stepSize;
    state.velocity.y += accelScale * state.position.y * stepSize;

    state.position.x += state.velocity.x * stepSize;
    state.position.y += state.velocity.y * stepSize;

    if (!Number.isFinite(state.position.x) || !Number.isFinite(state.position.y)) {
        resetOrbit();
        return;
    }

    state.trail.push({ x: state.position.x, y: state.position.y });
    const maxTrail = 420;
    if (state.trail.length > maxTrail) {
        state.trail.shift();
    }
}

function drawBackground() {
    ctx.fillStyle = 'rgba(5, 7, 15, 0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBlackHole() {
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const scale = scaleFactor();
    const horizonWorldRadius = 10 + state.mass * 0.3;
    const horizonPx = Math.max(10, horizonWorldRadius * scale);

    const gradient = ctx.createRadialGradient(center.x, center.y, horizonPx * 0.2, center.x, center.y, horizonPx * 1.2);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, horizonPx * 1.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(106, 228, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, horizonPx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawTrail() {
    if (state.trail.length < 2) return;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 1; i < state.trail.length; i++) {
        const start = toCanvas(state.trail[i - 1]);
        const end = toCanvas(state.trail[i]);
        const alpha = i / state.trail.length;
        ctx.strokeStyle = `rgba(106, 228, 255, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawEarth() {
    const earthPos = toCanvas(state.position);
    const earthRadius = 8;
    const gradient = ctx.createRadialGradient(earthPos.x - earthRadius * 0.6, earthPos.y - earthRadius * 0.6, earthRadius * 0.2, earthPos.x, earthPos.y, earthRadius * 1.4);
    gradient.addColorStop(0, '#8ae0ff');
    gradient.addColorStop(1, '#0067ff');

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(earthPos.x, earthPos.y, earthRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.stroke();
    ctx.restore();
}

function drawHUD() {
    const speed = Math.hypot(state.velocity.x, state.velocity.y);
    const distance = Math.hypot(state.position.x, state.position.y);
    const readout = [
        `<strong>Mass:</strong> ${state.mass.toFixed(1)} units`,
        `<strong>Distance:</strong> ${distance.toFixed(1)} units`,
        `<strong>Speed:</strong> ${speed.toFixed(3)} u/t`,
        `<strong>Velocity factor:</strong> ${state.velocityFactor.toFixed(2)}×`,
        state.running ? 'Simulation running' : 'Paused'
    ];
    controls.readout.innerHTML = readout.join('<br>');
}

function render() {
    drawBackground();
    drawTrail();
    drawBlackHole();
    drawEarth();
    drawHUD();
}

function step(timestamp) {
    const elapsed = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;
    const speedMultiplier = 1.1;
    state.accumulator += Math.min(elapsed * speedMultiplier, 0.1);

    if (state.running) {
        while (state.accumulator >= state.step) {
            integrate(state.step);
            state.accumulator -= state.step;
        }
    }

    render();
    requestAnimationFrame(step);
}

function toggleRunning() {
    state.running = !state.running;
    controls.toggle.textContent = state.running ? 'Pause' : 'Resume';
}

function handleResize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function init() {
    handleResize();
    fromInputs();
    resetOrbit();

    controls.mass.addEventListener('input', resetOrbit);
    controls.distance.addEventListener('input', resetOrbit);
    controls.velocity.addEventListener('input', resetOrbit);
    controls.toggle.addEventListener('click', toggleRunning);
    controls.reset.addEventListener('click', resetOrbit);
    window.addEventListener('resize', handleResize);

    requestAnimationFrame(step);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
