import * as THREE from 'three';
import { animationConfig, cloudConfig } from './config.js';

export function createRenderLoop({ renderer, scene, camera, planetSystem }) {
    const clock = new THREE.Clock();
    let rotationSpeed = animationConfig.defaultRotationSpeed;
    let rotationPaused = false;
    let animationFrameId = null;

    function renderFrame() {
        const delta = clock.getDelta();
        const elapsed = clock.elapsedTime;

        if (!rotationPaused) {
            planetSystem.group.rotation.y += rotationSpeed * delta;
        }

        planetSystem.materials.water.uniforms.time.value = elapsed;
        planetSystem.materials.clouds.uniforms.time.value = elapsed;
        planetSystem.cloudMesh.rotation.y += delta * cloudConfig.speed * 6;

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(renderFrame);
    }

    function start() {
        if (animationFrameId === null) {
            clock.start();
            animationFrameId = requestAnimationFrame(renderFrame);
        }
    }

    function stop() {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    return {
        start,
        stop,
        setRotationSpeed(value) {
            rotationSpeed = THREE.MathUtils.clamp(value, animationConfig.minRotationSpeed, animationConfig.maxRotationSpeed);
        },
        setRotationPaused(value) {
            rotationPaused = value;
        },
        isPaused: () => rotationPaused,
        getRotationSpeed: () => rotationSpeed
    };
}
