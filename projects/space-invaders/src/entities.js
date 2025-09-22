import { STARFIELD } from "./config.js";

export function createStars(width, height, options = STARFIELD) {
    const { count, minRadius, maxRadius, minAlpha, maxAlpha } = options;
    return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * (maxRadius - minRadius) + minRadius,
        a: Math.random() * (maxAlpha - minAlpha) + minAlpha
    }));
}

export function createPlayer(width, height) {
    return {
        x: width / 2 - 22,
        y: height - 60,
        width: 44,
        height: 20,
        speed: 260
    };
}

export function resetPlayerPosition(player, width, height) {
    player.x = width / 2 - player.width / 2;
    player.y = height - 60;
}

export function spawnWave(width, wave, preset) {
    const cols = 8;
    const extraRows = Math.min(wave - 1, preset.rowsMaxExtra);
    const rows = preset.rowsBase + extraRows;
    const invaderWidth = 34;
    const invaderHeight = 26;
    const horizontalGap = 48;
    const verticalGap = 38;
    const startX = (width - (cols - 1) * horizontalGap) / 2 - invaderWidth / 2;
    const startY = 70;

    const invaders = [];
    for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
            invaders.push({
                x: startX + c * horizontalGap,
                y: startY + r * verticalGap,
                width: invaderWidth,
                height: invaderHeight,
                col: c
            });
        }
    }
    return invaders;
}

export function makePlayerShot(player) {
    return {
        x: player.x + player.width / 2 - 2,
        y: player.y - 14,
        width: 4,
        height: 14,
        speed: 520
    };
}

export function makeEnemyShot(invader, speed) {
    return {
        x: invader.x + invader.width / 2 - 3,
        y: invader.y + invader.height,
        width: 6,
        height: 16,
        speed
    };
}
