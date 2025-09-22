export function init() {
    console.log("{{PROJECT_NAME}} ready.");
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
