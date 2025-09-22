export const HIGH_SCORE_KEY = "space-invaders-prototype-high-score";

export const difficultyPresets = {
    relaxed: {
        playerSpeed: 220,
        playerCooldown: 0.32,
        invaderSpeedBase: 26,
        invaderSpeedRamp: 4.5,
        enemyShotSpeedBase: 150,
        enemyShotSpeedRamp: 12,
        enemyFireIntervalBase: 1.6,
        enemyFireIntervalFloor: 0.85,
        enemyFireIntervalStep: 0.1,
        invaderDrop: 24,
        rowsBase: 3,
        rowsMaxExtra: 2,
        waveBonus: 150
    },
    standard: {
        playerSpeed: 260,
        playerCooldown: 0.25,
        invaderSpeedBase: 35,
        invaderSpeedRamp: 6,
        enemyShotSpeedBase: 180,
        enemyShotSpeedRamp: 18,
        enemyFireIntervalBase: 1.4,
        enemyFireIntervalFloor: 0.7,
        enemyFireIntervalStep: 0.12,
        invaderDrop: 28,
        rowsBase: 4,
        rowsMaxExtra: 3,
        waveBonus: 200
    },
    intense: {
        playerSpeed: 320,
        playerCooldown: 0.18,
        invaderSpeedBase: 44,
        invaderSpeedRamp: 8,
        enemyShotSpeedBase: 220,
        enemyShotSpeedRamp: 22,
        enemyFireIntervalBase: 1.15,
        enemyFireIntervalFloor: 0.5,
        enemyFireIntervalStep: 0.14,
        invaderDrop: 32,
        rowsBase: 5,
        rowsMaxExtra: 4,
        waveBonus: 260
    }
};

export const PLAYER_LIMITS = {
    left: 12,
    right: 12
};

export const STARFIELD = {
    count: 70,
    minRadius: 0.4,
    maxRadius: 1.8,
    minAlpha: 0.4,
    maxAlpha: 0.8
};
