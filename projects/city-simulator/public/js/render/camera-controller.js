import { Vector3 } from "/node_modules/three/build/three.module.js";

const STATE = {
  NONE: 0,
  ROTATE: 1,
  PAN: 2
};

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.state = STATE.NONE;
    this.enabled = true;

    this.spherical = {
      radius: 900,
      phi: Math.PI / 4,
      theta: Math.PI / 4
    };
    this.target = new Vector3(0, 0, 0);
    this.pointerId = null;

    this.rotateSensitivity = 0.0025;
    this.panSpeed = 0.8;
    this.zoomSpeed = 0.12;

    this._pointerStart = { x: 0, y: 0 };
    this._targetStart = new Vector3();

    this._listen();
    this.update();
  }

  _listen() {
    this.domElement.addEventListener("contextmenu", (event) => event.preventDefault());
    this.domElement.addEventListener("pointerdown", (event) => this._onPointerDown(event));
    window.addEventListener("pointermove", (event) => this._onPointerMove(event));
    window.addEventListener("pointerup", (event) => this._endInteraction(event));
    this.domElement.addEventListener("wheel", (event) => this._onWheel(event), { passive: false });
    window.addEventListener("keydown", (event) => this._onKeyDown(event));
  }

  _onPointerDown(event) {
    if (!this.enabled) {
      return;
    }
    this.pointerId = event.pointerId;
    this.domElement.setPointerCapture(this.pointerId);
    this._pointerStart.x = event.clientX;
    this._pointerStart.y = event.clientY;
    this._targetStart.copy(this.target);
    this.state = event.button === 2 || event.button === 1 ? STATE.PAN : STATE.ROTATE;
  }

  _onPointerMove(event) {
    if (!this.enabled || this.state === STATE.NONE) {
      return;
    }
    const deltaX = event.clientX - this._pointerStart.x;
    const deltaY = event.clientY - this._pointerStart.y;

    if (this.state === STATE.ROTATE) {
      this.spherical.theta -= deltaX * this.rotateSensitivity;
      this.spherical.phi -= deltaY * this.rotateSensitivity;
      this.spherical.phi = Math.max(0.1, Math.min(Math.PI / 2, this.spherical.phi));
    } else if (this.state === STATE.PAN) {
      const panX = -deltaX * this.panSpeed;
      const panZ = deltaY * this.panSpeed;
      this.target.set(
        this._targetStart.x + panX,
        this._targetStart.y,
        this._targetStart.z + panZ
      );
    }
  }

  _onWheel(event) {
    if (!this.enabled) {
      return;
    }
    event.preventDefault();
    const direction = Math.sign(event.deltaY);
    this.spherical.radius *= 1 + direction * this.zoomSpeed;
    this.spherical.radius = Math.max(140, Math.min(5000, this.spherical.radius));
  }

  _onKeyDown(event) {
    if (!this.enabled) {
      return;
    }
    const step = 50;
    switch (event.code) {
      case "KeyW":
        this.target.z -= step;
        break;
      case "KeyS":
        this.target.z += step;
        break;
      case "KeyA":
        this.target.x -= step;
        break;
      case "KeyD":
        this.target.x += step;
        break;
      case "KeyQ":
        this.spherical.radius *= 1 + this.zoomSpeed;
        break;
      case "KeyE":
        this.spherical.radius *= 1 - this.zoomSpeed;
        break;
      default:
        break;
    }
  }

  _endInteraction(event) {
    if (this.pointerId !== null && this.domElement.hasPointerCapture(this.pointerId)) {
      this.domElement.releasePointerCapture(this.pointerId);
    }
    this.pointerId = null;
    this.state = STATE.NONE;
  }

  update() {
    const sinPhiRadius = Math.sin(this.spherical.phi) * this.spherical.radius;
    const position = new Vector3(
      this.target.x + sinPhiRadius * Math.sin(this.spherical.theta),
      this.target.y + Math.cos(this.spherical.phi) * this.spherical.radius,
      this.target.z + sinPhiRadius * Math.cos(this.spherical.theta)
    );

    this.camera.position.copy(position);
    this.camera.lookAt(this.target);
  }
}
