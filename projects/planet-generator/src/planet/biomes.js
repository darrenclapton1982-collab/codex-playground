import { blendColors } from '../utils/color.js';
import { clamp } from '../utils/math.js';

const palette = {
    oceanDeep: [0.015, 0.058, 0.14],
    oceanShallow: [0.039, 0.278, 0.458],
    beach: [0.85, 0.78, 0.62],
    desert: [0.84, 0.72, 0.46],
    savanna: [0.56, 0.6, 0.32],
    grassland: [0.28, 0.57, 0.28],
    forest: [0.13, 0.43, 0.19],
    rainforest: [0.07, 0.36, 0.15],
    taiga: [0.2, 0.36, 0.34],
    tundra: [0.52, 0.58, 0.62],
    alpine: [0.6, 0.64, 0.69],
    rock: [0.48, 0.43, 0.38],
    ice: [0.92, 0.96, 1.0]
};

function oceanColor(elevationNormalized) {
    const t = clamp(elevationNormalized * 2, 0, 1);
    return blendColors(palette.oceanDeep, palette.oceanShallow, t);
}

function elevationBands(elevationNormalized) {
    if (elevationNormalized > 0.82) return 'summit';
    if (elevationNormalized > 0.7) return 'alpine';
    if (elevationNormalized > 0.55) return 'highland';
    if (elevationNormalized > 0.35) return 'mid';
    return 'low';
}

export function pickBiome({ elevationNormalized, latitude, moisture, isUnderWater }) {
    if (isUnderWater) {
        return {
            name: 'ocean',
            color: oceanColor(elevationNormalized)
        };
    }

    const lat = Math.abs(latitude);
    const temperature = clamp(1 - lat * lat - elevationNormalized * 0.4, 0, 1);
    const band = elevationBands(elevationNormalized);

    if (band === 'summit') {
        return { name: 'ice-cap', color: palette.ice };
    }

    if (band === 'alpine') {
        const t = clamp((elevationNormalized - 0.7) / 0.12, 0, 1);
        const color = blendColors(palette.rock, palette.ice, Math.pow(t, 1.5));
        return { name: 'alpine', color };
    }

    if (temperature < 0.25) {
        if (moisture < 0.4) {
            return { name: 'frozen-steppe', color: palette.tundra };
        }
        return { name: 'taiga', color: palette.taiga };
    }

    if (temperature < 0.45) {
        if (moisture < 0.35) {
            return { name: 'steppe', color: palette.rock };
        }
        return { name: 'boreal-forest', color: palette.taiga };
    }

    if (temperature < 0.65) {
        if (moisture < 0.28) {
            return { name: 'semi-arid', color: palette.savanna };
        }
        if (moisture < 0.5) {
            return { name: 'grassland', color: palette.grassland };
        }
        return { name: 'temperate-forest', color: palette.forest };
    }

    if (moisture < 0.18) {
        return { name: 'desert', color: palette.desert };
    }
    if (moisture < 0.33) {
        return { name: 'savanna', color: palette.savanna };
    }
    if (moisture < 0.6) {
        return { name: 'rainforest-edge', color: palette.forest };
    }
    return { name: 'rainforest', color: palette.rainforest };
}

export { palette as biomePalette };
