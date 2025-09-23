import RAPIER, {
  QueryFilterFlags,
  type Collider,
  type KinematicCharacterController,
  type RigidBody,
  type World,
} from '@dimforge/rapier3d-compat';

export interface CharacterControllerBundle {
  body: RigidBody;
  collider: Collider;
  controller: KinematicCharacterController;
}

export class PhysicsWorld {
  private world!: World;
  private accumulator = 0;
  private readonly fixedTimestep = 1 / 60;

  async init(): Promise<void> {
    await RAPIER.init();
    this.reset();
  }

  reset(): void {
    if (this.world) {
      this.world.free();
    }
    this.world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    this.world.integrationParameters.dt = this.fixedTimestep;
  }

  step(delta: number): void {
    this.accumulator += delta;
    while (this.accumulator >= this.fixedTimestep) {
      this.world.step();
      this.accumulator -= this.fixedTimestep;
    }
  }

  createWallCollider(options: {
    x: number;
    y: number;
    z: number;
    sx: number;
    sy: number;
    sz: number;
  }): Collider {
    const rigidDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(options.x, options.y, options.z);
    const rigid = this.world.createRigidBody(rigidDesc);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(options.sx, options.sy, options.sz);
    colliderDesc.setFriction(0.8);
    colliderDesc.setRestitution(0.05);
    return this.world.createCollider(colliderDesc, rigid);
  }

  createCharacter(options: {
    position: { x: number; y: number; z: number };
    height: number;
    radius: number;
  }): CharacterControllerBundle {
    const halfHeight = Math.max(options.height / 2 - options.radius, 0.01);
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      options.position.x,
      options.position.y,
      options.position.z
    );
    const body = this.world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, options.radius);
    colliderDesc.setFriction(0.2);
    const collider = this.world.createCollider(colliderDesc, body);

    const controller = this.world.createCharacterController(options.radius * 0.75);
    controller.setUp({ x: 0, y: 1, z: 0 });
    controller.setSlideEnabled(true);
    controller.enableAutostep(0.35, 0.3, true);
    controller.enableSnapToGround(0.5);
    controller.setApplyImpulsesToDynamicBodies(true);
    controller.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    controller.setMinSlopeSlideAngle((70 * Math.PI) / 180);

    return { body, collider, controller };
  }

  moveCharacter(
    bundle: CharacterControllerBundle,
    desired: { x: number; y: number; z: number }
  ): { x: number; y: number; z: number } {
    const { controller, collider, body } = bundle;
    controller.computeColliderMovement(
      collider,
      desired,
      QueryFilterFlags.EXCLUDE_SENSORS,
      undefined,
      (candidate) => candidate !== collider
    );
    const movement = controller.computedMovement();
    const translation = body.translation();
    const next = {
      x: translation.x + movement.x,
      y: translation.y + movement.y,
      z: translation.z + movement.z,
    };
    body.setNextKinematicTranslation(next);
    return next;
  }
}
