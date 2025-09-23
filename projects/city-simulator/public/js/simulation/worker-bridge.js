export class SimulationWorkerBridge {
  constructor() {
    this.worker = null;
    this.callbacks = new Map();
    this.ready = this._createWorker();
  }

  async _createWorker() {
    if (this.worker) {
      return;
    }
    this.worker = new Worker("/js/workers/simulation-worker.js", { type: "module" });
    this.worker.addEventListener("message", (event) => this._handleMessage(event));
    this.worker.postMessage({ type: "init" });
    await new Promise((resolve) => {
      const onReady = (event) => {
        if (event.data?.type === "ready") {
          this.worker.removeEventListener("message", onReadyWrapper);
          resolve();
        }
      };
      const onReadyWrapper = (event) => onReady(event);
      this.worker.addEventListener("message", onReadyWrapper);
    });
  }

  async requestForecast(metrics) {
    await this.ready;
    return this._send("forecast", metrics);
  }

  async requestTrafficAnalysis(state) {
    await this.ready;
    return this._send("traffic-analysis", state);
  }

  _send(type, payload) {
    return new Promise((resolve, reject) => {
      const id = `${type}-${Math.random().toString(36).slice(2)}`;
      const timeout = setTimeout(() => {
        this.callbacks.delete(id);
        reject(new Error(`${type} request timed out`));
      }, 5000);

      this.callbacks.set(id, { resolve, reject, timeout });
      this.worker.postMessage({ type, id, payload });
    });
  }

  _handleMessage(event) {
    const { type, id } = event.data || {};
    if (!id || !this.callbacks.has(id)) {
      return;
    }
    const callback = this.callbacks.get(id);
    clearTimeout(callback.timeout);
    this.callbacks.delete(id);

    if (type === "forecast") {
      callback.resolve(event.data.forecast);
    } else if (type === "traffic-analysis") {
      callback.resolve(event.data.report);
    } else {
      callback.reject(new Error(`Unknown worker response type ${type}`));
    }
  }

  dispose() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.callbacks.clear();
  }
}
