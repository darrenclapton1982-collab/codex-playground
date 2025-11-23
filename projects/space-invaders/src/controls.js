const KEY_MAP = {
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
    ' ': "fire",
    Spacebar: "fire"
};

export class InputManager {
    constructor() {
        this.state = { left: false, right: false, fire: false };
        this.keyboardHandler = this.handleKey.bind(this);
        this.touchHandlers = [];
        window.addEventListener("keydown", this.keyboardHandler);
        window.addEventListener("keyup", this.keyboardHandler);
    }

    bindButtons(buttons) {
        buttons.forEach((button) => {
            const dir = button.dataset.dir;
            const action = button.dataset.action;
            const type = dir || action;
            if (!type) return;

            const down = (event) => {
                event.preventDefault();
                this.setState(type, true);
                button.classList.add("is-held");
            };
            const up = (event) => {
                event.preventDefault();
                this.setState(type, false);
                button.classList.remove("is-held");
            };

            button.addEventListener("pointerdown", down);
            button.addEventListener("pointerup", up);
            button.addEventListener("pointerleave", up);
            button.addEventListener("pointercancel", up);
            this.touchHandlers.push({ button, down, up });
        });
    }

    setState(type, active) {
        if (type === "left" || type === "right") {
            this.state[type] = active;
        }
        if (type === "fire") {
            this.state.fire = active;
        }
    }

    handleKey(event) {
        if (KEY_MAP[event.key] === undefined) return;
        const type = KEY_MAP[event.key];
        const isDown = event.type === "keydown";
        this.setState(type, isDown);
    }

    getState() {
        return { ...this.state };
    }

    destroy() {
        window.removeEventListener("keydown", this.keyboardHandler);
        window.removeEventListener("keyup", this.keyboardHandler);
        this.touchHandlers.forEach(({ button, down, up }) => {
            button.removeEventListener("pointerdown", down);
            button.removeEventListener("pointerup", up);
            button.removeEventListener("pointerleave", up);
            button.removeEventListener("pointercancel", up);
        });
        this.touchHandlers = [];
    }
}
