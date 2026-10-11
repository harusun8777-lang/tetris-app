// ホーム画面 → ゲーム画面へ
document.getElementById("startBtn").addEventListener("click", () => {
  if (isMobileViewport()) {
    setGameMode(1);
    document.querySelector('input[name="mode"][value="1"]').checked = true;
  }
  document.getElementById("homeScreen").style.display = "none";
  document.querySelector(".match").style.display = "flex";
  document.querySelector(".match-mode").style.display = "none";
  document.getElementById("mobileControls").style.display = isMobileViewport() ? "grid" : "none";
  document.getElementById("showRankingBtn").style.display = "none";
  document.getElementById("rankingScreen").style.display = "none";
});

// ページ読み込み時にホーム画面だけ表示
window.onload = () => {
  document.getElementById("homeScreen").style.display = "flex";
  document.querySelector(".match").style.display = "none";
  document.getElementById("mobileControls").style.display = "none";
  document.getElementById("rankingScreen").style.display = "none";
  const rankingBtn = document.getElementById("showRankingBtn");
  if (rankingBtn) rankingBtn.style.display = "inline-block";
  updateHomeModeVisibility();
};

function updateHomeModeVisibility() {
  const homeScreen = document.getElementById("homeScreen");
  if (homeScreen.style.display === "none") return;

  document.querySelector(".match-mode").style.display = isMobileViewport() ? "none" : "flex";
}

window.addEventListener("resize", updateHomeModeVisibility);

function showHomeScreen() {
  document.getElementById("rankingScreen").style.display = "none";
  document.getElementById("homeScreen").style.display = "block";
  document.querySelector(".match").style.display = "none";
  document.querySelector(".match-mode").style.display = isMobileViewport() ? "none" : "flex";
  setMobileControlsVisibility(false);
  document.getElementById("startBtn").style.display = "inline-block";
  document.getElementById("showRankingBtn").style.display = "inline-block";
}
