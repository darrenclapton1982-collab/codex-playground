import * as THREE from 'three';
import { clamp } from '../utils/math.js';
import { sceneConfig } from '../config.js';

export class CameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.target = new THREE.Vector3(0, 0, 0);
        this.spherical = new THREE.Spherical(
            sceneConfig.camera.startDistance,
            sceneConfig.camera.startingPhi,
            sceneConfig.camera.startingTheta
        );
        this.minDistance = sceneConfig.camera.minDistance;
        this.maxDistance = sceneConfig.camera.maxDistance;
        this.minPhi = 0.07;
        this.maxPhi = Math.PI - 0.07;
        this.rotateSpeed = 0.005;
        this.zoomSpeed = 0.7;

        this.previousPointer = new THREE.Vector2();
        this.isDragging = false;

        this.handlePointerDown = this.onPointerDown.bind(this);
        this.handlePointerMove = this.onPointerMove.bind(this);
        this.handlePointerUp = this.onPointerUp.bind(this);
        this.handleWheel = this.onWheel.bind(this);

        this.domElement.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
        this.domElement.addEventListener('wheel', this.handleWheel, { passive: false });

        this.updateCamera();
    }

    onPointerDown(event) {
        event.preventDefault();
        this.isDragging = true;
        this.previousPointer.set(event.clientX, event.clientY);
        window.addEventListener('pointermove', this.handlePointerMove, { passive: false });
        window.addEventListener('pointerup', this.handlePointerUp, { passive: false });
    }

    onPointerMove(event) {
        if (!this.isDragging) return;
        event.preventDefault();
        const deltaX = event.clientX - this.previousPointer.x;
        const deltaY = event.clientY - this.previousPointer.y;
        this.previousPointer.set(event.clientX, event.clientY);

        this.spherical.theta -= deltaX * this.rotateSpeed;
        this.spherical.phi = clamp(this.spherical.phi - deltaY * this.rotateSpeed, this.minPhi, this.maxPhi);
        this.updateCamera();
    }

    onPointerUp() {
        this.isDragging = false;
        window.removeEventListener('pointermove', this.handlePointerMove);
        window.removeEventListener('pointerup', this.handlePointerUp);
    }

    onWheel(event) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? 1 : -1;
        const factor = Math.exp(delta * this.zoomSpeed * 0.02);
        this.spherical.radius = clamp(this.spherical.radius * factor, this.minDistance, this.maxDistance);
        this.updateCamera();
    }

    updateCamera() {
        this.camera.position.setFromSpherical(this.spherical);
        this.camera.lookAt(this.target);
    }

    reset() {
        this.spherical.radius = sceneConfig.camera.startDistance;
        this.spherical.theta = sceneConfig.camera.startingTheta;
        this.spherical.phi = sceneConfig.camera.startingPhi;
        this.updateCamera();
    }

    dispose() {
        this.domElement.removeEventListener('pointerdown', this.handlePointerDown);
        this.domElement.removeEventListener('wheel', this.handleWheel);
        window.removeEventListener('pointermove', this.handlePointerMove);
        window.removeEventListener('pointerup', this.handlePointerUp);
    }
}
