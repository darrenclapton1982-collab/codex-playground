import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  FogExp2,
  Vector3,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  Clock,
  AxesHelper
} from "/node_modules/three/build/three.module.js";

import { CameraController } from "./camera-controller.js";
import { CityVisualizer } from "./city-visualizer.js";
import { WeatherSystem } from "./weather-system.js";

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new Scene();
    this.scene.background = new Color("#0b101e");
    this.scene.fog = new FogExp2("#0b101e", 0.0007);

    this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 10, 20000);
    this.camera.position.set(600, 700, 600);

    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    this.clock = new Clock();

    this.controller = new CameraController(this.camera, canvas);
    this.visualizer = new CityVisualizer(this.scene);
    this.weatherSystem = new WeatherSystem(this.scene);

    this.lights = this._createLights();

    this.simulationState = null;
    this.loopCallback = null;
    this.isRunning = false;

    window.addEventListener("resize", () => this._onResize());
  }

  _createLights() {
    const ambient = new AmbientLight("#f0f4ff", 0.5);
    const hemisphere = new HemisphereLight("#9ecfff", "#0b101e", 0.55);
    const sun = new DirectionalLight("#ffffff", 1.2);
    sun.castShadow = true;
    sun.position.set(300, 800, 300);
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 3000;

    this.scene.add(ambient, hemisphere, sun);
    return { ambient, hemisphere, sun };
  }

  setCity(city) {
    this.visualizer.loadCity(city);
  }

  setSimulation(simulation) {
    this.simulation = simulation;
  }

  start(loopCallback) {
    this.loopCallback = loopCallback;
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.clock.start();
    this._tick();
  }

  _tick() {
    if (!this.isRunning) {
      return;
    }
    requestAnimationFrame(() => this._tick());
    const delta = this.clock.getDelta();
    let state = this.simulationState;
    if (this.loopCallback) {
      state = this.loopCallback(delta) || state;
    }
    if (state) {
      this.applySimulationState(state, delta);
    }
    this.controller.update();
    this.weatherSystem.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  applySimulationState(state, delta) {
    this.simulationState = state;
    const time = state.time ?? { hour: 12 };
    const weather = state.weather ?? { current: "clear", intensity: 0 };

    this._updateLights(time);
    this.visualizer.updateLighting(time);
    this.visualizer.updateWeather(weather);
    this.weatherSystem.setWeather(weather);
  }

  _updateLights(time) {
    const daylight = Math.cos(((time.hour ?? 12) / 24) * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
    const intensity = Math.max(0.15, daylight);
    this.lights.sun.intensity = 0.6 + intensity * 0.9;
    this.lights.ambient.intensity = 0.3 + intensity * 0.5;
    this.lights.hemisphere.intensity = 0.25 + intensity * 0.4;

    const angle = ((time.hour ?? 12) / 24) * Math.PI * 2;
    this.lights.sun.position.set(Math.cos(angle) * 800, 600 + intensity * 400, Math.sin(angle) * 800);
  }

  _onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

