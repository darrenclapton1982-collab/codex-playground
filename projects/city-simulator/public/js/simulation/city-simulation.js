import { DistrictType, WeatherType, RoadType, BuildingCategory } from "../city/city-data.js";
import { SpatialHash } from "../city/spatial-index.js";
import { createRng } from "../utils/prng.js";

const CITY_STAGES = [
  { id: "village", population: 500, description: "Humble beginnings with dirt roads." },
  { id: "town", population: 5000, description: "Organised neighborhoods emerge." },
  { id: "city", population: 25000, description: "Downtown skyline takes shape." },
  { id: "metropolis", population: 75000, description: "Transit-heavy urban core." },
  { id: "megalopolis", population: 200000, description: "Futuristic super city." }
];

const CITIZEN_STATES = {
  HOME: "home",
  COMMUTING: "commuting",
  WORKING: "working",
  LEISURE: "leisure",
  EVACUATING: "evacuating"
};

const DISASTERS = [
  { id: "fire", probability: 0.0002, impact: "localized", responseTime: 3 },
  { id: "flood", probability: 0.00015, impact: "river", responseTime: 6 },
  { id: "traffic_jam", probability: 0.0005, impact: "roads", responseTime: 1.5 },
  { id: "economic_recession", probability: 0.0001, impact: "economy", responseTime: 12 }
];

const WEATHER_TRANSITIONS = {
  [WeatherType.CLEAR]: [
    { to: WeatherType.RAIN, weight: 0.4 },
    { to: WeatherType.FOG, weight: 0.2 },
    { to: WeatherType.SNOW, weight: 0.1 },
    { to: WeatherType.CLEAR, weight: 0.3 }
  ],
  [WeatherType.RAIN]: [
    { to: WeatherType.CLEAR, weight: 0.4 },
    { to: WeatherType.FOG, weight: 0.2 },
    { to: WeatherType.SNOW, weight: 0.15 },
    { to: WeatherType.RAIN, weight: 0.25 }
  ],
  [WeatherType.FOG]: [
    { to: WeatherType.CLEAR, weight: 0.5 },
    { to: WeatherType.RAIN, weight: 0.3 },
    { to: WeatherType.FOG, weight: 0.2 }
  ],
  [WeatherType.SNOW]: [
    { to: WeatherType.CLEAR, weight: 0.35 },
    { to: WeatherType.FOG, weight: 0.25 },
    { to: WeatherType.SNOW, weight: 0.4 }
  ]
};

class Citizen {
  constructor({ id, home, workplace, leisureSpot, rng }) {
    this.id = id;
    this.home = home;
    this.workplace = workplace;
    this.leisureSpot = leisureSpot;
    this.state = CITIZEN_STATES.HOME;
    this.position = { ...home, y: 0 };
    this.destination = { ...home, y: 0 };
    this.energy = 1;
    this.satisfaction = 0.5 + rng() * 0.5;
    this.commuteTimer = 0;
    this.rng = rng;
  }

  update(deltaHours, hourOfDay, pathSampler) {
    if (this.state === CITIZEN_STATES.EVACUATING) {
      this._moveTowards(deltaHours, this.destination, pathSampler);
      return;
    }

    const schedule = this._determineSchedule(hourOfDay);
    if (schedule !== this.state) {
      this.state = schedule;
      this.destination = this._resolveDestination();
    }

    if (this.state === CITIZEN_STATES.COMMUTING || this.state === CITIZEN_STATES.LEISURE) {
      this._moveTowards(deltaHours, this.destination, pathSampler);
    }

    if (this.state === CITIZEN_STATES.WORKING) {
      this.energy = Math.min(1, this.energy + deltaHours * 0.02);
      this.satisfaction = Math.min(1, this.satisfaction + deltaHours * 0.01);
    } else if (this.state === CITIZEN_STATES.COMMUTING) {
      this.energy = Math.max(0, this.energy - deltaHours * 0.05);
    }
  }

  evacuate(target) {
    this.state = CITIZEN_STATES.EVACUATING;
    this.destination = { ...target, y: 0 };
  }

