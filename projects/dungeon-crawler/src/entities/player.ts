import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { PhysicsWorld } from '../physics/physics-world';
import type { CharacterControllerBundle } from '../physics/physics-world';
import { InputManager } from '../core/input';

export interface PlayerOptions {
  spawn: { x: number; y: number; z: number };
  camera: THREE.PerspectiveCamera;
  physics: PhysicsWorld;
  input: InputManager;
}

export interface PlayerAttackResult {
  forward: THREE.Vector3;
  origin: THREE.Vector3;
}

export class Player {
  readonly height = 1.8;
  readonly radius = 0.35;
  readonly speed = 5.2;
  readonly healthMax = 100;

  health = this.healthMax;
  score = 0;

  readonly controls: PointerLockControls;
  readonly object: THREE.Object3D;
  readonly colliderBundle: CharacterControllerBundle;

  isLocked = false;
  isGrounded = true;

  private readonly input: InputManager;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly physics: PhysicsWorld;
  private readonly forwardHelper = new THREE.Vector3();
  private readonly rightHelper = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly tempMove = new THREE.Vector3();

  constructor(options: PlayerOptions) {
    this.camera = options.camera;
    this.physics = options.physics;
    this.input = options.input;
    this.controls = new PointerLockControls(this.camera, document.body);
    this.object = this.camera;
    this.object.position.set(options.spawn.x, options.spawn.y, options.spawn.z);

    this.colliderBundle = this.physics.createCharacter({
      position: options.spawn,
      height: this.height,
      radius: this.radius,
    });

    this.controls.addEventListener('lock', () => {
      this.isLocked = true;
    });
    this.controls.addEventListener('unlock', () => {
      this.isLocked = false;
    });
  }

  update(delta: number): void {
    const movement = this.input.movement;
    this.tempMove.set(0, 0, 0);

    if (movement.forward !== 0 || movement.right !== 0) {
      this.forwardHelper.set(0, 0, -1);
      this.forwardHelper.applyQuaternion(this.camera.quaternion);
      this.forwardHelper.y = 0;
      this.forwardHelper.normalize();

      this.rightHelper.copy(this.forwardHelper).cross(this.up).normalize();

      this.tempMove.addScaledVector(this.forwardHelper, movement.forward);
      this.tempMove.addScaledVector(this.rightHelper, movement.right);
      if (this.tempMove.lengthSq() > 0) {
        this.tempMove.normalize().multiplyScalar(this.speed * delta);
      }
    }

    const desired = { x: this.tempMove.x, y: this.tempMove.y, z: this.tempMove.z };
    const next = this.physics.moveCharacter(this.colliderBundle, desired);
    this.object.position.set(next.x, next.y, next.z);
  }

  lockPointer(): void {
    if (!this.isLocked) {
      this.controls.lock();
    }
  }

  unlockPointer(): void {
    if (this.isLocked) {
      this.controls.unlock();
    }
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  heal(amount: number): void {
    this.health = Math.min(this.healthMax, this.health + amount);
  }

  attack(): PlayerAttackResult {
    const origin = new THREE.Vector3().copy(this.camera.position);
    const forward = new THREE.Vector3();
    this.controls.getDirection(forward);
    forward.normalize();
    return { origin, forward };
  }
}
