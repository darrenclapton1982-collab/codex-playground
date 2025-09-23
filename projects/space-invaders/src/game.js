import {
    AUDIO_CONFIG,
    BOSS_CONFIG,
    CAMERA_CONFIG,
    COMBO_CONFIG,
    difficultyPresets,
    HIGH_SCORE_KEY,
    PLAYER_LIMITS,
    TRAIL_CONFIG
} from "./config.js";
import {
    createBackground,
    createPlayer,
    createPowerUp,
    createStars,
    decayTrail,
    makeDroneShot,
    makeEnemyShot,
    makePlayerShot,
    resetPlayerPosition,
    spawnBoss,
    spawnParticles,
    spawnWave,
    updateBackground,
    updateParticles,
    updateStars,
    updateTrail
} from "./entities.js";
import { createKeyboardControls } from "./controls.js";
import { drawScene } from "./render.js";
import { createAudioController } from "./audio.js";

export function createSpaceInvadersGame(dom) {
    const {
        canvas,
        startButton,
        pauseButton,
        fullscreenButton,
        difficultySelect,
        hud: { scoreValue, livesValue, waveValue, highScoreValue, shieldValue, powerUpReadout },
        statusMessage
    } = dom;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.warn("Space Invaders: canvas context unavailable.");
        return { destroy: () => {}, resize: () => {} };
    }

    const audio = createAudioController(AUDIO_CONFIG);
    const unlockAudio = () => {
        audio.unlock();
    };
    const pointerUnlock = () => {
        unlockAudio();
        document.removeEventListener("pointerdown", pointerUnlock);
        document.removeEventListener("keydown", keyUnlock);
    };
    const keyUnlock = () => {
        unlockAudio();
        document.removeEventListener("pointerdown", pointerUnlock);
        document.removeEventListener("keydown", keyUnlock);
    };
    document.addEventListener("pointerdown", pointerUnlock);
    document.addEventListener("keydown", keyUnlock);

    let width = canvas.width;
    let height = canvas.height;

    let background = createBackground(width, height);
    let stars = createStars(width, height);
    const player = createPlayer(width, height);
    const keys = new Set();

    let preset = difficultyPresets[difficultySelect.value] || difficultyPresets.standard;
    let invaders = [];
    let playerShots = [];
    let enemyShots = [];
    let powerUps = [];
    let particles = [];
    let drones = [];
    let boss = null;
    let flash = null;
    let totalTime = 0;

    let running = false;
    let paused = false;
    let score = 0;
    let lives = 3;
    let wave = 1;
    let baseCooldown = preset.playerCooldown;
    let playerCooldown = 0;
    let enemyFireTimer = 0;
    let enemyShotSpeed = preset.enemyShotSpeedBase;
    let enemyFireInterval = preset.enemyFireIntervalBase;
    let lastTimestamp = 0;
    let highScore = loadHighScore();

    let comboTimer = 0;
    let comboMultiplier = 1;
    let comboHits = 0;

    let cameraShake = null;

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

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()?.catch(() => {
                statusMessage.textContent = "Fullscreen request blocked.";
            });
        } else {
            document.exitFullscreen()?.catch(() => {
                statusMessage.textContent = "Could not exit fullscreen.";
            });
        }
    };

    startButton.addEventListener("click", startGame);
    pauseButton.addEventListener("click", handlePauseClick);
    difficultySelect.addEventListener("change", handleDifficultyChange);
    fullscreenButton.addEventListener("click", toggleFullscreen);

    pauseButton.disabled = true;
    pauseButton.setAttribute("aria-pressed", "false");
    updateHud();
    drawScene(ctx, buildRenderState());

    function buildRenderState() {
        return {
            width,
            height,
            stars,
            background,
            player,
            invaders,
            playerShots,
            enemyShots,
            powerUps,
            boss,
            particles,
            flash,
            drones,
            time: totalTime,
            combo: comboMultiplier > 1 ? { multiplier: comboMultiplier } : null,
            cameraShake
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

    function updateComboHud() {
        if (comboMultiplier > 1) {
            statusMessage.textContent = `Combo x${comboMultiplier.toFixed(2)} � keep the streak!`;
        }
    }

    function resetCombo() {
        comboMultiplier = 1;
        comboHits = 0;
        comboTimer = 0;
    }

    function rewardCombo() {
        comboHits += 1;
        comboMultiplier = Math.min(COMBO_CONFIG.maxMultiplier, 1 + comboHits * COMBO_CONFIG.multiplierStep);
        comboTimer = preset.comboForgiveness;
        score += COMBO_CONFIG.rewardPerStep * (comboMultiplier - 1);
        addCameraShake(8);
        updateComboHud();
    }

    function formatTimer(seconds) {
        return `${seconds.toFixed(0)}s`;
    }

    function updatePowerUpHud() {
        const chips = [];
        if (player.rapidTimer > 0) {
            chips.push(`<span class="powerup-chip" data-type="overdrive">Overdrive ${formatTimer(player.rapidTimer)}</span>`);
        }
        if (player.doubleTimer > 0) {
            chips.push(`<span class="powerup-chip" data-type="overdrive">Double ${formatTimer(player.doubleTimer)}</span>`);
        }
        if (player.pierceTimer > 0) {
            chips.push(`<span class="powerup-chip" data-type="pierce">Pierce ${formatTimer(player.pierceTimer)}</span>`);
        }
        if (player.droneTimer > 0) {
            chips.push(`<span class="powerup-chip" data-type="shield">Wingmen ${formatTimer(player.droneTimer)}</span>`);
        }
        if (chips.length) {
            powerUpReadout.innerHTML = chips.join(" ");
        } else {
            powerUpReadout.textContent = "None";
        }
    }

    function updateHud() {
        scoreValue.textContent = String(Math.floor(score));
        livesValue.textContent = String(lives);
        waveValue.textContent = String(wave);
        highScoreValue.textContent = String(highScore);
        shieldValue.textContent = `${player.shield}/${player.maxShield}`;
        updatePowerUpHud();
    }

    function applyDifficulty(key) {
        preset = difficultyPresets[key] || difficultyPresets.standard;
        player.speed = preset.playerSpeed;
        baseCooldown = preset.playerCooldown;
        if (!running) {
            enemyFireInterval = preset.enemyFireIntervalBase;
            enemyShotSpeed = preset.enemyShotSpeedBase;
        }
    }

    function spawnEncounter() {
        const isBossWave = wave % BOSS_CONFIG.waveInterval === 0;
        if (isBossWave) {
            boss = spawnBoss(width, wave);
            invaders = [];
            statusMessage.textContent = `Boss wave! Target core at ${boss.health} HP.`;
        } else {
            boss = null;
            invaders = spawnWave(width, wave, preset);
            statusMessage.textContent = `Wave ${wave} inbound.`;
        }
        enemyFireTimer = 0;
        enemyShotSpeed = preset.enemyShotSpeedBase + (wave - 1) * preset.enemyShotSpeedRamp;
        enemyFireInterval = Math.max(
            preset.enemyFireIntervalFloor,
            preset.enemyFireIntervalBase - (wave - 1) * preset.enemyFireIntervalStep
        );
    }

    function addCameraShake(intensity = CAMERA_CONFIG.shakeIntensity) {
        cameraShake = {
            magnitude: intensity,
            offsetX: 0,
            offsetY: 0
        };
    }

    function firePlayerShot() {
        if (playerCooldown > 0 || !running || paused) {
            return;
        }
        audio.playShoot();
        const baseSpeed = player.pierceTimer > 0 ? 760 : 640;
        const damage = player.pierceTimer > 0 ? 2 : 1;
        const pierce = player.pierceTimer > 0;
        const offset = player.doubleTimer > 0 ? 14 : 0;
        if (player.doubleTimer > 0) {
            playerShots.push(makePlayerShot(player, -offset, baseSpeed, damage, pierce));
            playerShots.push(makePlayerShot(player, offset, baseSpeed, damage, pierce));
        } else {
            playerShots.push(makePlayerShot(player, 0, baseSpeed, damage, pierce));
        }
        const cooldownModifier = player.rapidTimer > 0 ? 0.45 : 1;
        playerCooldown = baseCooldown * cooldownModifier;
        updateTrail(player.trail, player);
    }

    function fireDroneShots() {
        if (!drones.length) {
            return;
        }
        drones.forEach((drone) => {
            playerShots.push(makeDroneShot(drone));
        });
        audio.playShoot(0.15);
    }

    function fireEnemyShot(invaderOverride) {
        if (boss) {
            fireBossShot();
            return;
        }

        if (!invaders.length) {
            return;
        }

        const columns = new Map();
        invaders.forEach((inv) => {
            const current = columns.get(inv.columnIndex);
            if (!current || inv.y > current.y) {
                columns.set(inv.columnIndex, inv);
            }
        });
        const shooters = Array.from(columns.values());
        if (!shooters.length) {
            return;
        }
        const shooter = invaderOverride || shooters[Math.floor(Math.random() * shooters.length)];
        if (shooter.type.precision) {
            const originX = shooter.x + shooter.width / 2;
            const originY = shooter.y + shooter.height;
            const targetX = player.x + player.width / 2;
            const targetY = player.y + player.height / 2;
            const dx = targetX - originX;
            const dy = targetY - originY;
            const distance = Math.hypot(dx, dy) || 1;
            const vx = (dx / distance) * enemyShotSpeed * shooter.type.fireScale;
            const vy = (dy / distance) * enemyShotSpeed * shooter.type.fireScale;
            enemyShots.push(makeEnemyShot(shooter, enemyShotSpeed, 6, 18, vx, vy));
        } else {
            const shotSpeed = enemyShotSpeed * shooter.type.fireScale;
            enemyShots.push(makeEnemyShot(shooter, shotSpeed));
        }
    }

    function fireBossShot() {
        const originX = boss.x + boss.width / 2;
        const originY = boss.y + boss.height;
        const targetX = player.x + player.width / 2;
        const targetY = player.y + player.height / 2;
        const dx = targetX - originX;
        const dy = targetY - originY;
        const distance = Math.hypot(dx, dy) || 1;
        const projectileSpeed = 320 + wave * 8;
        enemyShots.push({
            x: originX - 6,
            y: originY,
            width: 12,
            height: 28,
            vx: (dx / distance) * projectileSpeed,
            vy: (dy / distance) * projectileSpeed,
            speed: projectileSpeed
        });
    }

    function startGame() {
        applyDifficulty(difficultySelect.value);
        running = true;
        paused = false;
        score = 0;
        totalTime = 0;
        lives = 3;
        wave = 1;
        comboMultiplier = 1;
        comboHits = 0;
        comboTimer = 0;
        keys.clear();
        player.shield = PLAYER_LIMITS.baseShield;
        player.rapidTimer = 0;
        player.doubleTimer = 0;
        player.pierceTimer = 0;
        player.droneTimer = 0;
        player.trail.length = 0;
        playerShots = [];
        enemyShots = [];
        powerUps = [];
        particles = [];
        drones = [];
        flash = null;
        cameraShake = null;
        updateHud();
        resetPlayerPosition(player, width, height);
        statusMessage.textContent = "Defend the sector!";
        startButton.disabled = true;
        pauseButton.disabled = false;
        pauseButton.textContent = "Pause";
        pauseButton.setAttribute("aria-pressed", "false");
        difficultySelect.disabled = true;
        spawnEncounter();
        audio.start();
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
        audio.stopMusic();
        drawScene(ctx, buildRenderState());
    }

    function loseLife(message, skipComboReset = false) {
        if (!skipComboReset) {
            resetCombo();
        }
        if (player.shield > 0) {
            player.shield -= 1;
            statusMessage.textContent = message ? `${message} Shield absorbed impact.` : "Shield absorbed the hit.";
            updateHud();
            audio.playHit();
            return;
        }

        lives -= 1;
        updateHud();
        audio.playHit();
        addCameraShake(18);
        if (lives <= 0) {
            endGame(false, message || "The fleet has fallen.");
            return;
        }
        statusMessage.textContent = message ? `${message} ${lives} lives left.` : `${lives} lives remain.`;
        resetPlayerPosition(player, width, height);
        playerShots = [];
        enemyShots = [];
        playerCooldown = 0;
    }

    function advanceWave() {
        wave += 1;
        score += preset.waveBonus * comboMultiplier;
        updateHud();
        spawnEncounter();
    }

    function applyPowerUp(powerUp) {
        audio.playPower();
        switch (powerUp.type.key) {
            case "shield":
                player.shield = Math.min(player.maxShield, player.shield + 1);
                break;
            case "overdrive":
                player.rapidTimer = Math.max(player.rapidTimer, powerUp.type.duration);
                player.doubleTimer = Math.max(player.doubleTimer, powerUp.type.duration * 0.8);
                break;
            case "pierce":
                player.pierceTimer = Math.max(player.pierceTimer, powerUp.type.duration);
                break;
            case "drone":
                player.droneTimer = Math.max(player.droneTimer, powerUp.type.duration);
                spawnDrones();
                break;
            default:
                break;
        }
        updateHud();
    }

    function spawnDrones() {
        const count = 2;
        drones = Array.from({ length: count }, (_, i) => ({
            angle: (Math.PI * 2 * i) / count,
            radius: 48,
            x: player.x,
            y: player.y
        }));
    }

    function handleBossDefeat() {
        audio.playExplosion(0.5);
        score += BOSS_CONFIG.score * comboMultiplier;
        flash = { time: 0.4, duration: 0.4 };
        boss = null;
        particles.push(...spawnParticles(width / 2, height / 3, "rgba(250, 204, 21, 1)", { count: 40, speed: 420, life: 0.9 }));
        statusMessage.textContent = "Boss neutralised!";
        checkHighScore();
        addCameraShake(22);
        advanceWave();
    }

    function updatePowerUps(delta) {
        for (let i = powerUps.length - 1; i >= 0; i -= 1) {
            const powerUp = powerUps[i];
            powerUp.y += powerUp.speed * delta;
            if (powerUp.y > height + 60) {
                powerUps.splice(i, 1);
                continue;
            }
            if (intersects(powerUp, player)) {
                powerUps.splice(i, 1);
                applyPowerUp(powerUp);
            }
        }
    }

    function intersects(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
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
        totalTime += delta;

        updateTimers(delta);
        updateStars(stars, delta, height);
        updateBackground(background, delta, width, height);
        updateParticles(particles, delta);
        updateFlash(delta);
        updateMovement(delta);
        handleShooting(delta);
        handleCollisions();
        cleanupEntities();

        drawScene(ctx, buildRenderState());
        requestAnimationFrame(loop);
    }

    function updateTimers(delta) {
        playerCooldown = Math.max(0, playerCooldown - delta);
        if (!boss) {
            enemyFireTimer += delta;
        }
        if (player.rapidTimer > 0) {
            player.rapidTimer = Math.max(0, player.rapidTimer - delta);
        }
        if (player.doubleTimer > 0) {
            player.doubleTimer = Math.max(0, player.doubleTimer - delta);
        }
        if (player.pierceTimer > 0) {
            player.pierceTimer = Math.max(0, player.pierceTimer - delta);
        }
        if (player.droneTimer > 0) {
            player.droneTimer = Math.max(0, player.droneTimer - delta);
            if (player.droneTimer <= 0) {
                drones = [];
            }
        }
        if (comboTimer > 0) {
            comboTimer -= delta;
            if (comboTimer <= 0) {
                resetCombo();
            }
        }
        updateHud();
    }

    function updateFlash(delta) {
        if (flash) {
            flash.time -= delta;
            if (flash.time <= 0) {
                flash = null;
            }
        }
        if (cameraShake && cameraShake.magnitude > 0) {
            cameraShake.magnitude = Math.max(0, cameraShake.magnitude - CAMERA_CONFIG.shakeFalloff);
            cameraShake.offsetX = (Math.random() - 0.5) * cameraShake.magnitude;
            cameraShake.offsetY = (Math.random() - 0.5) * cameraShake.magnitude;
            if (cameraShake.magnitude <= 0) {
                cameraShake = null;
            }
        }
    }

    function updateMovement(delta) {
        const padding = PLAYER_LIMITS.horizontalPadding;
        const moveDistance = player.speed * delta;
        if (keys.has("left")) {
            player.x -= moveDistance;
        }
        if (keys.has("right")) {
            player.x += moveDistance;
        }
        player.x = Math.min(width - player.width - padding, Math.max(padding, player.x));
        decayTrail(player.trail, delta);

        const invaderSpeed = preset.invaderSpeedBase + (wave - 1) * preset.invaderSpeedRamp;
        invaders.forEach((inv) => {
            inv.x += inv.type.speedScale * invaderSpeed * (inv.direction || 1) * delta;
        });

        if (invaders.length) {
            let leftEdge = Infinity;
            let rightEdge = -Infinity;
            invaders.forEach((inv) => {
                if (inv.x < leftEdge) {
                    leftEdge = inv.x;
                }
                if (inv.x + inv.width > rightEdge) {
                    rightEdge = inv.x + inv.width;
                }
            });
            const boundaryLeft = padding;
            const boundaryRight = width - padding;
            if (leftEdge <= boundaryLeft || rightEdge >= boundaryRight) {
                invaders.forEach((inv) => {
                    inv.direction = -(inv.direction || 1);
                    inv.y += preset.invaderDrop;
                    inv.baseY = inv.y;
                });
            }
        }

        invaders.forEach((inv) => {
            if (inv.type.zigzag) {
                inv.zigzagPhase += delta * 3;
                inv.y = inv.baseY + Math.sin(inv.zigzagPhase) * inv.type.zigzagAmplitude;
            }
            if (inv.type.kamikaze) {
                inv.kamikazeCharge -= delta;
                if (inv.kamikazeCharge <= 0 && !inv.diving) {
                    inv.diving = true;
                    inv.diveSpeed = 200 + wave * 12;
                }
                if (inv.diving) {
                    const direction = inv.x + inv.width / 2 < player.x + player.width / 2 ? 1 : -1;
                    inv.x += direction * inv.diveSpeed * 0.65 * delta;
                    inv.y += inv.diveSpeed * delta;
                }
            }
            if (inv.type.precision) {
                inv.precisionLock -= delta;
                if (inv.precisionLock <= 0) {
                    fireEnemyShot(inv);
                    inv.precisionLock = Math.random() * 2 + 1;
                }
            }
        });

        if (boss) {
            updateBoss(delta);
        }

        playerShots.forEach((shot) => {
            shot.y -= shot.speed * delta;
        });

        enemyShots.forEach((shot) => {
            const vy = shot.vy ?? shot.speed;
            const vx = shot.vx ?? 0;
            shot.x += vx * delta;
            shot.y += vy * delta;
        });

        if (drones.length) {
            drones.forEach((drone, index) => {
                drone.angle += delta * 2 + index * 0.35;
                drone.x = player.x + player.width / 2 + Math.cos(drone.angle) * drone.radius;
                drone.y = player.y + player.height / 2 + Math.sin(drone.angle) * (drone.radius * 0.65);
            });
        }

        updatePowerUps(delta);
    }

    function updateBoss(delta) {
        if (!boss) {
            return;
        }
        if (boss.rushing) {
            boss.rushTimeLeft -= delta;
            const targetX = player.x + player.width / 2;
            boss.x += (targetX - (boss.x + boss.width / 2)) * 0.6 * delta;
            boss.y += BOSS_CONFIG.rushSpeed * delta;
            if (boss.rushTimeLeft <= 0 || boss.y > height * 0.55) {
                boss.rushing = false;
                boss.y = Math.max(120, Math.min(height * 0.45, boss.y));
            }
        } else {
            boss.x += boss.speed * boss.direction * delta;
            if (boss.x <= 60 || boss.x + boss.width >= width - 60) {
                boss.direction *= -1;
            }
            boss.fireTimer -= delta;
            boss.rushTimer -= delta;
            if (boss.fireTimer <= 0) {
                fireBossShot();
                boss.fireTimer = BOSS_CONFIG.fireInterval * (0.7 + Math.random() * 0.6);
            }
            if (boss.rushTimer <= 0) {
                boss.rushing = true;
                boss.rushTimeLeft = BOSS_CONFIG.rushDuration;
                boss.rushTimer = BOSS_CONFIG.rushInterval + Math.random() * 3;
            }
        }
        boss.x = Math.min(width - boss.width - 60, Math.max(60, boss.x));
        boss.y = Math.max(80, Math.min(height * 0.6, boss.y));

        if (intersects(boss, player)) {
            loseLife("The core ship rammed you!", true);
            boss.rushing = false;
            boss.y = 120;
        }
    }

    function handleShooting(delta) {
        if (!boss && enemyFireTimer >= enemyFireInterval) {
            fireEnemyShot();
            enemyFireTimer = 0;
        }
    }

    function handleCollisions() {
        for (let i = playerShots.length - 1; i >= 0; i -= 1) {
            const shot = playerShots[i];
            if (shot.y + shot.height < 0) {
                playerShots.splice(i, 1);
                continue;
            }

            let hitSomething = false;
            if (boss && intersects(shot, boss)) {
                if (boss.shield > 0) {
                    boss.shield -= shot.damage;
                } else {
                    boss.health -= shot.damage;
                }
                hitSomething = true;
                if (!shot.pierce || --shot.penetration <= 0) {
                    playerShots.splice(i, 1);
                }
                audio.playHit(0.2);
                if (boss.health <= 0) {
                    handleBossDefeat();
                }
                continue;
            }

            for (let j = invaders.length - 1; j >= 0; j -= 1) {
                const inv = invaders[j];
                if (intersects(shot, inv)) {
                    if (inv.shield > 0) {
                        inv.shield -= shot.damage;
                        audio.playHit(0.15);
                    } else {
                        inv.health -= shot.damage;
                        audio.playHit();
                    }
                    hitSomething = true;
                    if (inv.health <= 0) {
                        rewardCombo();
                        score += inv.type.score * comboMultiplier;
                        particles.push(...spawnParticles(inv.x + inv.width / 2, inv.y + inv.height / 2, "rgba(56, 189, 248, 1)"));
                        checkHighScore();
                        const dropChance = preset.powerUpChance * Math.min(1, wave / 8);
                        if (Math.random() < dropChance) {
                            powerUps.push(createPowerUp(inv.x + inv.width / 2 - 14, inv.y));
                        }
                        invaders.splice(j, 1);
                        audio.playExplosion(0.25);
                    }
                    if (!shot.pierce || --shot.penetration <= 0) {
                        playerShots.splice(i, 1);
                    }
                    break;
                }
            }

            if (hitSomething) {
                updateHud();
            }
        }

        for (let i = enemyShots.length - 1; i >= 0; i -= 1) {
            const shot = enemyShots[i];
            if (shot.y > height + 80 || shot.x < -120 || shot.x > width + 120) {
                enemyShots.splice(i, 1);
                continue;
            }
            if (intersects(shot, player)) {
                enemyShots.splice(i, 1);
                loseLife("You took a hit!");
            }
        }

        invaders.forEach((inv) => {
            if (inv.y + inv.height >= player.y - 6) {
                loseLife("Invaders broke through!");
                inv.y = player.y - inv.height - 12;
            }
        });

        if (!boss && invaders.length === 0) {
            statusMessage.textContent = "Wave cleared!";
            advanceWave();
        }
    }

    function cleanupEntities() {
        playerShots = playerShots.filter((shot) => shot.y + shot.height >= 0);
        enemyShots = enemyShots.filter((shot) => shot.y <= height + 120);
        powerUps = powerUps.filter((p) => p.y <= height + 80);
    }

    function checkHighScore() {
        if (score > highScore) {
            setHighScore(score);
        }
    }

    function destroy() {
        window.removeEventListener("blur", handleWindowBlur);
        detachKeyboard();
        startButton.removeEventListener("click", startGame);
        pauseButton.removeEventListener("click", handlePauseClick);
        difficultySelect.removeEventListener("change", handleDifficultyChange);
        fullscreenButton.removeEventListener("click", toggleFullscreen);
        audio.dispose();
        document.removeEventListener("pointerdown", pointerUnlock);
        document.removeEventListener("keydown", keyUnlock);
    }

    function resize(newWidth, newHeight, devicePixelRatio = 1) {
        width = newWidth;
        height = newHeight;
        canvas.width = newWidth * devicePixelRatio;
        canvas.height = newHeight * devicePixelRatio;
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        stars = createStars(newWidth, newHeight);
        background = createBackground(newWidth, newHeight);
        resetPlayerPosition(player, newWidth, newHeight);
        invaders.forEach((inv) => {
            inv.baseY = inv.y;
        });
        if (boss) {
            boss.x = Math.min(Math.max(60, boss.x), newWidth - boss.width - 60);
        }
        drawScene(ctx, buildRenderState());
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
    }

    return { destroy, resize };
}
