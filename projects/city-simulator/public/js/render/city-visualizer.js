import {
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
  BoxGeometry,
  PlaneGeometry,
  CylinderGeometry,
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Object3D,
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial
} from "/node_modules/three/build/three.module.js";

const tempMatrix = new Matrix4();
const tempObject = new Object3D();

export class CityVisualizer {
  constructor(scene) {
    this.scene = scene;
    this.root = new Group();
    this.root.name = "city-root";
    this.scene.add(this.root);

    this.layers = {
      ground: new Group(),
      roads: new Group(),
      buildings: new Group(),
      parks: new Group(),
      water: new Group(),
      transit: new Group()
    };

    Object.values(this.layers).forEach((group) => this.root.add(group));

    this.materialCache = new Map();
    this.buildingInstances = null;
  }

  dispose() {
    Object.values(this.layers).forEach((group) => {
      this._disposeGroup(group);
      this.root.remove(group);
    });
    this.scene.remove(this.root);
  }

  _disposeGroup(group) {
    group.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
    group.clear();
  }

  loadCity(city) {
    this._clearLayers();
    this._renderGround(city);
    this._renderRoads(city);
    this._renderParks(city);
    this._renderWater(city);
    this._renderTransit(city);
    this._renderBuildings(city);
  }

  _clearLayers() {
    Object.values(this.layers).forEach((group) => {
      this._disposeGroup(group);
      this.root.add(group);
    });
    this.buildingInstances = null;
  }

  _renderGround(city) {
    const geometry = new PlaneGeometry(city.width, city.height, 10, 10);
    const material = new MeshLambertMaterial({
      color: new Color("#1b263b"),
      side: DoubleSide
    });
    const ground = new Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.layers.ground.add(ground);
  }

  _renderRoads(city) {
    const geometry = new PlaneGeometry(1, 1);
    city.roads.forEach((road) => {
      const mesh = new Mesh(geometry, this._roadMaterial(road.type));
      const dx = road.to.x - road.from.x;
      const dz = road.to.z - road.from.z;
      const length = Math.hypot(dx, dz) || 1;
      mesh.scale.set(road.width, length, 1);
      const angle = Math.atan2(dx, dz);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = angle;
      mesh.position.set(
        (road.from.x + road.to.x) / 2,
        0.1,
        (road.from.z + road.to.z) / 2
      );
      mesh.receiveShadow = true;
      this.layers.roads.add(mesh);
    });
  }

  _roadMaterial(type) {
    if (this.materialCache.has(type)) {
      return this.materialCache.get(type);
    }
    const colors = {
      highway: "#2b2d42",
      arterial: "#3c3f58",
      collector: "#4b4f6d",
      local: "#585c7a",
      transit: "#3a506b"
    };
    const material = new MeshStandardMaterial({
      color: new Color(colors[type] ?? "#3b3f58"),
      metalness: 0.1,
      roughness: 0.8
    });
    this.materialCache.set(type, material);
    return material;
  }

  _renderBuildings(city) {
    if (city.buildings.length === 0) {
      return;
    }
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshPhysicalMaterial({
      color: new Color("#cbd5f5"),
      roughness: 0.6,
      metalness: 0.2,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4
    });
    this.buildingInstances = new InstancedMesh(geometry, material, city.buildings.length);
    this.buildingInstances.instanceMatrix.setUsage(35044);
    this.buildingInstances.castShadow = true;
    this.buildingInstances.receiveShadow = true;

    city.buildings.forEach((building, index) => {
      tempObject.position.set(building.position.x, building.height / 2, building.position.z);
      tempObject.scale.set(building.footprint.width, building.height, building.footprint.depth);
      tempObject.rotation.y = (building.style.length * 13) % (Math.PI * 2);
      tempObject.updateMatrix();
      this.buildingInstances.setMatrixAt(index, tempObject.matrix);
      if (this.buildingInstances.setColorAt) {
        const color = new Color(building.color ?? "#8faadc");
        this.buildingInstances.setColorAt(index, color);
      }
    });

    this.layers.buildings.add(this.buildingInstances);
  }

  _renderParks(city) {
    city.parks.forEach((park) => {
      const geometry = new CylinderGeometry(park.radius, park.radius, 2, 24);
      const material = new MeshStandardMaterial({
        color: park.hasWaterFeature ? new Color("#80ed99") : new Color("#52b788"),
        roughness: 0.9
      });
      const mesh = new Mesh(geometry, material);
      mesh.position.set(park.position.x, 1, park.position.z);
      mesh.rotation.x = Math.PI / 2;
      mesh.receiveShadow = true;
      this.layers.parks.add(mesh);
    });
  }

  _renderWater(city) {
    city.waterBodies.forEach((body) => {
      const points = body.path;
      const geometry = new BufferGeometry();
      const vertices = new Float32BufferAttribute(points.length * 3, 3);
      points.forEach((point, index) => {
        vertices.setXYZ(index, point.x, 0.05, point.z);
      });
      geometry.setAttribute("position", vertices);
      const material = new LineBasicMaterial({ color: "#4ea8de", linewidth: 3 });
      const line = new Line(geometry, material);
      this.layers.water.add(line);

      const planeGeometry = new PlaneGeometry(body.width, 10, 1, 1);
      points.forEach((point) => {
        const plane = new Mesh(
          planeGeometry,
          new MeshStandardMaterial({
            color: new Color("#1b6fa8"),
            transparent: true,
            opacity: 0.6,
            roughness: 0.2,
            metalness: 0.1,
            side: DoubleSide
          })
        );
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(point.x, 0.02, point.z);
        this.layers.water.add(plane);
      });
    });
  }

  _renderTransit(city) {
    city.transitLines.forEach((lineData) => {
      const geometry = new BufferGeometry();
      const vertices = new Float32BufferAttribute(lineData.path.length * 3, 3);
      lineData.path.forEach((point, index) => {
        vertices.setXYZ(index, point.x, 2, point.z);
      });
      geometry.setAttribute("position", vertices);
      const material = new LineBasicMaterial({ color: lineData.type === "metro" ? "#f72585" : "#ffba08" });
      const line = new Line(geometry, material);
      this.layers.transit.add(line);
    });
  }

  updateLighting(timeOfDay) {
    if (!this.buildingInstances || !this.buildingInstances.material) {
      return;
    }
    const isNight = timeOfDay.hour >= 20 || timeOfDay.hour < 6;
    const emissiveIntensity = isNight ? 0.6 : 0.05;
    const baseColor = isNight ? new Color("#ffd166") : new Color("#cbd5f5");
    const material = this.buildingInstances.material;
    material.color.copy(baseColor);
    material.emissive = new Color(isNight ? "#ffd6a5" : "#000000");
    material.emissiveIntensity = emissiveIntensity;
  }

  highlightAction(action) {
    if (!action) {
      return;
    }
    const notification = new Mesh(
      new BoxGeometry(40, 4, 40),
      new MeshStandardMaterial({ color: new Color("#ff006e"), transparent: true, opacity: 0.4 })
    );
    notification.position.set(action.payload?.position?.x ?? 0, 2, action.payload?.position?.z ?? 0);
    this.layers.ground.add(notification);
    setTimeout(() => {
      this.layers.ground.remove(notification);
      notification.geometry.dispose();
      notification.material.dispose();
    }, 2000);
  }

  updateWeather(weather) {
    const fogDensity = weather?.current === "fog" ? 0.0025 + 0.002 * weather.intensity : 0.0007;
    this.scene.fog.density = fogDensity;
  }
}
