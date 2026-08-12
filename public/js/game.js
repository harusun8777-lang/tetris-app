const ROWS = 20;
const COLS = 10;
const BLOCK = 30;
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

function spawnPiece(player) {
  player.current = randomPiece();
  if (collisionAt(player, player.current)) {
    player.isGameOver = true;
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
    player.level = Math.floor(player.lines / 10);
    player.score += SCORE_TABLE[cleared] * (player.level + 1);
    updateScore(player.scoreId, player.score);

    const opponent = player === players[0] ? players[1] : players[0];
    addGarbage(opponent, cleared);
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
  }
}

function updateScore(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = 'Score: ' + value;
  }
}

function updatePlayer(player, delta) {
  if (player.isGameOver) return;

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

function startGame() {
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
  });

  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
  }

  state.lastTime = 0;
  state.rafId = requestAnimationFrame(gameLoop);
}

function gameLoop(time = 0) {
  const delta = state.lastTime ? time - state.lastTime : 16;
  state.lastTime = time;

  players.forEach((player) => updatePlayer(player, delta));
  players.forEach(renderPlayer);

  state.rafId = requestAnimationFrame(gameLoop);
}

document.getElementById('startBtn').addEventListener('click', startGame);
players.forEach(bindControls);
players.forEach((player) => {
  updateScore(player.scoreId, player.score);
  renderPlayer(player);
});
