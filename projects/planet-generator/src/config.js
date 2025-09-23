export const sceneConfig = {
    backgroundColor: 0x02030f,
    renderer: {
        antialias: true,
        alpha: false,
        pixelRatioClamp: { min: 1, max: 2 }
    },
    camera: {
        fov: 45,
        near: 0.1,
        far: 100,
        startDistance: 5,
        minDistance: 1.8,
        maxDistance: 12,
        startingTheta: Math.PI * 0.2,
        startingPhi: Math.PI * 0.62
    }
};

export const terrainConfig = {
    radius: 1,
    waterLevel: 0.02,
    continentFrequency: 0.6,
    continentAmplitude: 0.4,
    detail: {
        frequency: 2.8,
        octaves: 5,
        lacunarity: 2.2,
        persistence: 0.5
    },
    ridged: {
        frequency: 2.1,
        amplitude: 0.22
    },
    plateau: {
        threshold: 0.55,
        blend: 0.18
    }
};

export const biomeConfig = {
    moistureFrequency: 0.9,
    moistureOctaves: 3,
    snowLatitude: 0.7,
    desertLatitude: 0.15
};

export const lightingConfig = {
    sun: {
        intensity: 2.4,
        color: 0xfff1d0,
        position: [6, 3, 2]
    },
    ambient: {
        intensity: 0.45,
        color: 0x516073
    }
};

export const animationConfig = {
    defaultRotationSpeed: 0.02,
    maxRotationSpeed: 0.2,
    minRotationSpeed: 0
};

export const cloudConfig = {
    radiusOffset: 0.04,
    speed: 0.003,
    coverage: 0.45
};

export const atmosphereConfig = {
    radiusOffset: 0.06,
    intensity: 0.8,
    colorInner: [0.4, 0.65, 1.0],
    colorOuter: [0.02, 0.07, 0.2]
};

export const waterConfig = {
    radiusOffset: -0.01,
    distortionStrength: 0.03,
    fresnelPower: 3.5,
    colorDeep: [0.03, 0.19, 0.38],
    colorShallow: [0.13, 0.44, 0.65]
};
