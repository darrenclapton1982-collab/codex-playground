export class CollaborationChannel {
  constructor(name = "city-collaboration") {
    this.channel = null;
    this.handlers = new Set();
    this.id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

    if (typeof BroadcastChannel === "function") {
      this.channel = new BroadcastChannel(name);
      this.channel.addEventListener("message", (event) => this._handleMessage(event));
    }
  }

  _handleMessage(event) {
    const message = event.data;
    if (!message || message.source === this.id) {
      return;
    }
    this.handlers.forEach((handler) => handler(message.payload));
  }

  onAction(handler) {
    this.handlers.add(handler);
  }

  offAction(handler) {
    this.handlers.delete(handler);
  }

  broadcast(payload) {
    if (!this.channel) {
      return;
    }
    this.channel.postMessage({ source: this.id, payload });
  }

  dispose() {
    this.handlers.clear();
    this.channel?.close();
  }
}
