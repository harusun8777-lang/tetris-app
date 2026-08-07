const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const ROWS = 30;
const COLS = 15;
const BLOCK = 20;

// 盤面（20×10）
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// テトリミノの形
const TETROMINOS = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  L: [[1,0],[1,0],[1,1]],
};

// 現在のブロック
let current = {
  shape: TETROMINOS.T,
  x: 3,
  y: 0
};

// 衝突判定
function collision() {
  for (let y = 0; y < current.shape.length; y++) {
    for (let x = 0; x < current.shape[y].length; x++) {
      if (current.shape[y][x]) {
        let nx = current.x + x;
        let ny = current.y + y;

        if (ny >= ROWS || nx < 0 || nx >= COLS || board[ny][nx]) {
          return true;
        }
      }
    }

  }
  return false;
}

// ブロックを盤面に固定
function fixPiece() {
  current.shape.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) {
        board[current.y + y][current.x + x] = 1;
      }
    });
  });
}

// ライン消去
function clearLines() {
  board = board.filter(row => row.some(v => v === 0));
  while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
}

// 新しいブロックを出す
function spawn() {
  const keys = Object.keys(TETROMINOS);
  const key = keys[Math.floor(Math.random() * keys.length)];
  current = {
    shape: TETROMINOS[key],
    x: 3,
    y: 0
  };
}



// キー操作
let leftPressed = false;
let rightPressed = false;
let downPressed = false;

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') leftPressed = true;
  if (e.key === 'ArrowRight') rightPressed = true;
  if (e.key === 'ArrowDown') downPressed = true;

  if (e.key === 'Shift' || e.key === 'ArrowUp') {
    current.shape = rotate(current.shape);
  }
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') leftPressed = false;
  if (e.key === 'ArrowRight') rightPressed = false;
  if (e.key === 'ArrowDown') downPressed = false;
});

// ゲームループ
setInterval(() => {
  update();
  render(ctx, board, current, BLOCK);
}, 500);

// 落下処理
function rotate(shape) {
  const N = shape.length;
  const M = shape[0].length;
  let rotated = Array.from({ length: M }, () => Array(N).fill(0));

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < M; x++) {
      rotated[x][N - y - 1] = shape[y][x];
    }
  }
  return rotated;
}

function gameLoop() {
  // 横移動（整数）
  if (leftPressed) {
    current.x -= 1;
    if (collision()) current.x += 1;
  }
  if (rightPressed) {
    current.x += 1;
    if (collision()) current.x -= 1;
  }

  // 下移動（整数）
  if (downPressed) {
    current.y += 1;
    if (collision()) current.y -= 1;
  }

  render(ctx, board, current, BLOCK);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