  _determineSchedule(hour) {
    if (hour >= 7 && hour < 9) {
      return CITIZEN_STATES.COMMUTING;
    }
    if (hour >= 9 && hour < 17) {
      return CITIZEN_STATES.WORKING;
    }
    if (hour >= 17 && hour < 19) {
      return CITIZEN_STATES.COMMUTING;
    }
    if (hour >= 19 && hour < 22) {
      return CITIZEN_STATES.LEISURE;
    }
    return CITIZEN_STATES.HOME;
  }

  _resolveDestination() {
    switch (this.state) {
      case CITIZEN_STATES.COMMUTING:
        return this.destination === this.home ? this.workplace : this.home;
      case CITIZEN_STATES.WORKING:
        return this.workplace;
      case CITIZEN_STATES.LEISURE:
        return this.leisureSpot ?? this.home;
      default:
        return this.home;
    }
  }

  _moveTowards(deltaHours, target, pathSampler) {
    const speed = 40 * deltaHours; // units per hour
    const direction = {
      x: target.x - this.position.x,
      z: target.z - this.position.z
    };
    const distance = Math.hypot(direction.x, direction.z);
    if (distance < speed || distance === 0) {
      this.position.x = target.x;
      this.position.z = target.z;
      return;
    }
    const normalised = { x: direction.x / distance, z: direction.z / distance };
    const avoidance = pathSampler(this.position, target);
    this.position.x += (normalised.x + avoidance.x) * speed;
    this.position.z += (normalised.z + avoidance.z) * speed;
  }
}

class Vehicle {
  constructor({ id, path, type, speedMultiplier, rng }) {
    this.id = id;
    this.path = path;
    this.type = type;
    this.progress = 0;
    this.speed = 30 + rng() * 15;
    this.speed *= speedMultiplier;
    this.position = path.length > 0 ? { ...path[0], y: 0 } : { x: 0, y: 0, z: 0 };
  }

  update(deltaHours) {
    if (this.path.length < 2) {
      return;
    }
    this.progress = Math.min(1, this.progress + deltaHours * (this.speed / 100));
    const segment = this.progress * (this.path.length - 1);
    const index = Math.floor(segment);
    const localT = segment - index;
    const start = this.path[index];
    const end = this.path[Math.min(index + 1, this.path.length - 1)];
    this.position = {
      x: start.x + (end.x - start.x) * localT,
      y: 0,
      z: start.z + (end.z - start.z) * localT
    };
  }
}

export class CitySimulation {
  constructor(city, options = {}) {
    this.city = city;
    this.time = {
      elapsedHours: 0,
      day: 0,
      hour: 8,
      speed: options.timeScale ?? 30
    };
    this.population = {
      total: Math.round(city.metadata.populationCapacity * 0.4),
      capacity: city.metadata.populationCapacity,
      growthRate: 0.015,
      homeless: 0,
      satisfaction: 0.6,
      migrationFlow: 0
    };
    this.economy = {
      gdp: 1200,
      taxRevenue: 15,
      unemployment: 0.08,
      propertyValueIndex: 1.0,
      trend: 0
    };
    this.traffic = {
      averageFlow: 0.5,
      congestion: 0.2,
      transitUsage: 0.3,
      incidentTimers: new Map()
    };
    this.weather = {
      current: WeatherType.CLEAR,
      target: WeatherType.CLEAR,
      intensity: 0,
      transitionTimer: 0
    };
    this.stage = CITY_STAGES[0];
    this.disasters = [];
    this.history = [];
    this.events = [];
    this.rng = createRng(options.seed ?? city.seed ?? Date.now());

    this.citizens = [];
    this.vehicles = [];
    this.citizenSpatial = new SpatialHash(80);
    this.vehicleSpatial = new SpatialHash(120);

    this._initCitizens(options.initialCitizens ?? 150);
  }

