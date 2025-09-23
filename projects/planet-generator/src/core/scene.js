import * as THREE from 'three';
import { sceneConfig } from '../config.js';

export function createSceneContext(container) {
    const renderer = new THREE.WebGLRenderer({
        antialias: sceneConfig.renderer.antialias,
        alpha: sceneConfig.renderer.alpha
    });
    const pixelRatio = Math.min(
        sceneConfig.renderer.pixelRatioClamp.max,
        Math.max(sceneConfig.renderer.pixelRatioClamp.min, window.devicePixelRatio || 1)
    );
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(sceneConfig.backgroundColor, 1);
    renderer.domElement.id = 'planet-canvas';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneConfig.backgroundColor);

    const camera = new THREE.PerspectiveCamera(
        sceneConfig.camera.fov,
        container.clientWidth / container.clientHeight,
        sceneConfig.camera.near,
        sceneConfig.camera.far
    );
    const spherical = new THREE.Spherical(
        sceneConfig.camera.startDistance,
        sceneConfig.camera.startingPhi,
        sceneConfig.camera.startingTheta
    );
    camera.position.setFromSpherical(spherical);
    camera.lookAt(0, 0, 0);

    container.appendChild(renderer.domElement);

    return { scene, camera, renderer };
}

export function attachResizeHandler({ renderer, camera, container }) {
    function handleResize() {
        const { clientWidth, clientHeight } = container;
        renderer.setSize(clientWidth, clientHeight);
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}
