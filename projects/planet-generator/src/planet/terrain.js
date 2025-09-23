import * as THREE from 'three';
import { createTerrainNoise } from '../noise/terrainNoise.js';
import { pickBiome } from './biomes.js';
import { terrainConfig } from '../config.js';

const TEMP_VECTOR = new THREE.Vector3();
const DIRECTION = new THREE.Vector3();

export function generateTerrainGeometry(seed) {
    const geometry = new THREE.SphereGeometry(terrainConfig.radius, 256, 256);
    const positionAttribute = geometry.attributes.position;
    const vertexCount = positionAttribute.count;
    const colors = new Float32Array(vertexCount * 3);
    const biomeTypes = new Array(vertexCount);
    const elevationData = new Float32Array(vertexCount);

    const noise = createTerrainNoise(seed);

    for (let i = 0; i < vertexCount; i += 1) {
        TEMP_VECTOR.fromBufferAttribute(positionAttribute, i);
        DIRECTION.copy(TEMP_VECTOR).normalize();
        const elevationInfo = noise.getElevation(DIRECTION);
        const radius = terrainConfig.radius + elevationInfo.displacement;

        TEMP_VECTOR.copy(DIRECTION).multiplyScalar(radius);
        positionAttribute.setXYZ(i, TEMP_VECTOR.x, TEMP_VECTOR.y, TEMP_VECTOR.z);

        const moisture = noise.getMoisture(DIRECTION);
        const biome = pickBiome({
            elevationNormalized: elevationInfo.normalized,
            latitude: DIRECTION.y,
            moisture,
            isUnderWater: elevationInfo.displacement < terrainConfig.waterLevel
        });

        colors[i * 3] = biome.color[0];
        colors[i * 3 + 1] = biome.color[1];
        colors[i * 3 + 2] = biome.color[2];
        biomeTypes[i] = biome.name;
        elevationData[i] = elevationInfo.displacement;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    geometry.userData = {
        biomeTypes,
        elevationData
    };

    return geometry;
}