  _initCitizens(count) {
    const housing = this.city.buildings.filter((b) => [
      BuildingCategory.HOUSE,
      BuildingCategory.APARTMENT,
      BuildingCategory.CONDO,
      BuildingCategory.SKYSCRAPER
    ].includes(b.category));
    const workplaces = this.city.buildings.filter((b) => b.jobCapacity > 0);
    const leisureSpots = this.city.parks.concat(this.city.landmarks);

    for (let i = 0; i < count; i += 1) {
      const home = housing[Math.floor(this.rng() * housing.length)];
      const work = workplaces[Math.floor(this.rng() * workplaces.length)] ?? home;
      const leisure = leisureSpots[Math.floor(this.rng() * leisureSpots.length)] ?? home;
      const citizen = new Citizen({
        id: `citizen-${i}`,
        home: { x: home.position.x, z: home.position.z },
        workplace: { x: work.position.x, z: work.position.z },
        leisureSpot: { x: leisure.position?.x ?? leisure.x, z: leisure.position?.z ?? leisure.z },
        rng: this.rng
      });
      this.citizens.push(citizen);
      this.citizenSpatial.insert(citizen, this._boundsForPoint(citizen.position, 5));
    }
  }

  update(deltaSeconds) {
    const deltaHours = (deltaSeconds / 3600) * this.time.speed;
    this._advanceTime(deltaHours);
    this._updatePopulation(deltaHours);
    this._updateEconomy(deltaHours);
    this._updateWeather(deltaHours);
    this._simulateTraffic(deltaHours);
    this._updateCitizens(deltaHours);
    this._tickDisasters(deltaHours);
    this._recordHistory(deltaHours);
    this._maybeTriggerEvents(deltaHours);
  }

  _advanceTime(deltaHours) {
    this.time.elapsedHours += deltaHours;
    this.time.hour = (this.time.hour + deltaHours) % 24;
    if (this.time.elapsedHours >= 24) {
      this.time.elapsedHours -= 24;
      this.time.day += 1;
      this._dailyMaintenance();
    }
  }

  _dailyMaintenance() {
    this.population.homeless = Math.max(0, this.population.total - this.population.capacity);
    this.time.speed = Math.min(120, Math.max(10, this.time.speed * (1 + (this.rng() - 0.5) * 0.02)));
  }

  _updatePopulation(deltaHours) {
    const housingRatio = this.population.capacity > 0 ? this.population.total / this.population.capacity : 0;
    const jobRatio = this.city.metadata.jobCapacity > 0 ? (this.population.total * 0.6) / this.city.metadata.jobCapacity : 0;
    const amenityScore = this.city.metadata.greenSpace / (this.city.width * this.city.height) + 0.1;
    const satisfactionDelta = (1 - housingRatio) * 0.1 + (1 - jobRatio) * 0.05 + amenityScore * 0.1;
    this.population.satisfaction = Math.max(0.1, Math.min(1, this.population.satisfaction + satisfactionDelta * deltaHours));

    const growthCapacity = Math.max(0, this.population.capacity - this.population.total);
    const organicGrowth = this.population.total * this.population.growthRate * this.population.satisfaction * deltaHours;
    const migration = (this.population.satisfaction - 0.5) * 120 * deltaHours;
    const netGrowth = Math.min(growthCapacity, organicGrowth + migration);

    this.population.total = Math.max(200, this.population.total + netGrowth);
    this.population.migrationFlow = migration;

    this._updateStage();
  }

  _updateStage() {
    const currentIndex = CITY_STAGES.findIndex((stage) => stage.id === this.stage.id);
    const nextStage = CITY_STAGES[currentIndex + 1];
    if (nextStage && this.population.total >= nextStage.population) {
      this.stage = nextStage;
      this.events.push({
        type: "city-stage",
        stage: this.stage,
        day: this.time.day
      });
    }
  }

  _updateEconomy(deltaHours) {
    const productivity = Math.min(1, this.population.total / Math.max(1, this.city.metadata.jobCapacity));
    const demand = Math.min(1.5, this.population.total / Math.max(1, this.population.capacity));
    const trendDelta = (productivity - this.economy.unemployment) * 0.02;
    this.economy.trend = this.economy.trend * 0.95 + trendDelta;
    this.economy.propertyValueIndex = Math.max(0.5, this.economy.propertyValueIndex + this.economy.trend * deltaHours);
    this.economy.gdp = this.economy.gdp * (1 + 0.002 * deltaHours + this.economy.trend * 0.1);
    this.economy.taxRevenue = this.economy.gdp * 0.02;
    this.economy.unemployment = Math.max(0, Math.min(0.3, this.economy.unemployment + (demand - 1) * 0.01 * deltaHours));
  }

