import * as THREE from 'three';

export function createTerrainMaterial() {
    return new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: false,
        roughness: 0.95,
        metalness: 0.05
    });
}
