const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const ROWS = 30;
const COLS = 15;
const BLOCK = 20;
let score=0;
let lines=0;
let level=0;

// 盤面（20×10）
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// テトリミノの形
const TETROMINOS = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  L: [[1, 0], [1, 0], [1, 1]],
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
// 全部埋まった行だけ消す
  board = board.filter(row => {
    if (row.every(v => v === 1)) {
      cleared++;
      return false; // この行を消す
    }
    return true; // この行は残す
  });

  // 足りない行を上に追加
  while (board.length < ROWS) {
    board.unshift(Array(COLS).fill(0));
  } 
  if(cleard>0){
    score(cleared);
    updateScore();
  }
}  

let isGameOver = false;
// 新しいブロックを出す
function spawn() {
  const keys = Object.keys(TETROMINOS);
  const key = keys[Math.floor(Math.random() * keys.length)];
  current = {
    shape: TETROMINOS[key],
    x: 3,
    y: 0
  };
  if (collision()) {
    isGameOver = true;
  }
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
    tryRotate();
  }
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') leftPressed = false;
  if (e.key === 'ArrowRight') rightPressed = false;
  if (e.key === 'ArrowDown') downPressed = false;
});

let isRunning = false;
let isPaused = false;
document.getElementById("startBtn").addEventListener("click", () => {
  startGame();
});
// ゲームスタート
function startGame() {
  isRunning = true;
  isGameOver = false;
  isPaused = false;

  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  spawn();

  lastTime = 0;
  dropCounter = 0;

  requestAnimationFrame(gameLoop);
}


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

let lastTime = 0;
let dropCounter = 0;
let dropInterval = 200;
let moveCooldown = 0;
let moveInterval = 100;
let downCooldown = 0;
let downInterval = 75;

function gameLoop(time = 0) {
  if (isPaused || isGameOver) {
    renderGameOver();   // ← ゲームオーバー画面を描く
    requestAnimationFrame(gameLoop);
    isRunning = false;
    return;
  }
  const delta = time - lastTime;
  lastTime = time;
  moveCooldown -= delta;
  dropCounter += delta;

  if (dropCounter > dropInterval) {
    current.y++;
    if (collision()) {
      current.y--;
      fixPiece();
      clearLines();
      spawn();
    }
    dropCounter = 0;
  }

  // 左右移動
  if (leftPressed && moveCooldown <= 0) {
    current.x--;
    if (collision()) current.x++;
    moveCooldown = moveInterval;
  }

  if (rightPressed && moveCooldown <= 0) {
    current.x++;
    if (collision()) current.x--;
    moveCooldown = moveInterval;
  }

  // 下押し（ソフトドロップ）
  downCooldown -= delta;

  if (downPressed && downCooldown <= 0) {
    current.y++;
    if (collision()) {
      current.y--;
      fixPiece();
      clearLines();
      spawn();
    }
    downCooldown = downInterval; // ← 次に落ちるまでの時間
  }
  render(ctx, board, current, BLOCK);
  requestAnimationFrame(gameLoop);
}

function tryRotate() {
  const rotated = rotate(current.shape);

  // まず回転してみる
  const oldShape = current.shape;
  current.shape = rotated;

  // 衝突したら壁蹴りを試す
  if (collision()) {
    // 右にずらす
    current.x++;
    if (collision()) {
      // 左にずらす
      current.x -= 2;
      if (collision()) {
        // どっちもダメなら回転を戻す
        current.x++;
        current.shape = oldShape;
      }
    }
  }
}
//シャドウ
function renderGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = "40px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

  ctx.font = "20px sans-serif";
  ctx.fillText("スタートで再開", canvas.width / 2, canvas.height / 2 + 40);
}

function getGhostPosition() {
  // current のコピーを作る（本体を絶対に触らない）
  let ghost = {
    shape: current.shape,
    x: current.x,
    y: current.y
  };

  // 下に落ちるだけ落とす
  while (true) {
    ghost.y++;
    if (collisionGhost(ghost)) {
      ghost.y--;
      break;
    }
  }

  return ghost.y;
}

function collisionGhost(piece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        let nx = piece.x + x;
        let ny = piece.y + y;

        if (ny >= ROWS || nx < 0 || nx >= COLS || board[ny][nx]) {
          return true;
        }
      }
    }
  }
  return false;
}
function score(boder){
  lines+=boder;
  level=Math.floor(lines/10);
  const base = [0, 100, 300, 500, 800];
  score += base[boder]*(level+1);
}

function updateScore() {
  document.getElementById("score").textContent = "Score: " + score;
}