  _updateWeather(deltaHours) {
    this.weather.transitionTimer -= deltaHours;
    if (this.weather.transitionTimer <= 0) {
      this.weather.target = this._sampleWeatherTarget(this.weather.current);
      this.weather.transitionTimer = 12 + this.rng() * 12;
    }
    const intensityTarget = this.weather.target === this.weather.current ? 0 : 1;
    this.weather.intensity += (intensityTarget - this.weather.intensity) * 0.1 * deltaHours;
    if (this.weather.intensity > 0.8) {
      this.weather.current = this.weather.target;
      this.weather.intensity = 0.4;
    }
  }

  _sampleWeatherTarget(current) {
    const options = WEATHER_TRANSITIONS[current] ?? WEATHER_TRANSITIONS[WeatherType.CLEAR];
    const total = options.reduce((sum, item) => sum + item.weight, 0);
    const sample = this.rng() * total;
    let accumulator = 0;
    for (const option of options) {
      accumulator += option.weight;
      if (sample <= accumulator) {
        return option.to;
      }
    }
    return current;
  }

  _simulateTraffic(deltaHours) {
    const rushHourMultiplier = (this.time.hour >= 7 && this.time.hour <= 9) || (this.time.hour >= 16 && this.time.hour <= 18) ? 1.5 : 1;
    const baseFlow = (this.population.total / Math.max(1, this.city.metadata.roadLength)) * 0.05;
    const incidentsPenalty = this.disasters.some((d) => d.type === "traffic_jam") ? 0.5 : 1;

    this.traffic.averageFlow = Math.min(1.2, baseFlow * rushHourMultiplier * incidentsPenalty);
    this.traffic.congestion = Math.max(0, Math.min(1, this.traffic.averageFlow - 0.3));
    this.traffic.transitUsage = Math.max(0.1, Math.min(0.9, this.traffic.transitUsage + (this.traffic.congestion - 0.2) * 0.05 * deltaHours));

    this._updateVehicles(deltaHours);
  }

  _updateVehicles(deltaHours) {
    const desiredVehicles = Math.min(500, Math.round(this.population.total / 120));
    while (this.vehicles.length < desiredVehicles) {
      this._spawnVehicle();
    }
    this.vehicles = this.vehicles.filter((vehicle) => {
      const previousBounds = this._boundsForPoint(vehicle.position, 15);
      this.vehicleSpatial.remove(vehicle, previousBounds);
      vehicle.update(deltaHours);
      const stillActive = vehicle.progress < 1;
      if (stillActive) {
        this.vehicleSpatial.insert(vehicle, this._boundsForPoint(vehicle.position, 15));
      }
      return stillActive;
    });
  }
  _spawnVehicle() {
    const road = this.city.roads[Math.floor(this.rng() * this.city.roads.length)];
    if (!road) {
      return;
    }
    const path = [road.from, road.to];
    const vehicle = new Vehicle({
      id: `vehicle-${Date.now()}-${Math.floor(this.rng() * 1000)}`,
      path,
      type: road.type === RoadType.HIGHWAY ? "car" : this.rng() < 0.2 ? "bus" : "car",
      speedMultiplier: road.type === RoadType.HIGHWAY ? 1.5 : 1,
      rng: this.rng
    });
    this.vehicles.push(vehicle);
    this.vehicleSpatial.insert(vehicle, this._boundsForPoint(vehicle.position, 15));
  }

  _updateCitizens(deltaHours) {
    const hour = this.time.hour;
    const sampler = (from, to) => {
      const neighbors = this.vehicleSpatial.queryRange(this._boundsForPoint(from, 40));
      const avoidance = neighbors.reduce((acc, vehicle) => {
        const dx = from.x - vehicle.position.x;
        const dz = from.z - vehicle.position.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < 900 && distSq > 1) {
          acc.x += dx / distSq;
          acc.z += dz / distSq;
        }
        return acc;
      }, { x: 0, z: 0 });
      return avoidance;
    };

