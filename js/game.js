const ROWS = 20;
const COLS = 10;
const BLOCK = 25;
const SCORE_TABLE = [0, 100, 300, 500, 800];

const TETROMINOS = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  L: [[1, 0], [1, 0], [1, 1]],
  J: [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
};
// 
function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomPiece() {
  const keys = Object.keys(TETROMINOS);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return {
    type: key,
    shape: TETROMINOS[key].map((row) => row.slice()),
    x: 3,
    y: 0,
  };
}

function createPlayer({ canvasId, scoreId, controls }) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  return {
    canvas,
    ctx,
    scoreId,
    controls,
    board: createBoard(),
    current: randomPiece(),
    score: 0,
    lines: 0,
    level: 0,
    dropInterval: 500,
    dropCounter: 0,
    moveCooldown: 0,
    moveInterval: 120,
    downCooldown: 0,
    downInterval: 50,
    pressed: { left: false, right: false, down: false },
    isGameOver: false,
  };
}

let gameMode = 1;

function getActivePlayers() {
  return players.slice(0, gameMode);
}

function setGameMode(mode) {
  gameMode = mode;
  const player2Panel = document.getElementById('player2Panel');
  if (player2Panel) {
    player2Panel.style.display = mode === 2 ? '' : 'none';
  }
}

function collisionAt(player, piece, offsetX = piece.x, offsetY = piece.y, shape = piece.shape) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;

      const nextX = offsetX + x;
      const nextY = offsetY + y;

      if (
        nextY >= ROWS ||
        nextX < 0 ||
        nextX >= COLS ||
        (nextY >= 0 && nextY < ROWS && player.board[nextY][nextX])
      ) {
        return true;
      }
    }
  }
  return false;
}

function rotateShape(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      rotated[x][rows - y - 1] = shape[y][x];
    }
  }

  return rotated;
}

function unlockStartControls() {
  document.querySelectorAll('input[name="mode"]').forEach((input) => {
    input.disabled = false;
  });

  const startButton = document.getElementById('startBtn');
  if (startButton) {
    startButton.disabled = false;
  }
}

function spawnPiece(player) {
  player.current = randomPiece();
  if (collisionAt(player, player.current)) {
    player.isGameOver = true;
    saveScore(player.score);
    showTopScores();
    showRankingScreen();
    unlockStartControls();
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
  }
}

function mergePiece(player) {
  player.current.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;

      const px = player.current.x + x;
      const py = player.current.y + y;

      if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
        player.board[py][px] = 1;
      }
    });
  });
}

function addGarbage(target, count) {
  for (let i = 0; i < count; i++) {
    const row = Array(COLS).fill(1);
    const hole = Math.floor(Math.random() * COLS);
    row[hole] = 0;

    target.board.push(row);
    if (target.board.length > ROWS) {
      target.board.shift();
    }
  }
}

function clearLines(player) {
  let cleared = 0;

  player.board = player.board.filter((row) => {
    if (row.every((value) => value === 1)) {
      cleared++;
      return false;
    }
    return true;
  });

  while (player.board.length < ROWS) {
    player.board.unshift(Array(COLS).fill(0));
  }

  if (cleared > 0) {
    player.lines += cleared;
    player.level = Math.floor(player.lines / 5);
    player.score += SCORE_TABLE[cleared] * (player.level + 1);
    updateScore(player.scoreId, player.score);

    if (gameMode === 2) {
      const opponent = player === players[0] ? players[1] : players[0];
      addGarbage(opponent, cleared);
    }
    if (gameMode === 1) {
      player.dropInterval = Math.max(100, 500 - player.level * 40);
    }
  }
}

function tryRotate(player) {
  const rotated = rotateShape(player.current.shape);
  const oldShape = player.current.shape;
  player.current.shape = rotated;

  if (collisionAt(player, player.current)) {
    player.current.x += 1;
    if (collisionAt(player, player.current)) {
      player.current.x -= 2;
      if (collisionAt(player, player.current)) {
        player.current.x += 1;
        player.current.shape = oldShape;
      }
    }
  }
}

function getGhostY(player) {
  const ghost = {
    x: player.current.x,
    y: player.current.y,
    shape: player.current.shape,
  };

  while (true) {
    ghost.y += 1;
    if (collisionAt(player, ghost, ghost.x, ghost.y, ghost.shape)) {
      ghost.y -= 1;
      break;
    }
  }

  return ghost.y;
}

