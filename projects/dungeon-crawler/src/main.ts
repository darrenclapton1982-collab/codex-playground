import './style.css';
import { Game } from './core/game';
import { Hud } from './ui/hud';

(async () => {
  const container = document.getElementById('app');
  if (!container) {
    throw new Error('Missing #app container element.');
  }

  const hud = new Hud();
  const game = new Game(container, hud);

  try {
    await game.init();
  } catch (error) {
    console.error('Failed to initialise game', error);
  }
})();
