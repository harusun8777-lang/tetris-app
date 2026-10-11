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

function isMobileViewport() {
  return window.matchMedia('(max-width: 48rem)').matches;
}

function getActivePlayers() {
  return players.slice(0, gameMode);
}

function setGameMode(mode) {
  gameMode = isMobileViewport() ? 1 : mode;
  const player2Panel = document.getElementById('player2Panel');
  if (player2Panel) {
    player2Panel.style.display = gameMode === 2 ? '' : 'none';
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
    const isMultiplayer = gameMode === 2;
    if (isMultiplayer) {
      const opponent = player === players[0] ? players[1] : players[0];
      const gameOverMessage = document.getElementById("gameOverMessage");
      const gameOverDetails = document.getElementById("gameOverDetails");
      if (gameOverMessage) {
        gameOverMessage.textContent = opponent.isGameOver
          ? "DRAW"
          : `${opponent === players[0] ? "1P" : "2P"} WIN！`;
      }
      if (gameOverDetails) {
        gameOverDetails.textContent = opponent.isGameOver
          ? `1P: ${players[0].score}　|　2P: ${players[1].score}`
          : `${player === players[0] ? "1P" : "2P"} LOSE！\n1P: ${players[0].score}　|　2P: ${players[1].score}`;
      }
    } else {
      saveScore(player.score);
      const lastScoreEl = document.getElementById("lastGameScore");
      const lastGametext = document.getElementById("lastGametext");
      if (lastScoreEl && lastGametext) {
        lastGametext.textContent = "今回のスコア";
        lastScoreEl.textContent = "Score: " + player.score;
      }
    }

    showRankingScreen(true);
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
        ctx.fillStyle = '#ffad1f';
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
        ctx.fillStyle = '#ef4b3f';
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
  const releaseMovementKeys = () => {
    player.pressed.left = false;
    player.pressed.right = false;
    player.pressed.down = false;
  };

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

  window.addEventListener('blur', releaseMovementKeys);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseMovementKeys();
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

function initGameMode() {
  const modeInputs = document.querySelectorAll('input[name="mode"]');
  const twoPlayerInput = modeInputs[1];

  modeInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.disabled) return;

      const selectedMode = parseInt(input.value, 10);
      if (isMobileViewport() && selectedMode === 2) {
        modeInputs[0].checked = true;
        setGameMode(1);
      } else {
        setGameMode(selectedMode);
      }
    });
  });

  const updateModeAvailability = () => {
    const isMobile = isMobileViewport();
    if (twoPlayerInput) {
      twoPlayerInput.disabled = isMobile;
      if (isMobile && twoPlayerInput.checked) {
        modeInputs[0].checked = true;
      }
    }

    const selectedMode = document.querySelector('input[name="mode"]:checked');
    setGameMode(selectedMode ? parseInt(selectedMode.value, 10) : 1);
  };

  updateModeAvailability();
  window.addEventListener('resize', updateModeAvailability);
}

function gameLoop(time = 0) {
  const delta = state.lastTime ? time - state.lastTime : 16;
  state.lastTime = time;

  const activePlayers = getActivePlayers();
  activePlayers.forEach((player) => updatePlayer(player, delta));
  activePlayers.forEach(renderPlayer);

  if (state.rafId !== null) {
    state.rafId = requestAnimationFrame(gameLoop);
  }
}

players.forEach(bindControls);
players.forEach((player) => {
  updateScore(player.scoreId, player.score);
  renderPlayer(player);
});

// Initialize game mode selector
initGameMode();

