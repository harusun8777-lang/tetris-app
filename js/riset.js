function riset() {
  document.querySelectorAll('input[name="mode"]').forEach((input) => {
    input.disabled = false;
  });

  const startButton = document.getElementById('startBtn');
  if (startButton) {
    startButton.disabled = false;
  }

  players.forEach((player) => {
    player.board = createBoard();
    player.current = randomPiece();
    player.score = 0;
    player.lines = 0;
    player.level = 0;
    player.dropCounter = 0;
    player.moveCooldown = 0;
    player.downCooldown = 0;
    player.dropInterval = 500;
    player.isGameOver = false;
    player.pressed = { left: false, right: false, down: false };
    updateScore(player.scoreId, player.score);
    renderPlayer(player);
  });

  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
}
