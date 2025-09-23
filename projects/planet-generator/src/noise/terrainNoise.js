import SimplexNoise from 'simplex-noise';
import { terrainConfig, biomeConfig } from '../config.js';
import { smoothstep, clamp } from '../utils/math.js';
import { stringToSeed } from '../utils/random.js';

const { continentFrequency, continentAmplitude, detail, ridged, plateau, radius, waterLevel } = terrainConfig;

function fbm(noise, vector, { frequency, octaves, lacunarity, persistence }) {
    let amplitude = 1;
    let total = 0;
    let normalization = 0;
    let freq = frequency;
    for (let i = 0; i < octaves; i += 1) {
        const nx = vector.x * freq;
        const ny = vector.y * freq;
        const nz = vector.z * freq;
        total += noise.noise3D(nx, ny, nz) * amplitude;
        normalization += amplitude;
        amplitude *= persistence;
        freq *= lacunarity;
    }
    return normalization === 0 ? 0 : total / normalization;
}

function ridgedNoise(noise, vector, frequency) {
    const value = noise.noise3D(vector.x * frequency, vector.y * frequency, vector.z * frequency);
    const ridge = 1 - Math.abs(value);
    return ridge * ridge;
}

export function createTerrainNoise(seed) {
    const continentNoise = new SimplexNoise(stringToSeed(`${seed}-continents`));
    const detailNoise = new SimplexNoise(stringToSeed(`${seed}-detail`));
    const ridgeNoise = new SimplexNoise(stringToSeed(`${seed}-ridge`));
    const moistureBase = new SimplexNoise(stringToSeed(`${seed}-moisture-base`));
    const moistureDetail = new SimplexNoise(stringToSeed(`${seed}-moisture-detail`));

    function getElevation(vector) {
        const continent = continentNoise.noise3D(
            vector.x * continentFrequency,
            vector.y * continentFrequency,
            vector.z * continentFrequency
        ) * continentAmplitude;

        const detailLayer = fbm(detailNoise, vector, detail) * 0.32;
        const ridgedLayer = ridgedNoise(ridgeNoise, vector, ridged.frequency) * ridged.amplitude;

        let elevation = continent + detailLayer + ridgedLayer;
        elevation = Math.max(elevation, -radius * 0.25);

        if (elevation > plateau.threshold) {
            const t = clamp((elevation - plateau.threshold) / (1 - plateau.threshold), 0, 1);
            const flatten = plateau.threshold + plateau.blend * t;
            elevation = elevation * (1 - t) + flatten * t;
        }

        const normalized = smoothstep(-radius * 0.25, radius * 0.6, elevation);
        const snowMask = smoothstep(0.55, 0.85, normalized);
        elevation += snowMask * 0.05;

        return {
            displacement: elevation,
            normalized,
            isUnderWater: elevation < waterLevel
        };
    }

    function getMoisture(vector) {
        const base = moistureBase.noise3D(
            vector.x * biomeConfig.moistureFrequency,
            vector.y * biomeConfig.moistureFrequency,
            vector.z * biomeConfig.moistureFrequency
        );
        const detailValue = fbm(moistureDetail, vector, {
            frequency: biomeConfig.moistureFrequency * 2,
            octaves: biomeConfig.moistureOctaves,
            lacunarity: 2.3,
            persistence: 0.55
        });
        const combined = (base * 0.6 + detailValue * 0.4 + 1) * 0.5;
        return clamp(combined, 0, 1);
    }

    return {
        getElevation,
        getMoisture
    };
}
