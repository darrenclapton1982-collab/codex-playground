import { Raycaster, Vector2, Vector3, Plane } from "/node_modules/three/build/three.module.js";

import { CityGenerator } from "./city/city-generator.js";
import { CitySimulation } from "./simulation/city-simulation.js";
import { SceneManager } from "./render/scene-manager.js";
import { UIController } from "./ui/ui-controller.js";
import { SimulationWorkerBridge } from "./simulation/worker-bridge.js";
import { CollaborationChannel } from "./ui/collaboration.js";
import {
  CityAction,
  Building,
  RoadSegment,
  Park,
  BuildingCategory,
  RoadType
} from "./city/city-data.js";

const canvas = document.getElementById("city-canvas");
const ui = new UIController(document);
const sceneManager = new SceneManager(canvas);
const generator = new CityGenerator();
const workerBridge = new SimulationWorkerBridge();
const collaboration = new CollaborationChannel();

const raycaster = new Raycaster();
const pointer = new Vector2();
const groundPlane = new Plane(new Vector3(0, 1, 0), 0);

let currentSeed = Math.random().toString(36).slice(2, 8);
let densityFactor = 1;
let roadFactor = 1;
let weatherEnabled = true;
let dayNightEnabled = true;
let sandboxTool = "road";
let mode = "procedural";
let city = null;
let simulation = null;
let nextForecastTime = 0;
let lastState = null;

function generateCity(seed = currentSeed) {
  const overrides = {
    localRoadProbability: 0.2 * roadFactor,
    mainRoadSpacing: 240 / Math.max(0.4, roadFactor),
    secondaryRoadSpacing: 160 / Math.max(0.4, roadFactor),
    parkProbability: 0.08 / Math.max(0.5, densityFactor),
    blockSize: 40 / Math.max(0.6, densityFactor * 0.8)
  };

  city = generator.generate(seed, overrides);
  simulation = new CitySimulation(city, { timeScale: ui.elements.speedSlider ? Number(ui.elements.speedSlider.value) : 60 });
  sceneManager.setCity(city);
  sceneManager.setSimulation(simulation);
  currentSeed = seed;
  ui.updateStats(simulation.getState());
}

function regenerateWithCurrentSeed() {
  const providedSeed = ui.elements.seedInput?.value.trim();
  const seed = providedSeed || currentSeed || Math.random().toString(36).slice(2, 8);
  generateCity(seed);
}

function randomizeSeed() {
  const newSeed = Math.random().toString(36).slice(2, 8);
  if (ui.elements.seedInput) {
    ui.elements.seedInput.value = newSeed;
  }
  generateCity(newSeed);
}

function worldFromEvent(event) {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, sceneManager.camera);
  const target = new Vector3();
  raycaster.ray.intersectPlane(groundPlane, target);
  return target;
}

function applyAction(action, { broadcast = false } = {}) {
  if (!action) {
    return;
  }
  switch (action.type) {
    case "build":
      handleBuildAction(action.payload);
      break;
    case "road":
      handleRoadAction(action.payload);
      break;
    case "park":
      handleParkAction(action.payload);
      break;
    case "clear":
      handleClearAction(action.payload);
      break;
    default:
      break;
  }
  simulation.applyAction(action);
  sceneManager.setCity(city);
  sceneManager.visualizer.highlightAction(action);
  if (broadcast) {
    collaboration.broadcast(action);
  }
}

function handleBuildAction(payload) {
  const building = new Building({
    id: `user-building-${Date.now()}`,
    position: { x: payload.position.x, y: 0, z: payload.position.z },
    footprint: payload.footprint,
    height: payload.height,
    floors: payload.floors,
    color: payload.color,
    category: payload.category,
    districtId: payload.districtId ?? (city.districts[0]?.id ?? "district-0"),
    populationCapacity: payload.populationCapacity ?? 0,
    jobCapacity: payload.jobCapacity ?? 0,
    quality: payload.quality ?? 0.7,
    style: payload.style ?? "custom"
  });
  city.addBuilding(building);
}
function handleRoadAction(payload) {
  const from = { x: payload.from.x, z: payload.from.z };
  const to = { x: payload.to.x, z: payload.to.z };
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = payload.length ?? Math.hypot(dx, dz) || 100;
  payload.length = length;
  const road = new RoadSegment({
    id: `user-road-${Date.now()}`,
    from,
    to,
    width: payload.width ?? 20,
    lanes: payload.lanes ?? 2,
    type: payload.type ?? RoadType.LOCAL
  });
  city.addRoad(road);
}

function handleParkAction(payload) {
  if (!payload?.position) {
    return;
  }
  const park = new Park({
    id: `user-park-${Date.now()}`,
    position: { x: payload.position.x, y: 0, z: payload.position.z },
    radius: payload.radius ?? 45,
    hasWaterFeature: Boolean(payload.hasWaterFeature)
  });
  city.addPark(park);
}

function handleClearAction(payload) {
  const radius = payload.radius ?? 40;
  let removedCapacity = 0;
  let removedJobs = 0;
  city.buildings = city.buildings.filter((building) => {
    const dx = building.position.x - payload.position.x;
    const dz = building.position.z - payload.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= radius) {
      const pop = building.populationCapacity || 0;
      const jobs = building.jobCapacity || 0;
      city.metadata.populationCapacity -= pop;
      city.metadata.jobCapacity -= jobs;
      removedCapacity += pop;
      removedJobs += jobs;
      return false;
    }
    return true;
  });
  payload.populationCapacity = removedCapacity;
  payload.jobCapacity = removedJobs;
}

