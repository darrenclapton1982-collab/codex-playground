class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(handler);
  }

  emit(type, detail) {
    if (!this.listeners.has(type)) {
      return;
    }
    this.listeners.get(type).forEach((handler) => handler(detail));
  }
}

export class UIController {
  constructor(root = document) {
    this.root = root;
    this.events = new EventBus();
    this.mode = "procedural";
    this.activeTool = "road";

    this.elements = {
      modeButtons: Array.from(root.querySelectorAll(".mode-switch button")),
      densitySlider: root.getElementById("density-slider"),
      roadSlider: root.getElementById("road-slider"),
      speedSlider: root.getElementById("speed-slider"),
      seedInput: root.getElementById("seed-input"),
      regenerateBtn: root.getElementById("regenerate-btn"),
      randomizeBtn: root.getElementById("randomize-btn"),
      sandboxPanel: root.querySelector(".panel--sandbox"),
      toolButtons: Array.from(root.querySelectorAll(".tool-btn")),
      weatherToggle: root.getElementById("weather-toggle"),
      dayNightToggle: root.getElementById("daynight-toggle"),
      stats: {
        population: root.querySelector('[data-stat="population"]'),
        capacity: root.querySelector('[data-stat="capacity"]'),
        gdp: root.querySelector('[data-stat="gdp"]'),
        tax: root.querySelector('[data-stat="tax"]'),
        traffic: root.querySelector('[data-stat="traffic"]'),
        weather: root.querySelector('[data-stat="weather"]')
      },
      notifications: root.getElementById("notification-feed")
    };

    this._bindEvents();
  }

  on(event, handler) {
    this.events.on(event, handler);
  }

  emit(event, detail) {
    this.events.emit(event, detail);
  }

  _bindEvents() {
    this.elements.modeButtons.forEach((button) => {
      button.addEventListener("click", () => this._setMode(button.dataset.mode));
    });

    this.elements.densitySlider?.addEventListener("input", (event) => {
      this.emit("density-change", Number(event.target.value));
    });

    this.elements.roadSlider?.addEventListener("input", (event) => {
      this.emit("road-change", Number(event.target.value));
    });

    this.elements.speedSlider?.addEventListener("input", (event) => {
      this.emit("speed-change", Number(event.target.value));
    });

    this.elements.seedInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.emit("seed-change", event.target.value.trim());
      }
    });

    this.elements.seedInput?.addEventListener("blur", (event) => {
      this.emit("seed-change", event.target.value.trim());
    });

    this.elements.regenerateBtn?.addEventListener("click", () => this.emit("regenerate"));
    this.elements.randomizeBtn?.addEventListener("click", () => this.emit("randomize"));

    this.elements.toolButtons.forEach((button) => {
      button.addEventListener("click", () => this._setTool(button.dataset.tool));
    });

    this.elements.weatherToggle?.addEventListener("change", (event) => {
      this.emit("toggle-weather", Boolean(event.target.checked));
    });

    this.elements.dayNightToggle?.addEventListener("change", (event) => {
      this.emit("toggle-daynight", Boolean(event.target.checked));
    });
  }

  _setMode(mode) {
    if (mode === this.mode) {
      return;
    }
    this.mode = mode;
    this.elements.modeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === mode);
    });
    this.elements.sandboxPanel?.classList.toggle("active", mode === "sandbox");
    this.emit("mode-change", mode);
  }

  _setTool(tool) {
    if (tool === this.activeTool) {
      return;
    }
    this.activeTool = tool;
    this.elements.toolButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.tool === tool);
    });
    this.emit("tool-change", tool);
  }

  updateStats(data) {
    if (!data) {
      return;
    }
    const format = (value) => {
      if (value === undefined || value === null) {
        return "-";
      }
      if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
      }
      if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
      }
      return Math.round(value).toLocaleString();
    };

    this.elements.stats.population.textContent = format(data.population?.total);
    this.elements.stats.capacity.textContent = format(data.population?.capacity);
    this.elements.stats.gdp.textContent = `$${format(data.economy?.gdp)}`;
    this.elements.stats.tax.textContent = `$${(data.economy?.taxRevenue ?? 0).toFixed(1)}M`;
    this.elements.stats.traffic.textContent = `${Math.round((data.traffic?.congestion ?? 0) * 100)}%`;
    this.elements.stats.weather.textContent = data.weather?.current ?? "clear";
  }

  pushNotification(message, options = {}) {
    if (!this.elements.notifications) {
      return;
    }
    const node = document.createElement("div");
    node.className = "notification";
    if (options.variant === "danger") {
      node.classList.add("notification-danger");
    }
    node.textContent = message;
    this.elements.notifications.appendChild(node);
    setTimeout(() => {
      node.classList.add("fade-out");
      node.addEventListener("transitionend", () => node.remove(), { once: true });
      if (!node.style.transition) {
        node.remove();
      }
    }, options.duration ?? 4000);
  }
}