function renderPlayer(player) {
  const { ctx } = player;
  ctx.clearRect(0, 0, player.canvas.width, player.canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (player.board[y][x]) {
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
      }
    }
  }

  const ghostY = getGhostY(player);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  player.current.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        ctx.fillRect((player.current.x + x) * BLOCK, (ghostY + y) * BLOCK, BLOCK, BLOCK);
      }
    });
  });

  player.current.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;

      const px = player.current.x + x;
      const py = player.current.y + y;

      if (px >= 0 && px < COLS && py >= 0 && py < ROWS) {
        ctx.fillStyle = '#ff4fd8';
        ctx.fillRect(px * BLOCK, py * BLOCK, BLOCK, BLOCK);
      }
    });
  });

  if (player.isGameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, player.canvas.width, player.canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', player.canvas.width / 2, player.canvas.height / 2);
    return;
  }
}

function updateScore(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = 'Score: ' + value;
  }
}

function updatePlayer(player, delta) {
  if (player.isGameOver) {
    return;
  }
  player.moveCooldown -= delta;
  player.downCooldown -= delta;
  player.dropCounter += delta;

  if (player.pressed.left && player.moveCooldown <= 0) {
    player.current.x -= 1;
    if (collisionAt(player, player.current)) player.current.x += 1;
    player.moveCooldown = player.moveInterval;
  }

  if (player.pressed.right && player.moveCooldown <= 0) {
    player.current.x += 1;
    if (collisionAt(player, player.current)) player.current.x -= 1;
    player.moveCooldown = player.moveInterval;
  }

  if (player.pressed.down && player.downCooldown <= 0) {
    player.current.y += 1;
    if (collisionAt(player, player.current)) {
      player.current.y -= 1;
      mergePiece(player);
      clearLines(player);
      spawnPiece(player);
    }
    player.downCooldown = player.downInterval;
  }

  if (player.dropCounter >= player.dropInterval) {
    player.current.y += 1;
    if (collisionAt(player, player.current)) {
      player.current.y -= 1;
      mergePiece(player);
      clearLines(player);
      spawnPiece(player);
    }
    player.dropCounter = 0;
  }
}

function bindControls(player) {
  document.addEventListener('keydown', (event) => {
    const key = event.key;
    const lowerKey = key.toLowerCase();

    if (key === player.controls.left || lowerKey === player.controls.left) player.pressed.left = true;
    if (key === player.controls.right || lowerKey === player.controls.right) player.pressed.right = true;
    if (key === player.controls.down || lowerKey === player.controls.down) player.pressed.down = true;
    if (key === player.controls.rotate || lowerKey === player.controls.rotate) tryRotate(player);
  });

  document.addEventListener('keyup', (event) => {
    const key = event.key;
    const lowerKey = key.toLowerCase();

    if (key === player.controls.left || lowerKey === player.controls.left) player.pressed.left = false;
    if (key === player.controls.right || lowerKey === player.controls.right) player.pressed.right = false;
    if (key === player.controls.down || lowerKey === player.controls.down) player.pressed.down = false;
  });
}

document.getElementById("leftBtn").addEventListener("touchstart", () => {
  players[0].pressed.left = true;
});
document.getElementById("leftBtn").addEventListener("touchend", () => {
  players[0].pressed.left = false;
});

document.getElementById("rightBtn").addEventListener("touchstart", () => {
  players[0].pressed.right = true;
});
document.getElementById("rightBtn").addEventListener("touchend", () => {
  players[0].pressed.right = false;
});

document.getElementById("rotateBtn").addEventListener("touchstart", () => {
  rotatePiece(players[0]);
});

document.getElementById("downBtn").addEventListener("touchstart", () => {
  players[0].pressed.down = true;
});
document.getElementById("downBtn").addEventListener("touchend", () => {
  players[0].pressed.down = false;
});


const players = [
  createPlayer({
    canvasId: 'game1',
    scoreId: 'score1',
    controls: { left: 'ArrowLeft', right: 'ArrowRight', down: 'ArrowDown', rotate: 'ArrowUp' },
  }),
  createPlayer({
    canvasId: 'game2',
    scoreId: 'score2',
    controls: { left: 'a', right: 'd', down: 's', rotate: 'w' },
  }),
];

