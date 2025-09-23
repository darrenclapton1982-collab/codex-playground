export interface ActionSnapshot {
  attack: boolean;
  interact: boolean;
  restart: boolean;
}

export class InputManager {
  private readonly pressed = new Set<string>();
  private attackRequested = false;
  private interactRequested = false;
  private restartRequested = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (event: KeyboardEvent) => {
    this.pressed.add(event.code);
    if (event.code === 'Space' || event.code === 'Click') {
      event.preventDefault();
    }
    if (event.code === 'KeyE') {
      this.interactRequested = true;
    }
    if (event.code === 'KeyR') {
      this.restartRequested = true;
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.pressed.delete(event.code);
  };

  requestAttack(): void {
    this.attackRequested = true;
  }

  consumeActions(): ActionSnapshot {
    const snapshot: ActionSnapshot = {
      attack: this.attackRequested,
      interact: this.interactRequested,
      restart: this.restartRequested,
    };
    this.attackRequested = false;
    this.interactRequested = false;
    this.restartRequested = false;
    return snapshot;
  }

  get movement() {
    const forward = this.pressed.has('KeyW') ? 1 : 0;
    const backward = this.pressed.has('KeyS') ? 1 : 0;
    const left = this.pressed.has('KeyA') ? 1 : 0;
    const right = this.pressed.has('KeyD') ? 1 : 0;
    return {
      forward: forward - backward,
      right: right - left,
    };
  }

  get isMoving(): boolean {
    const { forward, right } = this.movement;
    return forward !== 0 || right !== 0;
  }
}
