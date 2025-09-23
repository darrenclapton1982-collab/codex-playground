import * as THREE from 'three';
import { lightingConfig } from '../config.js';

export function setupLighting(scene) {
    const sunLight = new THREE.DirectionalLight(lightingConfig.sun.color, lightingConfig.sun.intensity);
    sunLight.position.set(...lightingConfig.sun.position);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.bias = -0.0002;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 20;
    sunLight.shadow.camera.left = -5;
    sunLight.shadow.camera.right = 5;
    sunLight.shadow.camera.top = 5;
    sunLight.shadow.camera.bottom = -5;

    const ambientLight = new THREE.AmbientLight(lightingConfig.ambient.color, lightingConfig.ambient.intensity);

    scene.add(sunLight);
    scene.add(ambientLight);

    return { sunLight, ambientLight };
}