const state = {
  lastTime: 0,
  rafId: null,
};

function initGameMode() {
  const modeInputs = document.querySelectorAll('input[name="mode"]');
  
  // On mobile, disable 2-player mode
  const isMobile = window.innerWidth <= 768;
  const twoPlayerInput = modeInputs[1];
  if (isMobile && twoPlayerInput) {
    twoPlayerInput.disabled = true;
  }
  
  modeInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.disabled) return;
      
      const selectedMode = parseInt(input.value, 10);
      if (isMobile && selectedMode === 2) {
        // Force single player on mobile
        modeInputs[0].checked = true;
        setGameMode(1);
      } else {
        setGameMode(selectedMode);
      }
    });
  });

  const selectedMode = document.querySelector('input[name="mode"]:checked');
  setGameMode(selectedMode ? parseInt(selectedMode.value, 10) : 1);
}

function gameLoop(time = 0) {
  const delta = state.lastTime ? time - state.lastTime : 16;
  state.lastTime = time;

  const activePlayers = getActivePlayers();
  activePlayers.forEach((player) => updatePlayer(player, delta));
  activePlayers.forEach(renderPlayer);

  state.rafId = requestAnimationFrame(gameLoop);
}

players.forEach(bindControls);
players.forEach((player) => {
  updateScore(player.scoreId, player.score);
  renderPlayer(player);
});

// Initialize game mode selector
initGameMode();

function showTopScores() {
  const scores = JSON.parse(localStorage.getItem("tetrisScores") || "[]");
  const list = document.getElementById("topScores");

  list.innerHTML = scores
    .map((s, i) => `<div>${i + 1}位: ${s}</div>`)
    .join("");
}
function saveScore(score) {
  // 今までのスコアを読み込む（なければ空配列）
  const scores = JSON.parse(localStorage.getItem("tetrisScores") || "[]");

  // 新しいスコアを追加
  scores.push(score);

  // 高い順に並べて上位5件だけ残す
  scores.sort((a, b) => b - a);
  const top5 = scores.slice(0, 5);

  // 保存
  localStorage.setItem("tetrisScores", JSON.stringify(top5));
}

function setMobileControlsVisibility(isVisible) {
  const mobileControls = document.getElementById("mobileControls");
  if (!mobileControls) return;

  const isMobile = window.innerWidth <= 768;
  mobileControls.style.display = isMobile && isVisible ? "grid" : "none";
}

function showHomeScreen() {
  const homeScreen = document.getElementById("homeScreen");
  const match = document.querySelector(".match");
  const rankingScreen = document.getElementById("rankingScreen");
  const matchMode = document.querySelector(".match-mode");
  const startBtn = document.getElementById("startBtn");
  const showRankingBtn = document.getElementById("showRankingBtn");

  if (homeScreen) homeScreen.style.display = "block";
  if (match) match.style.display = "none";
  if (rankingScreen) rankingScreen.style.display = "none";
  if (matchMode) matchMode.style.display = "flex";
  if (startBtn) startBtn.style.display = "inline-block";
  if (showRankingBtn) showRankingBtn.style.display = "inline-block";
  setMobileControlsVisibility(false);
}

function showRankingScreen() {
  const homeScreen = document.getElementById("homeScreen");
  const match = document.querySelector(".match");
  const rankingScreen = document.getElementById("rankingScreen");
  const matchMode = document.querySelector(".match-mode");
  const startBtn = document.getElementById("startBtn");
  const showRankingBtn = document.getElementById("showRankingBtn");

  if (homeScreen) homeScreen.style.display = "none";
  if (match) match.style.display = "none";
  if (matchMode) matchMode.style.display = "none";
  if (startBtn) startBtn.style.display = "none";
  if (showRankingBtn) showRankingBtn.style.display = "none";
  setMobileControlsVisibility(false);
  if (rankingScreen) rankingScreen.style.display = "block";
  showTopScores();
}

const showRankingBtn = document.getElementById("showRankingBtn");
if (showRankingBtn) {
  showRankingBtn.addEventListener("click", showRankingScreen);
}

const backToGameBtn = document.getElementById("backToGame");
if (backToGameBtn) {
  backToGameBtn.textContent = "戻る";
  backToGameBtn.addEventListener("click", showHomeScreen);
}