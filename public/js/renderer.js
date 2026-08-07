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

  // current piece（落下中のブロック）
  current.shape.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) {
        let px = current.x + x;
        let py = current.y + y;

        // 枠内だけ
        if (px >= 0 && px < COLS && py >= 0 && py < ROWS) {
          ctx.fillStyle = '#f0f';
          ctx.fillRect(px * BLOCK, py * BLOCK, BLOCK, BLOCK);
        }
      }
    });
  });
}