let topScoresRequest;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchTopScores() {
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let response;
    try {
      response = await fetch("/api/scores", { cache: "no-store" });
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
      await wait(300 * (attempt + 1));
      continue;
    }

    if (!response.ok) {
      const error = new Error(`ランキング取得に失敗しました (${response.status})`);
      const isTemporary = response.status === 408 || response.status === 429 || response.status >= 500;
      if (!isTemporary || attempt === maxAttempts - 1) throw error;
      await wait(300 * (attempt + 1));
      continue;
    }

    const scores = await response.json();
    if (!Array.isArray(scores) || scores.some((entry) => !entry || !Number.isSafeInteger(entry.score))) {
      throw new Error("ランキングAPIから不正なデータが返されました");
    }
    return scores;
  }

  throw new Error("ランキングを読み込めませんでした");
}

function showTopScores() {
  const list = document.getElementById("topScores");
  if (!list) return Promise.resolve();

  list.textContent = "ランキングを読み込み中...";
  if (!topScoresRequest) {
    topScoresRequest = fetchTopScores()
      .then((scores) => {
        list.replaceChildren();
        if (scores.length === 0) {
          list.textContent = "まだ記録がありません";
          return;
        }

        scores.forEach(({ score }, index) => {
          const item = document.createElement("div");
          item.textContent = `${index + 1}位: ${score}`;
          list.appendChild(item);
        });
      })
      .catch((error) => {
        console.error(error);
        list.replaceChildren();

        const message = document.createElement("p");
        message.textContent = "ランキングを読み込めませんでした。通信状況を確認して、もう一度お試しください。";
        list.appendChild(message);

        const retryButton = document.createElement("button");
        retryButton.type = "button";
        retryButton.className = "score-retry-button";
        retryButton.textContent = "再読み込み";
        retryButton.addEventListener("click", showTopScores);
        list.appendChild(retryButton);
      })
      .finally(() => {
        topScoresRequest = undefined;
      });
  }

  return topScoresRequest;
}
async function saveScore(score) {
  localStorage.setItem("lastScore", score);

  try {
    const response = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    if (!response.ok) throw new Error(`スコアの保存に失敗しました (${response.status})`);
    return true;
  } catch (error) {
    console.error(error);
    const list = document.getElementById("topScores");
    if (list) list.textContent = "スコアを保存できませんでした。時間をおいて再度お試しください。";
    return false;
  }
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

  if (homeScreen) homeScreen.style.display = "flex";
  if (match) match.style.display = "none";
  if (rankingScreen) rankingScreen.style.display = "none";
  if (matchMode) matchMode.style.display = "flex";
  if (startBtn) startBtn.style.display = "inline-block";
  if (showRankingBtn) showRankingBtn.style.display = "inline-block";
  setMobileControlsVisibility(false);
}

function showRankingScreen(isGameOver = false) {
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
  const gameOverMessage = document.getElementById("gameOverMessage");
  const gameOverDetails = document.getElementById("gameOverDetails");
  const lastScoreDisplay = document.getElementById("lastScoreDisplay");
  const rankingTitle = document.getElementById("rankingTitle");
  const topScores = document.getElementById("topScores");
  const isMultiplayerResult = isGameOver && gameMode === 2;
  if (gameOverMessage) {
    gameOverMessage.hidden = !isGameOver;
    if (!isMultiplayerResult) gameOverMessage.textContent = "GAME OVER";
  }
  if (gameOverDetails) gameOverDetails.hidden = !isMultiplayerResult;
  if (lastScoreDisplay) lastScoreDisplay.hidden = isMultiplayerResult;
  if (rankingTitle) rankingTitle.hidden = isMultiplayerResult;
  if (topScores) topScores.hidden = isMultiplayerResult;
  
  // ゲームオーバー時は何もしない（spawnPiece()で既に設定済み）
  // ランキングボタンから遷移した場合は「前回のスコア」を表示
  if (!isGameOver) {
    const lastScoreEl = document.getElementById("lastGameScore");
    const lastGametext = document.getElementById("lastGametext");
    const lastScore = localStorage.getItem("lastScore") || "0";
    if (lastScoreEl) {
      lastGametext.textContent = "前回のスコア";
      lastScoreEl.textContent = "Score: " + lastScore;
    }
  }
  
  if (!isMultiplayerResult) showTopScores();
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