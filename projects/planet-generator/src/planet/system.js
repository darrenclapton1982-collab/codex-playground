import * as THREE from 'three';
import { generateTerrainGeometry } from './terrain.js';
import { createTerrainMaterial } from '../materials/terrainMaterial.js';
import { createWaterMaterial } from '../materials/waterMaterial.js';
import { createAtmosphereMaterial } from '../materials/atmosphereMaterial.js';
import { createCloudMaterial } from '../materials/cloudMaterial.js';
import { terrainConfig, waterConfig, atmosphereConfig, cloudConfig } from '../config.js';

export function createPlanetSystem(seed) {
    const group = new THREE.Group();

    const terrainGeometry = generateTerrainGeometry(seed);
    const terrainMaterial = createTerrainMaterial();
    const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrainMesh.castShadow = true;
    terrainMesh.receiveShadow = true;
    group.add(terrainMesh);

    const waterRadius = terrainConfig.radius + terrainConfig.waterLevel + waterConfig.radiusOffset;
    const waterGeometry = new THREE.SphereGeometry(waterRadius, 256, 256);
    const waterMaterial = createWaterMaterial();
    const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.receiveShadow = true;
    waterMesh.castShadow = false;
    waterMesh.renderOrder = 1;
    group.add(waterMesh);

    const cloudRadius = terrainConfig.radius + cloudConfig.radiusOffset;
    const cloudGeometry = new THREE.SphereGeometry(cloudRadius, 192, 192);
    const cloudMaterial = createCloudMaterial();
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloudMesh.castShadow = false;
    cloudMesh.receiveShadow = false;
    cloudMesh.renderOrder = 2;
    group.add(cloudMesh);

    const atmosphereRadius = terrainConfig.radius + atmosphereConfig.radiusOffset;
    const atmosphereGeometry = new THREE.SphereGeometry(atmosphereRadius, 64, 64);
    const atmosphereMaterial = createAtmosphereMaterial();
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphereMesh.renderOrder = 0;
    group.add(atmosphereMesh);

    return {
        group,
        terrainMesh,
        waterMesh,
        cloudMesh,
        atmosphereMesh,
        materials: {
            water: waterMaterial,
            clouds: cloudMaterial
        }
    };
}
