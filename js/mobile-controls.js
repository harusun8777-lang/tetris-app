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

    const bindHoldButton = (button, direction) => {
      const release = () => {
        player.pressed[direction] = false;
      };

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        player.pressed[direction] = true;
        button.setPointerCapture(event.pointerId);
      });
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    };

    bindHoldButton(leftBtn, 'left');
    bindHoldButton(rightBtn, 'right');
    bindHoldButton(downBtn, 'down');

    rotateBtn.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      tryRotate(player);
    });

    const releaseAll = () => {
      player.pressed.left = false;
      player.pressed.right = false;
      player.pressed.down = false;
    };

    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) releaseAll();
    });
  }
};

// Initialize mobile controls after a short delay to ensure players are ready
setTimeout(() => mobileControls.init(), 100);
