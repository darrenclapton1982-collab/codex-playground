const LEFT_KEYS = new Set(["ArrowLeft", "a", "A"]);
const RIGHT_KEYS = new Set(["ArrowRight", "d", "D"]);
const FIRE_KEYS = new Set([" ", "Space"]);
const PAUSE_KEYS = new Set(["p", "P", "Escape"]);

export function createKeyboardControls(keys, { firePlayerShot, togglePause }) {
    const handleKeyDown = (event) => {
        if (event.repeat) {
            return;
        }
        if (LEFT_KEYS.has(event.key)) {
            keys.add("left");
            event.preventDefault();
            return;
        }
        if (RIGHT_KEYS.has(event.key)) {
            keys.add("right");
            event.preventDefault();
            return;
        }
        if (FIRE_KEYS.has(event.key)) {
            event.preventDefault();
            firePlayerShot();
            return;
        }
        if (PAUSE_KEYS.has(event.key)) {
            event.preventDefault();
            togglePause();
        }
    };

    const handleKeyUp = (event) => {
        if (LEFT_KEYS.has(event.key)) {
            keys.delete("left");
        }
        if (RIGHT_KEYS.has(event.key)) {
            keys.delete("right");
        }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
    };
}
