// Mobile control button handlers
const mobileControls = {
  init() {
    if (typeof players === 'undefined' || !players.length) {
      console.warn('Players not yet initialized');
      return;
    }

    const player = players[0];
    
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const downBtn = document.getElementById('downBtn');
    const rotateBtn = document.getElementById('rotateBtn');

    if (!leftBtn || !rightBtn || !downBtn || !rotateBtn) {
      console.warn('Mobile control buttons not found');
      return;
    }

    // Left button
    leftBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      player.pressed.left = true;
    });
    leftBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      player.pressed.left = false;
    });
    leftBtn.addEventListener('mousedown', () => {
      player.pressed.left = true;
    });
    leftBtn.addEventListener('mouseup', () => {
      player.pressed.left = false;
    });

    // Right button
    rightBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      player.pressed.right = true;
    });
    rightBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      player.pressed.right = false;
    });
    rightBtn.addEventListener('mousedown', () => {
      player.pressed.right = true;
    });
    rightBtn.addEventListener('mouseup', () => {
      player.pressed.right = false;
    });

    // Down button
    downBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      player.pressed.down = true;
    });
    downBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      player.pressed.down = false;
    });
    downBtn.addEventListener('mousedown', () => {
      player.pressed.down = true;
    });
    downBtn.addEventListener('mouseup', () => {
      player.pressed.down = false;
    });

    // Rotate button
    rotateBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      tryRotate(player);
    });
    rotateBtn.addEventListener('click', () => {
      tryRotate(player);
    });
  }
};

// Initialize mobile controls after a short delay to ensure players are ready
setTimeout(() => mobileControls.init(), 100);
