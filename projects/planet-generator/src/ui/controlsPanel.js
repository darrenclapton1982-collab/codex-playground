import { animationConfig } from '../config.js';

export function createControlPanel({ onSpeedChange, onToggleRotation, onResetCamera }) {
    const panel = document.createElement('div');
    panel.className = 'ui-panel';

    const title = document.createElement('h2');
    title.textContent = 'Planet Controls';
    panel.appendChild(title);

    const rotationGroup = document.createElement('div');
    rotationGroup.className = 'ui-row';

    const speedLabel = document.createElement('label');
    speedLabel.textContent = 'Rotation speed';
    speedLabel.setAttribute('for', 'rotation-speed');

    const speedValue = document.createElement('span');
    speedValue.className = 'ui-value';
    speedValue.textContent = animationConfig.defaultRotationSpeed.toFixed(2);

    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.id = 'rotation-speed';
    speedSlider.min = String(animationConfig.minRotationSpeed);
    speedSlider.max = String(animationConfig.maxRotationSpeed);
    speedSlider.step = '0.01';
    speedSlider.value = String(animationConfig.defaultRotationSpeed);

    speedSlider.addEventListener('input', () => {
        const value = Number(speedSlider.value);
        speedValue.textContent = value.toFixed(2);
        if (onSpeedChange) onSpeedChange(value);
    });

    rotationGroup.appendChild(speedLabel);
    rotationGroup.appendChild(speedSlider);
    rotationGroup.appendChild(speedValue);
    panel.appendChild(rotationGroup);

    const buttonsRow = document.createElement('div');
    buttonsRow.className = 'ui-row';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.textContent = 'Pause rotation';
    toggleButton.dataset.paused = 'false';
    toggleButton.addEventListener('click', () => {
        const isPaused = toggleButton.dataset.paused === 'true';
        const nextPaused = !isPaused;
        toggleButton.dataset.paused = nextPaused ? 'true' : 'false';
        toggleButton.textContent = nextPaused ? 'Resume rotation' : 'Pause rotation';
        if (onToggleRotation) onToggleRotation(nextPaused);
    });

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.textContent = 'Reset camera';
    resetButton.addEventListener('click', () => {
        if (onResetCamera) onResetCamera();
    });

    buttonsRow.appendChild(toggleButton);
    buttonsRow.appendChild(resetButton);
    panel.appendChild(buttonsRow);

    return {
        element: panel,
        updateSpeedValue(value) {
            speedSlider.value = String(value);
            speedValue.textContent = Number(value).toFixed(2);
        }
    };
}
