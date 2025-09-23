import { createSceneContext, attachResizeHandler } from './core/scene.js';
import { setupLighting } from './environment/lighting.js';
import { createPlanetSystem } from './planet/system.js';
import { CameraController } from './controls/cameraController.js';
import { createRenderLoop } from './renderLoop.js';
import { createControlPanel } from './ui/controlsPanel.js';
import { animationConfig } from './config.js';

const PLANET_SEED = 'codex-world-01';

export function init() {
    const container = document.getElementById('scene-container');
    if (!container) {
        throw new Error('Scene container element not found.');
    }

    const { scene, camera, renderer } = createSceneContext(container);
    const detachResize = attachResizeHandler({ renderer, camera, container });
    setupLighting(scene);

    const planetSystem = createPlanetSystem(PLANET_SEED);
    scene.add(planetSystem.group);

    const cameraController = new CameraController(camera, renderer.domElement);

    const renderLoop = createRenderLoop({ renderer, scene, camera, planetSystem });

    const { element: panel, updateSpeedValue } = createControlPanel({
        onSpeedChange: (value) => {
            renderLoop.setRotationSpeed(value);
            if (renderLoop.isPaused()) {
                renderLoop.setRotationPaused(false);
            }
        },
        onToggleRotation: (paused) => renderLoop.setRotationPaused(paused),
        onResetCamera: () => cameraController.reset()
    });

    updateSpeedValue(animationConfig.defaultRotationSpeed);
    document.body.appendChild(panel);

    renderLoop.start();

    const cleanup = () => {
        renderLoop.stop();
        detachResize();
        cameraController.dispose();
        panel.remove();
    };

    window.addEventListener('beforeunload', cleanup, { once: true });
}