function createBuildPayload(position, tool) {
  const palette = {
    residential: '#60a5fa',
    commercial: '#f97316',
    industrial: '#9ca3af'
  };
  const baseFootprint = { width: 40, depth: 32 };

  switch (tool) {
    case 'residential':
      return {
        position: { x: position.x, y: 0, z: position.z },
        footprint: baseFootprint,
        height: 60,
        floors: 16,
        color: palette.residential,
        category: BuildingCategory.APARTMENT,
        populationCapacity: 120,
        jobCapacity: 10,
        style: 'user-res'
      };
    case 'commercial':
      return {
        position: { x: position.x, y: 0, z: position.z },
        footprint: baseFootprint,
        height: 50,
        floors: 12,
        color: palette.commercial,
        category: BuildingCategory.COMMERCIAL,
        populationCapacity: 20,
        jobCapacity: 140,
        style: 'user-com'
      };
    case 'industrial':
      return {
        position: { x: position.x, y: 0, z: position.z },
        footprint: { width: 60, depth: 60 },
        height: 35,
        floors: 6,
        color: palette.industrial,
        category: BuildingCategory.FACTORY,
        populationCapacity: 0,
        jobCapacity: 220,
        style: 'user-ind'
      };
    default:
      return null;
  }
}

function handleSandboxPlacement(event) {
  if (mode !== "sandbox") {
    return;
  }
  const position = worldFromEvent(event);
  if (!position) {
    return;
  }
  const rounded = {
    x: Math.round(position.x / 20) * 20,
    z: Math.round(position.z / 20) * 20
  };

  let action = null;
  if (sandboxTool === "road") {
    const length = 120;
    const from = { x: rounded.x - length / 2, z: rounded.z };
    const to = { x: rounded.x + length / 2, z: rounded.z };
    action = new CityAction({
      id: `road-${Date.now()}`,
      type: "road",
      payload: {
        from,
        to,
        width: 20,
        lanes: 2,
        type: RoadType.LOCAL
      },
      author: collaboration.id
    });
  } else if (sandboxTool === "park") {
    action = new CityAction({
      id: `park-${Date.now()}`,
      type: "park",
      payload: {
        position: rounded,
        radius: 45,
        hasWaterFeature: Math.random() > 0.6
      },
      author: collaboration.id
    });
  } else if (sandboxTool === "clear") {
    action = new CityAction({
      id: `clear-${Date.now()}`,
      type: "clear",
      payload: { position: rounded, radius: 60 },
      author: collaboration.id
    });
  } else {
    const payload = createBuildPayload(rounded, sandboxTool);
    if (payload) {
      action = new CityAction({
        id: `build-${Date.now()}`,
        type: "build",
        payload,
        author: collaboration.id
      });
    }
  }

  if (action) {
    applyAction(action, { broadcast: true });
    ui.pushNotification(`Applied ${action.type} action`, { duration: 2500 });
  }
}

ui.on("density-change", (value) => {
  densityFactor = Number(value);
  regenerateWithCurrentSeed();
});

ui.on("road-change", (value) => {
  roadFactor = Number(value);
  regenerateWithCurrentSeed();
});

ui.on("speed-change", (value) => {
  if (simulation) {
    simulation.time.speed = Number(value);
  }
});

ui.on("seed-change", (seed) => {
  if (!seed) {
    return;
  }
  generateCity(seed);
});

ui.on("regenerate", () => regenerateWithCurrentSeed());
ui.on("randomize", () => randomizeSeed());
ui.on("mode-change", (newMode) => {
  mode = newMode;
  ui.pushNotification(`Switched to ${newMode} mode`, { duration: 2000 });
});
ui.on("tool-change", (tool) => {
  sandboxTool = tool;
});
ui.on("toggle-weather", (flag) => {
  weatherEnabled = flag;
});
ui.on("toggle-daynight", (flag) => {
  dayNightEnabled = flag;
});

canvas.addEventListener("dblclick", (event) => {
  if (mode !== "sandbox") {
    return;
  }
  handleSandboxPlacement(event);
});

collaboration.onAction((action) => {
  if (!action) {
    return;
  }
  applyAction(action, { broadcast: false });
  ui.pushNotification(`Remote ${action.type} applied`, { duration: 2500 });
});

function handleSimulationEvents(events = []) {
  events.forEach((event) => {
    if (event.type === "city-stage") {
      ui.pushNotification(`City advanced to ${event.stage.id.toUpperCase()}`, { duration: 4000 });
    }
    if (event.type === "disaster") {
      ui.pushNotification(`Disaster: ${event.disaster.type}`, { variant: "danger", duration: 5000 });
    }
    if (event.type === "disaster-resolved") {
      ui.pushNotification(`Disaster resolved`, { duration: 3000 });
    }
  });
}

function maybeRequestForecast(state, now) {
  if (now < nextForecastTime) {
    return;
  }
  nextForecastTime = now + 15000;
  workerBridge.requestForecast({
    population: state.population?.total,
    capacity: state.population?.capacity,
    satisfaction: state.population?.satisfaction,
    gdp: state.economy?.gdp,
    trend: state.economy?.trend,
    growthRate: simulation?.population?.growthRate
  }).then((forecast) => {
    if (!forecast?.final) {
      return;
    }
    ui.pushNotification(`Forecast: population ${Math.round(forecast.final.population).toLocaleString()} in ${forecast.horizonHours}h`, { duration: 4500 });
  }).catch(() => {});
}

sceneManager.start((delta) => {
  if (!simulation) {
    return lastState;
  }
  simulation.update(delta);
  const state = simulation.getState();
  if (!weatherEnabled) {
    state.weather = { current: "clear", intensity: 0 };
  }
  if (!dayNightEnabled) {
    state.time = { ...state.time, hour: 12 };
  }
  ui.updateStats(state);
  handleSimulationEvents(state.events);
  maybeRequestForecast(state, performance.now());
  lastState = state;
  return state;
});

generateCity(currentSeed);