    this.citizens.forEach((citizen) => {
      this.citizenSpatial.remove(citizen, this._boundsForPoint(citizen.position, 5));
      citizen.update(deltaHours, hour, sampler);
      this.citizenSpatial.insert(citizen, this._boundsForPoint(citizen.position, 5));
    });
  }

  _tickDisasters(deltaHours) {
    this.disasters = this.disasters.filter((disaster) => {
      disaster.remaining -= deltaHours;
      if (disaster.remaining <= 0) {
        this.events.push({ type: "disaster-resolved", disaster });
        return false;
      }
      return true;
    });
  }

  _recordHistory(deltaHours) {
    if (this.time.day % 7 === 0 && this.history.length === 0) {
      this.history.push(this._snapshot());
      return;
    }
    if (this.history.length > 0) {
      const last = this.history[this.history.length - 1];
      if (this.time.day >= last.day + 7) {
        this.history.push(this._snapshot());
      }
    }
  }

  _maybeTriggerEvents(deltaHours) {
    DISASTERS.forEach((disaster) => {
      if (this.rng() < disaster.probability * deltaHours) {
        this._triggerDisaster(disaster);
      }
    });
  }

  _triggerDisaster(template) {
    const instance = {
      type: template.id,
      remaining: template.responseTime,
      startedAtDay: this.time.day
    };
    this.disasters.push(instance);
    this.events.push({ type: "disaster", disaster: instance });

    if (template.id === "fire") {
      const target = this.city.buildings[Math.floor(this.rng() * this.city.buildings.length)];
      if (target) {
        this.population.satisfaction = Math.max(0.1, this.population.satisfaction - 0.05);
        this.economy.propertyValueIndex *= 0.98;
      }
    } else if (template.id === "flood") {
      this.weather.current = WeatherType.RAIN;
      this.weather.intensity = 1;
    } else if (template.id === "traffic_jam") {
      this.traffic.congestion = Math.min(1, this.traffic.congestion + 0.3);
    } else if (template.id === "economic_recession") {
      this.economy.trend -= 0.05;
      this.economy.gdp *= 0.97;
    }

    const safeZone = this.city.parks[0] ?? { position: { x: 0, z: 0 } };
    this.citizens.forEach((citizen, index) => {
      if (index % 5 === 0) {
        citizen.evacuate({ x: safeZone.position.x, z: safeZone.position.z });
      }
    });
  }

  applyAction(action) {
    this.events.push({ type: "user-action", action });
    if (action.type === "build") {
      this.population.capacity += action.payload.populationCapacity ?? 0;
      this.city.metadata.populationCapacity = this.population.capacity;
    } else if (action.type === "zone-change") {
      this.population.satisfaction = Math.min(1, this.population.satisfaction + 0.02);
    } else if (action.type === "road") {
      const length = action.payload.length ?? Math.hypot(
        (action.payload.to?.x ?? 0) - (action.payload.from?.x ?? 0),
        (action.payload.to?.z ?? 0) - (action.payload.from?.z ?? 0)
      );
      this.city.metadata.roadLength += length;
      this.population.satisfaction = Math.min(1, this.population.satisfaction + 0.01);
    } else if (action.type === "park") {
      const radius = action.payload.radius ?? 40;
      this.city.metadata.greenSpace += Math.PI * radius * radius;
      this.population.satisfaction = Math.min(1, this.population.satisfaction + 0.03);
    } else if (action.type === "clear") {
      const removedCapacity = action.payload.populationCapacity ?? 80;
      this.population.capacity = Math.max(0, this.population.capacity - removedCapacity);
      this.city.metadata.populationCapacity = this.population.capacity;
    }
  }
  getState() {
    return {
      time: { ...this.time },
      population: { ...this.population },
      economy: { ...this.economy },
      traffic: { ...this.traffic },
      weather: { ...this.weather },
      stage: this.stage,
      disasters: this.disasters,
      history: this.history,
      citizens: this.citizens.slice(0, 200).map((citizen) => ({
        id: citizen.id,
        position: citizen.position,
        state: citizen.state
      })),
      vehicles: this.vehicles.slice(0, 300).map((vehicle) => ({
        id: vehicle.id,
        position: vehicle.position,
        type: vehicle.type
      })),
      events: this.events.splice(0, this.events.length)
    };
  }
}









