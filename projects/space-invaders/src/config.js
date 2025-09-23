export const HIGH_SCORE_KEY = "space-invaders-prototype-high-score";

export const difficultyPresets = {
    relaxed: {
        playerSpeed: 250,
        playerCooldown: 0.28,
        invaderSpeedBase: 22,
        invaderSpeedRamp: 4.2,
        enemyShotSpeedBase: 150,
        enemyShotSpeedRamp: 16,
        enemyFireIntervalBase: 1.6,
        enemyFireIntervalFloor: 0.85,
        enemyFireIntervalStep: 0.1,
        invaderDrop: 24,
        rowsBase: 3,
        rowsMaxExtra: 2,
        waveBonus: 170,
        powerUpChance: 0.24,
        eliteChance: 0.14,
        comboForgiveness: 2.6
    },
    standard: {
        playerSpeed: 290,
        playerCooldown: 0.22,
        invaderSpeedBase: 32,
        invaderSpeedRamp: 6.5,
        enemyShotSpeedBase: 190,
        enemyShotSpeedRamp: 22,
        enemyFireIntervalBase: 1.25,
        enemyFireIntervalFloor: 0.58,
        enemyFireIntervalStep: 0.12,
        invaderDrop: 28,
        rowsBase: 4,
        rowsMaxExtra: 3,
        waveBonus: 260,
        powerUpChance: 0.3,
        eliteChance: 0.22,
        comboForgiveness: 1.9
    },
    intense: {
        playerSpeed: 330,
        playerCooldown: 0.17,
        invaderSpeedBase: 42,
        invaderSpeedRamp: 8.6,
        enemyShotSpeedBase: 235,
        enemyShotSpeedRamp: 30,
        enemyFireIntervalBase: 1.05,
        enemyFireIntervalFloor: 0.45,
        enemyFireIntervalStep: 0.14,
        invaderDrop: 32,
        rowsBase: 5,
        rowsMaxExtra: 4,
        waveBonus: 340,
        powerUpChance: 0.38,
        eliteChance: 0.3,
        comboForgiveness: 1.3
    }
};

export const PLAYER_LIMITS = {
    horizontalPadding: 32,
    baseShield: 1,
    maxShield: 4,
    heatDecay: 1.4
};

export const STARFIELD = {
    count: 180,
    minRadius: 0.35,
    maxRadius: 2.1,
    minAlpha: 0.25,
    maxAlpha: 0.9
};

export const BACKGROUND_CONFIG = {
    parallaxLayers: [
        { speed: 4, alpha: 0.55, blur: 0, colorA: "#020617", colorB: "#0f172a" },
        { speed: 12, alpha: 0.4, blur: 12, colorA: "#0b1120", colorB: "#1e293b" }
    ],
    nebulae: [
        { hue: 200, saturation: 78, lightness: 58, alpha: 0.22, scale: 1.4 },
        { hue: 315, saturation: 72, lightness: 62, alpha: 0.18, scale: 1.8 },
        { hue: 45, saturation: 92, lightness: 58, alpha: 0.15, scale: 1.2 }
    ],
    grid: {
        alpha: 0.08,
        spacing: 56,
        speed: 26
    }
};

export const INVADER_TYPES = [
    {
        key: "grunt",
        color: "#fbbf24",
        width: 34,
        height: 26,
        speedScale: 1,
        fireScale: 1,
        health: 1,
        score: 110
    },
    {
        key: "striker",
        color: "#fb7185",
        width: 32,
        height: 24,
        speedScale: 1.32,
        fireScale: 1.1,
        zigzag: true,
        zigzagAmplitude: 18,
        health: 1,
        score: 160
    },
    {
        key: "tank",
        color: "#fde68a",
        width: 40,
        height: 30,
        speedScale: 0.7,
        fireScale: 0.85,
        health: 3,
        score: 260
    },
    {
        key: "sapper",
        color: "#38bdf8",
        width: 34,
        height: 26,
        speedScale: 1,
        fireScale: 1.4,
        kamikaze: true,
        health: 1,
        score: 200
    },
    {
        key: "warden",
        color: "#a855f7",
        width: 38,
        height: 28,
        speedScale: 0.9,
        fireScale: 0.6,
        shield: 2,
        health: 2,
        score: 320
    },
    {
        key: "sniper",
        color: "#60a5fa",
        width: 30,
        height: 22,
        speedScale: 0.95,
        fireScale: 2.2,
        precision: true,
        health: 1,
        score: 280
    }
];

export const POWERUP_TYPES = [
    {
        key: "shield",
        label: "Shield",
        color: "#a3e635",
        duration: 0
    },
    {
        key: "overdrive",
        label: "Overdrive",
        color: "#f472b6",
        duration: 10
    },
    {
        key: "pierce",
        label: "Pierce",
        color: "#facc15",
        duration: 12
    },
    {
        key: "drone",
        label: "Wingmen",
        color: "#38bdf8",
        duration: 16
    }
];

export const POWERUP_CONFIG = {
    fallSpeed: 120
};

export const COMBO_CONFIG = {
    window: 2.4,
    multiplierStep: 0.25,
    maxMultiplier: 5,
    rewardPerStep: 120
};

export const TRAIL_CONFIG = {
    life: 0.4,
    wave: 12,
    maxLength: 120
};

export const CAMERA_CONFIG = {
    shakeFalloff: 2.8,
    shakeIntensity: 15
};

export const BOSS_CONFIG = {
    waveInterval: 5,
    baseHealth: 55,
    healthGrowth: 24,
    width: 200,
    height: 88,
    speed: 95,
    fireInterval: 1.32,
    rushInterval: 7.4,
    rushDuration: 1.5,
    rushSpeed: 235,
    score: 1850
};

export const PARTICLE_CONFIG = {
    count: 18,
    speed: 280,
    life: 0.65
};

export const AUDIO_CONFIG = {
    music: {
        bpm: 110,
        volume: 0.3
    },
    sfx: {
        shoot: 0.25,
        hit: 0.28,
        power: 0.32,
        explode: 0.4
    }
};
