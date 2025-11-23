export const WORLD_HEIGHT = 120;

export const COLORS = {
    player: 0x7cf6ff,
    invader: 0xffb347,
    elite: 0xff77c0,
    boss: 0x9ac7ff,
    bullet: 0xffffff,
    bomb: 0xff7f7f,
    powerups: {
        shield: 0x7cffc4,
        rapid: 0xffb347,
        spread: 0x9a8bff
    },
    backdrop: 0x03040d
};

export const DIFFICULTIES = {
    relaxed: {
        fireRate: 0.55,
        invaderSpeed: 3.2,
        invaderDrop: 5,
        invaderColumns: 7,
        invaderRows: 3,
        bombs: 0.12
    },
    standard: {
        fireRate: 0.4,
        invaderSpeed: 3.8,
        invaderDrop: 6,
        invaderColumns: 8,
        invaderRows: 4,
        bombs: 0.16
    },
    intense: {
        fireRate: 0.28,
        invaderSpeed: 4.6,
        invaderDrop: 7,
        invaderColumns: 9,
        invaderRows: 5,
        bombs: 0.2
    }
};

export const POWERUP_TYPES = [
    { key: "shield", label: "Shield +1", duration: 0, chance: 0.28 },
    { key: "rapid", label: "Rapid Fire", duration: 10, chance: 0.24 },
    { key: "spread", label: "Spread Shot", duration: 10, chance: 0.2 }
];

export const PLAYER = {
    speed: 36,
    baseFireCooldown: 0.33,
    bulletSpeed: 90,
    size: { w: 7, h: 6 }
};

export const INVADERS = {
    size: { w: 8, h: 6 },
    spacing: { x: 3, y: 3 },
    baseStep: 18,
    baseHealth: 1,
    score: 35,
    elite: {
        chance: 0.15,
        score: 120,
        health: 2,
        speedBoost: 1.2
    }
};

export const BOMB_SPEED = 38;
export const POWERUP_FALL_SPEED = 18;
export const SHIELD_MAX = 3;
