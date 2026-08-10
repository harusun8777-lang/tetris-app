function render(ctx, board, current, BLOCK) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // board（固定されたブロック）
  board.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) {
        ctx.fillStyle = '#0ff';
        ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
      }
    });
  });

  // ゴーストを描く
  renderGhost(ctx, current, BLOCK);

  // current piece（落下中のブロック）
  current.shape.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) {
        let px = current.x + x;
        let py = current.y + y;

        if (px >= 0 && px < COLS && py >= 0 && py < ROWS) {
          ctx.fillStyle = '#f0f';
          ctx.fillRect(px * BLOCK, py * BLOCK, BLOCK, BLOCK);
        }
      }
    });
  });
}

function renderGhost(ctx, current, BLOCK) {
  const ghostY = getGhostPosition();

  ctx.fillStyle = "rgba(255,255,255,0.3)";

  current.shape.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) {
        ctx.fillRect(
          (current.x + x) * BLOCK,
          (ghostY + y) * BLOCK,
          BLOCK,
          BLOCK
        );
      }
    });
  });
}
