import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import {
    WORLD_HEIGHT,
    COLORS,
    DIFFICULTIES,
    POWERUP_TYPES,
    PLAYER,
    INVADERS,
    BOMB_SPEED,
    POWERUP_FALL_SPEED,
    SHIELD_MAX
} from "./config.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function createRectMesh(width, height, color) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({ color });
    return new THREE.Mesh(geometry, material);
}

function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 400;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 250;
        positions[i * 3 + 2] = -50 - Math.random() * 50;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.8 });
    return new THREE.Points(starGeometry, starMaterial);
}

function createGridGlow(width, height) {
    const geometry = new THREE.PlaneGeometry(width, height, 10, 10);
    const material = new THREE.MeshBasicMaterial({
        color: 0x0d1b46,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -20;
    return mesh;
}

function aabbCollide(a, b) {
    return (
        Math.abs(a.position.x - b.position.x) * 2 < a.size.w + b.size.w &&
        Math.abs(a.position.y - b.position.y) * 2 < a.size.h + b.size.h
    );
}

function rollPowerup() {
    const roll = Math.random();
    let cursor = 0;
    for (const item of POWERUP_TYPES) {
        cursor += item.chance;
        if (roll <= cursor) return item;
    }
    return null;
}

export function createSpaceInvadersGame(canvas, hud, input, statusCallback) {
    return new SpaceInvadersGame(canvas, hud, input, statusCallback);
}

class SpaceInvadersGame {
    constructor(canvas, hud, input, statusCallback = () => {}) {
        this.canvas = canvas;
        this.hud = hud;
        this.input = input;
        this.statusCallback = statusCallback;
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setClearColor(COLORS.backdrop, 1);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera();
        this.viewHeight = WORLD_HEIGHT;
        this.viewWidth = WORLD_HEIGHT;
        this.running = false;
        this.paused = false;
        this.entities = { invaders: [], bullets: [], bombs: [], powerups: [] };
        this.effects = [];
        this.invaderDirection = 1;
        this.invaderSpeed = 4;
        this.lastTime = 0;
        this.fireCooldown = PLAYER.baseFireCooldown;
        this.fireTimer = 0;
        this.wave = 1;
        this.score = 0;
        this.lives = 3;
        this.shield = 0;
        this.powerTimers = { rapid: 0, spread: 0 };
        this.difficultyKey = "standard";
        this.highScore = Number(localStorage.getItem("space-invaders-highscore") || 0);
        this.player = this.createPlayer();

        this.starfield = createStarfield();
        this.grid = createGridGlow(260, 160);
        this.scene.add(this.starfield);
        this.scene.add(this.grid);
        this.scene.add(this.player.mesh);

        this.resize = this.resize.bind(this);
        this.loop = this.loop.bind(this);
        window.addEventListener("resize", this.resize);
        this.resize();
        this.updateHud();
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height, false);
        const aspect = width / height;
        this.viewHeight = WORLD_HEIGHT;
        this.viewWidth = this.viewHeight * aspect;
        this.camera.left = -this.viewWidth / 2;
        this.camera.right = this.viewWidth / 2;
        this.camera.top = this.viewHeight / 2;
        this.camera.bottom = -this.viewHeight / 2;
        this.camera.position.set(0, 0, 200);
        this.camera.updateProjectionMatrix();
        this.bounds = {
            left: -this.viewWidth / 2 + 6,
            right: this.viewWidth / 2 - 6,
            top: this.viewHeight / 2,
            bottom: -this.viewHeight / 2 + 4
        };
    }

    createPlayer() {
        const mesh = createRectMesh(PLAYER.size.w, PLAYER.size.h, COLORS.player);
        mesh.position.y = -WORLD_HEIGHT / 2 + 12;
        return {
            mesh,
            size: { ...PLAYER.size },
            position: mesh.position,
            cooldown: PLAYER.baseFireCooldown
        };
    }

    spawnWave() {
        this.clearEntities();
        const difficulty = DIFFICULTIES[this.difficultyKey];
        const totalWidth = (INVADERS.size.w + INVADERS.spacing.x) * difficulty.invaderColumns;
        const startX = -totalWidth / 2 + INVADERS.size.w / 2;
        const startY = this.viewHeight / 2 - 20;
        this.invaderDirection = 1;
        this.invaderSpeed = difficulty.invaderSpeed + this.wave * 0.2;

        for (let row = 0; row < difficulty.invaderRows; row++) {
            for (let col = 0; col < difficulty.invaderColumns; col++) {
                const isElite = Math.random() < INVADERS.elite.chance;
                const invader = {
                    mesh: createRectMesh(INVADERS.size.w, INVADERS.size.h, isElite ? COLORS.elite : COLORS.invader),
                    size: { ...INVADERS.size },
                    position: new THREE.Vector3(
                        startX + col * (INVADERS.size.w + INVADERS.spacing.x),
                        startY - row * (INVADERS.size.h + INVADERS.spacing.y),
                        0
                    ),
                    velocity: new THREE.Vector2(this.invaderSpeed * (isElite ? INVADERS.elite.speedBoost : 1), 0),
                    health: isElite ? INVADERS.elite.health : INVADERS.baseHealth,
                    score: isElite ? INVADERS.elite.score : INVADERS.score,
                    elite: isElite
                };
                invader.mesh.position.copy(invader.position);
                this.entities.invaders.push(invader);
                this.scene.add(invader.mesh);
            }
        }
    }

    clearEntities() {
        [...this.entities.invaders, ...this.entities.bullets, ...this.entities.bombs, ...this.entities.powerups].forEach(
            (entity) => this.scene.remove(entity.mesh)
        );
        this.entities = { invaders: [], bullets: [], bombs: [], powerups: [] };
    }

    start(difficultyKey = "standard") {
        this.difficultyKey = difficultyKey;
        this.wave = 1;
        this.score = 0;
        this.lives = 3;
        this.shield = 0;
        this.powerTimers = { rapid: 0, spread: 0 };
        this.player.mesh.position.x = 0;
        this.spawnWave();
        this.running = true;
        this.paused = false;
        this.fireCooldown = PLAYER.baseFireCooldown;
        this.lastTime = performance.now();
        this.statusCallback("Wave one incoming. Good luck!");
        this.updateHud();
        requestAnimationFrame(this.loop);
    }

    loop(timestamp) {
        if (!this.running) return;
        const delta = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;
        if (!this.paused) {
            this.update(delta);
            this.renderer.render(this.scene, this.camera);
        }
        requestAnimationFrame(this.loop);
    }

    update(delta) {
        this.parallaxBackground(delta);
        this.updatePlayer(delta);
        this.updateBullets(delta);
        this.updateBombs(delta);
        this.updateInvaders(delta);
        this.updatePowerups(delta);
        this.updateEffects(delta);
        this.checkWaveClear();
        this.updateHud();
    }

    parallaxBackground(delta) {
        this.starfield.rotation.z += delta * 0.02;
        this.grid.rotation.z -= delta * 0.012;
    }

    updatePlayer(delta) {
        const inputState = this.input.getState();
        let direction = 0;
        if (inputState.left) direction -= 1;
        if (inputState.right) direction += 1;
        this.player.position.x += direction * PLAYER.speed * delta;
        this.player.position.x = clamp(this.player.position.x, this.bounds.left, this.bounds.right);

        this.fireTimer -= delta;
        let cooldown = PLAYER.baseFireCooldown;
        if (this.powerTimers.rapid > 0) {
            this.powerTimers.rapid -= delta;
            cooldown *= 0.5;
        }
        if (this.powerTimers.spread > 0) {
            this.powerTimers.spread -= delta;
        }
        this.fireCooldown = cooldown;

        if (inputState.fire && this.fireTimer <= 0) {
            this.firePlayerBullets();
            this.fireTimer = this.fireCooldown;
        }
    }

    firePlayerBullets() {
        const spreadActive = this.powerTimers.spread > 0;
        const bullets = spreadActive
            ? [
                  { x: this.player.position.x - 1.5, y: this.player.position.y, vx: -12, vy: PLAYER.bulletSpeed },
                  { x: this.player.position.x, y: this.player.position.y, vx: 0, vy: PLAYER.bulletSpeed },
                  { x: this.player.position.x + 1.5, y: this.player.position.y, vx: 12, vy: PLAYER.bulletSpeed }
              ]
            : [{ x: this.player.position.x, y: this.player.position.y, vx: 0, vy: PLAYER.bulletSpeed }];

        bullets.forEach((bullet) => {
            const mesh = createRectMesh(1.2, 5, COLORS.bullet);
            mesh.position.set(bullet.x, bullet.y + 4, 1);
            this.scene.add(mesh);
            this.entities.bullets.push({
                mesh,
                size: { w: 1.2, h: 5 },
                position: mesh.position,
                velocity: new THREE.Vector2(bullet.vx, bullet.vy)
            });
        });
    }

    updateBullets(delta) {
        this.entities.bullets.forEach((bullet) => {
            bullet.position.x += bullet.velocity.x * delta;
            bullet.position.y += bullet.velocity.y * delta;
        });
        const outOfBounds = (b) => b.position.y > this.bounds.top + 10 || Math.abs(b.position.x) > this.bounds.right + 10;
        this.entities.bullets = this.entities.bullets.filter((bullet) => {
            if (outOfBounds(bullet)) {
                this.scene.remove(bullet.mesh);
                return false;
            }
            return true;
        });
    }

    updateInvaders(delta) {
        if (this.entities.invaders.length === 0) return;
        let minX = Infinity;
        let maxX = -Infinity;
        this.entities.invaders.forEach((invader) => {
            invader.position.x += invader.velocity.x * delta * this.invaderDirection;
            minX = Math.min(minX, invader.position.x - invader.size.w / 2);
            maxX = Math.max(maxX, invader.position.x + invader.size.w / 2);
        });
        const hitEdge = minX < this.bounds.left || maxX > this.bounds.right;
        if (hitEdge) {
            this.invaderDirection *= -1;
            this.entities.invaders.forEach((invader) => {
                invader.position.y -= DIFFICULTIES[this.difficultyKey].invaderDrop;
                invader.position.x = clamp(invader.position.x, this.bounds.left, this.bounds.right);
            });
        }

        const difficulty = DIFFICULTIES[this.difficultyKey];
        this.entities.invaders.forEach((invader) => {
            invader.mesh.position.copy(invader.position);
            if (Math.random() < difficulty.bombs * delta) {
                this.spawnBomb(invader);
            }
        });

        // Collisions with player bullets
        const remainingBullets = [];
        this.entities.bullets.forEach((bullet) => {
            let hit = false;
            for (const invader of this.entities.invaders) {
                if (aabbCollide(bullet, invader)) {
                    invader.health -= 1;
                    hit = true;
                    this.spawnHitEffect(invader.position, invader.elite ? COLORS.elite : COLORS.invader);
                    if (invader.health <= 0) {
                        this.handleInvaderDestroyed(invader);
                    }
                    break;
                }
            }
            if (!hit) remainingBullets.push(bullet);
            else this.scene.remove(bullet.mesh);
        });
        this.entities.bullets = remainingBullets;

        // Remove fallen invaders
        const filteredInvaders = [];
        for (const invader of this.entities.invaders) {
            if (invader.position.y < this.player.position.y - 6) {
                this.hitPlayer();
                this.scene.remove(invader.mesh);
                continue;
            }
            filteredInvaders.push(invader);
        }
        this.entities.invaders = filteredInvaders;
    }

    spawnBomb(invader) {
        const mesh = createRectMesh(1.6, 5, COLORS.bomb);
        mesh.position.copy(invader.position);
        this.scene.add(mesh);
        this.entities.bombs.push({
            mesh,
            size: { w: 1.6, h: 5 },
            position: mesh.position,
            velocity: new THREE.Vector2(0, -BOMB_SPEED)
        });
    }

    updateBombs(delta) {
        const remaining = [];
        this.entities.bombs.forEach((bomb) => {
            bomb.position.y += bomb.velocity.y * delta;
            if (bomb.position.y < this.bounds.bottom - 10) {
                this.scene.remove(bomb.mesh);
                return;
            }
            if (aabbCollide(bomb, this.player)) {
                this.scene.remove(bomb.mesh);
                this.hitPlayer();
                return;
            }
            remaining.push(bomb);
        });
        this.entities.bombs = remaining;
    }

    updatePowerups(delta) {
        const remaining = [];
        this.entities.powerups.forEach((powerup) => {
            powerup.position.y -= POWERUP_FALL_SPEED * delta;
            if (powerup.position.y < this.bounds.bottom - 6) {
                this.scene.remove(powerup.mesh);
                return;
            }
            if (aabbCollide(powerup, this.player)) {
                this.applyPowerup(powerup.type);
                this.scene.remove(powerup.mesh);
                return;
            }
            remaining.push(powerup);
        });
        this.entities.powerups = remaining;
    }

    updateEffects(delta) {
        const keep = [];
        this.effects.forEach((effect) => {
            effect.ttl -= delta;
            if (effect.ttl <= 0) {
                this.scene.remove(effect.mesh);
                return;
            }
            effect.mesh.material.opacity = effect.ttl / effect.max;
            keep.push(effect);
        });
        this.effects = keep;
    }

    handleInvaderDestroyed(invader) {
        this.score += invader.score;
        const powerup = rollPowerup();
        if (powerup && Math.random() < 0.5) {
            const mesh = createRectMesh(5, 3, COLORS.powerups[powerup.key]);
            mesh.position.copy(invader.position);
            this.scene.add(mesh);
            this.entities.powerups.push({
                mesh,
                size: { w: 5, h: 3 },
                position: mesh.position,
                type: powerup
            });
        }
        this.scene.remove(invader.mesh);
        this.entities.invaders = this.entities.invaders.filter((i) => i !== invader);
    }

    applyPowerup(powerup) {
        switch (powerup.key) {
            case "shield":
                this.shield = clamp(this.shield + 1, 0, SHIELD_MAX);
                this.statusCallback("Shield boosted. Tanks, engage!");
                break;
            case "rapid":
                this.powerTimers.rapid = powerup.duration;
                this.statusCallback("Rapid fire online.");
                break;
            case "spread":
                this.powerTimers.spread = powerup.duration;
                this.statusCallback("Spread shot active.");
                break;
            default:
                break;
        }
    }

    checkWaveClear() {
        if (this.entities.invaders.length > 0) return;
        this.wave += 1;
        this.statusCallback(`Wave ${this.wave} ready. Invaders incoming!`);
        this.spawnWave();
    }

    hitPlayer() {
        if (this.shield > 0) {
            this.shield -= 1;
            this.statusCallback("Shield absorbed the hit.");
            return;
        }
        this.lives -= 1;
        this.statusCallback(`Hull breach! Lives remaining: ${this.lives}`);
        if (this.lives <= 0) {
            this.endGame();
        } else {
            this.player.position.x = 0;
            this.fireTimer = 0.5;
        }
    }

    endGame() {
        this.running = false;
        this.paused = true;
        this.highScore = Math.max(this.highScore, this.score);
        localStorage.setItem("space-invaders-highscore", this.highScore.toString());
        this.statusCallback("Mission failed. Hit Start to relaunch.");
        this.updateHud();
    }

    spawnHitEffect(position, color) {
        const mesh = createRectMesh(6, 6, color);
        mesh.position.copy(position);
        mesh.material.transparent = true;
        mesh.material.opacity = 0.8;
        this.scene.add(mesh);
        this.effects.push({ mesh, ttl: 0.25, max: 0.25 });
    }

    updateHud() {
        this.hud.scoreValue.textContent = Math.floor(this.score).toString();
        this.hud.waveValue.textContent = this.wave.toString();
        this.hud.livesValue.textContent = this.lives.toString();
        this.hud.shieldValue.textContent = this.shield.toString();
        this.hud.highScoreValue.textContent = this.highScore.toString();
        const active = [];
        if (this.powerTimers.rapid > 0) active.push(`Rapid (${this.powerTimers.rapid.toFixed(0)}s)`);
        if (this.powerTimers.spread > 0) active.push(`Spread (${this.powerTimers.spread.toFixed(0)}s)`);
        this.hud.powerUpReadout.textContent = active.length ? active.join(" · ") : "None";
    }

    togglePause() {
        if (!this.running) return;
        this.paused = !this.paused;
        this.statusCallback(this.paused ? "Paused" : "Resumed");
    }

    isPaused() {
        return this.paused;
    }

    isRunning() {
        return this.running;
    }

    destroy() {
        this.running = false;
        window.removeEventListener("resize", this.resize);
        this.renderer.dispose();
        this.scene.clear();
    }
}
