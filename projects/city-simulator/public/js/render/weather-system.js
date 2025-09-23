import {
  Group,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  Color
} from "/node_modules/three/build/three.module.js";

export class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.root = new Group();
    this.root.name = "weather-root";
    this.scene.add(this.root);

    this.emitters = {
      rain: this._createEmitter({ color: "#74c0fc", count: 1800 }),
      snow: this._createEmitter({ color: "#f8f9fa", count: 1400 })
    };
    this.activeWeather = null;
  }

  _createEmitter({ color, count }) {
    const geometry = new BufferGeometry();
    const positions = new Float32BufferAttribute(count * 3, 3);

    for (let i = 0; i < count; i += 1) {
      positions.setXYZ(i,
        (Math.random() - 0.5) * 2000,
        Math.random() * 800 + 100,
        (Math.random() - 0.5) * 2000
      );
    }

    geometry.setAttribute("position", positions);
    const material = new PointsMaterial({
      color: new Color(color),
      size: color === "#74c0fc" ? 6 : 14,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    const points = new Points(geometry, material);
    points.visible = false;
    this.root.add(points);
    return { points, positions, count };
  }

  setWeather(weather) {
    if ( !weather) { 
      Object.values(this.emitters).forEach((emitter) => {
        emitter.points.visible = false;
      });
      this.activeWeather = null;
      return;
    }

    if (this.activeWeather && this.activeWeather.current === weather.current) {
      this.activeWeather = { ...this.activeWeather, ...weather };
      return;
    }

    this.activeWeather = { ...weather };
    Object.values(this.emitters).forEach((emitter) => {
      emitter.points.visible = false;
    });

    if (weather.current === " rain\) {
 this.emitters.rain.points.visible = true;
 } else if (weather.current === \snow\) {
 this.emitters.snow.points.visible = true;
 }
 }
      this._updateSnow(deltaSeconds);
    }
  }

  _updateRain(deltaSeconds) {
    const { points, positions, count } = this.emitters.rain;
    for (let i = 0; i < count; i += 1) {
      let y = positions.getY(i);
      y -= 600 * deltaSeconds * (0.5 + Math.random());
      if (y < 0) {
        y = Math.random() * 800 + 100;
      }
      positions.setY(i, y);
    }
    positions.needsUpdate = true;
    points.material.opacity = 0.3 + this.activeWeather.intensity * 0.6;
  }

  _updateSnow(deltaSeconds) {
    const { points, positions, count } = this.emitters.snow;
    for (let i = 0; i < count; i += 1) {
      let y = positions.getY(i);
      let x = positions.getX(i);
      let z = positions.getZ(i);
      y -= 90 * deltaSeconds * (0.5 + Math.random() * 0.5);
      x += Math.sin(z * 0.01) * deltaSeconds * 40;
      z += Math.cos(x * 0.01) * deltaSeconds * 40;
      if (y < 0) {
        y = Math.random() * 600 + 120;
      }
      positions.setXYZ(i, x, y, z);
    }
    positions.needsUpdate = true;
    points.material.opacity = 0.4 + this.activeWeather.intensity * 0.4;
  }
}
