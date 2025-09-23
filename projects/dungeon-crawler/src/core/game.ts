import * as THREE from 'three';
import { DungeonBuilder } from '../dungeon/builder';
import { DungeonGenerator } from '../dungeon/generator';
import type { DungeonData } from '../dungeon/types';
import { InputManager } from './input';
import { PhysicsWorld } from '../physics/physics-world';
import { Player } from '../entities/player';
import { Hud } from '../ui/hud';

const PLAYER_HEIGHT = 1.8;

export type GamePhase = 'intro' | 'playing' | 'level-complete' | 'game-over';
export const GamePhaseValues: Record<string, GamePhase> = Object.freeze({
  Intro: 'intro',
  Playing: 'playing',
  LevelComplete: 'level-complete',
  GameOver: 'game-over',
});

export class Game {
  private readonly container: HTMLElement;
  private readonly hud: Hud;

  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private clock = new THREE.Clock();

  private readonly input = new InputManager();
  private readonly physics = new PhysicsWorld();
  private readonly generator = new DungeonGenerator();
  private readonly builder = new DungeonBuilder();

  private dungeon?: DungeonData;
  private dungeonGroup?: THREE.Group;
  private player?: Player;

  private phase: GamePhase = GamePhaseValues.Intro;
  private level = 1;
  private score = 0;

  constructor(container: HTMLElement, hud: Hud) {
    this.container = container;
    this.hud = hud;
  }

  async init(): Promise<void> {
    await this.physics.init();
    this.setupScene();
    await this.buildLevel(this.level);
    this.setupUi();
    this.animate();
  }

  private setupScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050608);

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, PLAYER_HEIGHT, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0x9ab3ff, 0.35);
    const dirLight = new THREE.DirectionalLight(0xd6e3ff, 0.55);
    dirLight.position.set(12, 16, -10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 60;

    const fillLight = new THREE.PointLight(0x234ba8, 0.35, 45, 2.2);
    fillLight.position.set(-15, 4, 4);

    this.scene.add(ambient, dirLight, fillLight);

    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('mousedown', () => {
      if (this.phase === GamePhaseValues.Playing) {
        this.input.requestAttack();
      }
    });
  }

  private setupUi(): void {
    this.hud.setLevel(this.level);
    this.hud.setScore(this.score);
    this.hud.setHealth(this.player?.health ?? 0, this.player?.healthMax ?? 100);
    this.hud.showOverlay('Procedural Dungeon', 'Click start and then click inside the window to lock the camera.', 'Start');
    this.hud.hideHud();
    this.hud.onAction(() => this.handleAction());
  }

  private async buildLevel(level: number): Promise<void> {
    this.physics.reset();

    if (this.dungeonGroup) {
      this.scene.remove(this.dungeonGroup);
      this.dungeonGroup = undefined;
    }

    if (this.player) {
      this.scene.remove(this.player.object);
      this.player = undefined;
    }

    this.dungeon = this.generator.generate(level);
    const visual = this.builder.build(this.dungeon);
    this.dungeonGroup = visual.group;
    this.scene.add(visual.group);

    visual.wallColliderTransforms.forEach((transform) => {
      this.physics.createWallCollider(transform);
    });

    const spawn = this.cellToWorld(this.dungeon.start);
    spawn.y = PLAYER_HEIGHT / 2;
    this.camera.position.copy(spawn);

    this.player = new Player({
      spawn,
      camera: this.camera,
      physics: this.physics,
      input: this.input,
    });
    this.scene.add(this.player.object);

    this.hud.setHealth(this.player.health, this.player.healthMax);
  }

  private handleAction(): void {
    switch (this.phase) {
      case GamePhaseValues.Intro:
        this.startRun();
        break;
      case GamePhaseValues.GameOver:
        this.restartRun();
        break;
      case GamePhaseValues.LevelComplete:
        this.advanceLevel();
        break;
      default:
        break;
    }
  }

  private startRun(): void {
    this.phase = GamePhaseValues.Playing;
    this.hud.hideOverlay();
    this.hud.showHud();
    this.clock.start();
    this.player?.lockPointer();
  }

  private async restartRun(): Promise<void> {
    this.level = 1;
    this.score = 0;
    await this.buildLevel(this.level);
    this.hud.setLevel(this.level);
    this.hud.setScore(this.score);
    this.phase = GamePhaseValues.Playing;
    this.hud.hideOverlay();
    this.hud.showHud();
    this.player?.lockPointer();
  }

  private async advanceLevel(): Promise<void> {
    this.level += 1;
    await this.buildLevel(this.level);
    this.hud.setLevel(this.level);
    this.phase = GamePhaseValues.Playing;
    this.hud.hideOverlay();
    this.player?.lockPointer();
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    if (this.phase === GamePhaseValues.Playing) {
      this.player?.update(delta);
      this.physics.step(delta);
    }
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    if (!this.renderer || !this.camera) {
      return;
    }
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private cellToWorld(cell: { x: number; y: number }): THREE.Vector3 {
    return new THREE.Vector3(cell.x + 0.5, PLAYER_HEIGHT / 2, cell.y + 0.5);
  }
}
