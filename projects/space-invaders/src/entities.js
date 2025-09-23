import {
    BACKGROUND_CONFIG,
    BOSS_CONFIG,
    INVADER_TYPES,
    PARTICLE_CONFIG,
    PLAYER_LIMITS,
    POWERUP_CONFIG,
    POWERUP_TYPES,
    STARFIELD,
    TRAIL_CONFIG
} from "./config.js";

export function createBackground(width, height) {
    return {
        gridOffset: 0,
        layers: BACKGROUND_CONFIG.parallaxLayers.map((layer) => ({
            ...layer,
            offset: 0
        })),
        nebulae: BACKGROUND_CONFIG.nebulae.map((nebula) => ({
            ...nebula,
            x: Math.random() * width,
            y: Math.random() * height,
            rotation: Math.random() * Math.PI * 2
        }))
    };
}

export function updateBackground(background, delta, width, height) {
    background.gridOffset = (background.gridOffset + BACKGROUND_CONFIG.grid.speed * delta) % BACKGROUND_CONFIG.grid.spacing;
    background.layers.forEach((layer, index) => {
        layer.offset = (layer.offset + layer.speed * delta * (index + 1)) % width;
    });
    background.nebulae.forEach((nebula) => {
        nebula.x = (nebula.x + delta * 6) % (width + 600) - 300;
        nebula.rotation += delta * 0.02;
        if (nebula.x < -300) {
            nebula.x = width + Math.random() * 300;
            nebula.y = Math.random() * height * 0.7;
        }
    });
}

export function createStars(width, height, options = STARFIELD) {
    const { count, minRadius, maxRadius, minAlpha, maxAlpha } = options;
    return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * (maxRadius - minRadius) + minRadius,
        a: Math.random() * (maxAlpha - minAlpha) + minAlpha,
        v: Math.random() * 40 + 10
    }));
}

export function updateStars(stars, delta, height) {
    stars.forEach((star) => {
        star.y += star.v * delta;
        if (star.y > height) {
            star.y = 0;
        }
    });
}

export function createPlayer(width, height) {
    return {
        x: width / 2 - 22,
        y: Math.max(height - 80, 140),
        width: 48,
        height: 24,
        speed: 280,
        shield: PLAYER_LIMITS.baseShield,
        maxShield: PLAYER_LIMITS.maxShield,
        rapidTimer: 0,
        pierceTimer: 0,
        doubleTimer: 0,
        droneTimer: 0,
        heat: 0,
        trail: []
    };
}

export function resetPlayerPosition(player, width, height) {
    player.x = width / 2 - player.width / 2;
    player.y = Math.max(height - 80, 140);
    player.trail.length = 0;
}

function pickInvaderType(isElite) {
    if (!isElite) {
        return INVADER_TYPES[0];
    }
    const pool = INVADER_TYPES.slice(1);
    return pool[Math.floor(Math.random() * pool.length)];
}

export function spawnWave(width, wave, preset) {
    const cols = 10;
    const extraRows = Math.min(wave - 1, preset.rowsMaxExtra);
    const rows = preset.rowsBase + extraRows;
    const horizontalGap = 56;
    const verticalGap = 44;
    const startX = (width - (cols - 1) * horizontalGap) / 2 - INVADER_TYPES[0].width / 2;
    const startY = 90;

    const formation = [];
    for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
            const eliteThreshold = preset.eliteChance * Math.min(1, wave / 6);
            const invaderType = pickInvaderType(Math.random() < eliteThreshold);
            formation.push({
                columnIndex: c,
                type: invaderType,
                x: startX + c * horizontalGap,
                y: startY + r * verticalGap,
                width: invaderType.width,
                height: invaderType.height,
                baseY: startY + r * verticalGap,
                direction: 1,
                health: invaderType.health,
                maxHealth: invaderType.health,
                shield: invaderType.shield || 0,
                zigzagPhase: Math.random() * Math.PI * 2,
                kamikazeCharge: invaderType.kamikaze ? Math.random() * 6 + 4 : Infinity,
                precisionLock: invaderType.precision ? Math.random() * 2 + 1 : Infinity
            });
        }
    }

    return formation;
}

export function makePlayerShot(player, offsetX = 0, speed = 640, damage = 1, pierce = false) {
    return {
        x: player.x + player.width / 2 - 2 + offsetX,
        y: player.y - 16,
        width: 4,
        height: 16,
        speed,
        damage,
        pierce,
        penetration: pierce ? 3 : 1
    };
}

export function makeDroneShot(drone, speed = 520) {
    return {
        x: drone.x - 2,
        y: drone.y - 12,
        width: 4,
        height: 14,
        speed,
        damage: 1,
        pierce: false,
        penetration: 1
    };
}

export function makeEnemyShot(invader, speed, width = 6, height = 16, vx = 0, vy = speed) {
    return {
        x: invader.x + invader.width / 2 - width / 2,
        y: invader.y + invader.height,
        width,
        height,
        speed,
        vx,
        vy
    };
}

export function createPowerUp(x, y) {
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    return {
        type,
        x,
        y,
        width: 28,
        height: 28,
        speed: POWERUP_CONFIG.fallSpeed
    };
}

export function spawnBoss(width, wave) {
    const health = BOSS_CONFIG.baseHealth + (wave - 1) * BOSS_CONFIG.healthGrowth;
    return {
        x: width / 2 - BOSS_CONFIG.width / 2,
        y: 120,
        width: BOSS_CONFIG.width,
        height: BOSS_CONFIG.height,
        health,
        maxHealth: health,
        speed: BOSS_CONFIG.speed,
        direction: Math.random() > 0.5 ? 1 : -1,
        fireTimer: 0,
        rushTimer: BOSS_CONFIG.rushInterval,
        rushing: false,
        rushTimeLeft: 0,
        shield: 5
    };
}

export function spawnParticles(x, y, color, overrides = {}) {
    const config = { ...PARTICLE_CONFIG, ...overrides };
    const particles = [];
    for (let i = 0; i < config.count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * config.speed;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: config.life,
            maxLife: config.life,
            color
        });
    }
    return particles;
}

export function updateParticles(particles, delta) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.life -= delta;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

export function updateTrail(trail, player) {
    trail.unshift({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        time: TRAIL_CONFIG.life
    });
    while (trail.length > TRAIL_CONFIG.maxLength) {
        trail.pop();
    }
}

export function decayTrail(trail, delta) {
    for (let i = trail.length - 1; i >= 0; i -= 1) {
        trail[i].time -= delta;
        if (trail[i].time <= 0) {
            trail.splice(i, 1);
        }
    }
}
