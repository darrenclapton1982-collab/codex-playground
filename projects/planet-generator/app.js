import { init } from './src/main.js';
export { init } from './src/main.js';

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
