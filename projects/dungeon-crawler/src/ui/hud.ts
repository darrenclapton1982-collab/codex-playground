export type OverlayMode = 'start' | 'gameover' | 'victory' | 'level';

export class Hud {
  private readonly hudElement = document.getElementById('hud') as HTMLDivElement;
  private readonly overlay = document.getElementById('overlay') as HTMLDivElement;
  private readonly overlayTitle = document.getElementById('overlay-title') as HTMLHeadingElement;
  private readonly overlayMessage = document.getElementById('overlay-message') as HTMLParagraphElement;
  private readonly actionButton = document.getElementById('action-button') as HTMLButtonElement;
  private readonly healthFill = document.getElementById('health-fill') as HTMLDivElement;
  private readonly healthValue = document.getElementById('health-value') as HTMLSpanElement;
  private readonly scoreValue = document.getElementById('score-value') as HTMLSpanElement;
  private readonly levelValue = document.getElementById('level-value') as HTMLSpanElement;
  readonly minimapCanvas = document.getElementById('minimap') as HTMLCanvasElement;
  private actionHandler: (() => void) | null = null;

  constructor() {
    this.actionButton.addEventListener('click', () => {
      this.actionHandler?.();
    });
  }

  onAction(handler: () => void): void {
    this.actionHandler = handler;
  }

  showHud(): void {
    this.hudElement.classList.remove('hidden');
  }

  hideHud(): void {
    this.hudElement.classList.add('hidden');
  }

  showOverlay(title: string, message: string, buttonLabel = 'Continue'): void {
    this.overlayTitle.textContent = title;
    this.overlayMessage.textContent = message;
    this.actionButton.textContent = buttonLabel;
    this.overlay.classList.remove('hidden');
  }

  hideOverlay(): void {
    this.overlay.classList.add('hidden');
  }

  setHealth(current: number, max: number): void {
    const clamped = Math.max(0, Math.min(max, current));
    const percentage = max === 0 ? 0 : (clamped / max) * 100;
    const widthValue = Math.round(percentage);
    this.healthFill.style.width = widthValue + '%';
    this.healthValue.textContent = Math.round(clamped) + '/' + max;
  }

  setScore(score: number): void {
    this.scoreValue.textContent = String(score);
  }

  setLevel(level: number): void {
    this.levelValue.textContent = String(level);
  }
}
