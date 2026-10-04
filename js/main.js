/* CYBER DASH 3D - Main Entry Point & Game Loop Driver */

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');

  // 1. Initialize 3D Engine & Scene
  gameEngine.initScene(container);

  // 2. Initialize UI Manager
  UI.init();

  // 3. Handle Window Resize
  window.addEventListener('resize', () => {
    if (gameEngine.camera && gameEngine.renderer) {
      gameEngine.camera.aspect = window.innerWidth / window.innerHeight;
      gameEngine.camera.updateProjectionMatrix();
      gameEngine.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  });

  // 4. Main Tick Animation Loop
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    const delta = Math.min((now - lastTime) / 1000, 0.1); // Cap delta to prevent huge jumps on tab switch
    lastTime = now;

    // Update Game Physics & Logic
    gameEngine.update(delta);

    // Update HUD Stats Overlay
    UI.updateHUD();

    // Render Scene
    gameEngine.render();
  }

  requestAnimationFrame(animate);
});
