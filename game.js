const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const center = { x: canvas.width / 2, y: canvas.height / 2 };
let angle = 0, bullets = [], enemies = [], score = 0, gameOver = false;

// Timer
let startTime = Date.now();

// Load images
const playerImg = new Image();
playerImg.src = "player.png"; // your player image

const enemyImg = new Image();
enemyImg.src = "enemy.png"; // normal enemy

const enemy2Img = new Image();
enemy2Img.src = "enemy2.png"; // negative enemy

// Mouse control
canvas.addEventListener("mousemove", e => {
  angle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
});
canvas.addEventListener("click", () => {
  if (!gameOver) bullets.push({ x: center.x, y: center.y, dx: Math.cos(angle) * 7, dy: Math.sin(angle) * 7, r: 5 });
});

// Game Over screen
const screen = document.getElementById("gameOverScreen");
const text = document.getElementById("gameOverText");
document.getElementById("restartBtn").onclick = () => {
  bullets = [];
  enemies = [];
  score = 0;
  gameOver = false;
  startTime = Date.now();
  screen.style.display = "none";
  requestAnimationFrame(update);
};

// Spawn enemies (20% chance for enemy2)
function spawnEnemy() {
  if (gameOver) return;
  const edge = Math.floor(Math.random() * 4);
  let x = edge === 0 ? 0 : edge === 1 ? canvas.width : Math.random() * canvas.width;
  let y = edge === 2 ? 0 : edge === 3 ? canvas.height : Math.random() * canvas.height;
  const type = Math.random() < 0.2 ? "enemy2" : "enemy1";
  enemies.push({ x, y, size: 60, type });
}
setInterval(spawnEnemy, 1000);

// End game
function endGame() {
  gameOver = true;
  text.textContent = "Game Over! Score: " + score;
  screen.style.display = "flex";
}

// Update HUD
function updateHUD() {
  document.getElementById("scoreValue").textContent = score;

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  document.getElementById("timeValue").textContent = `${minutes}:${seconds}`;

  if (!gameOver) requestAnimationFrame(updateHUD);
}
updateHUD();

// Main game loop
function update() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(angle);
  ctx.drawImage(playerImg, -25, -25, 50, 50);
  ctx.restore();

  // Update bullets
  bullets.forEach((b, i) => {
    b.x += b.dx;
    b.y += b.dy;

    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();

    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(i, 1);
  });

  // Update enemies
  enemies.forEach((e, ei) => {
    const dx = center.x - e.x;
    const dy = center.y - e.y;
    const dist = Math.hypot(dx, dy);

    e.x += (dx / dist) * 1.5;
    e.y += (dy / dist) * 1.5;

    const img = e.type === "enemy2" ? enemy2Img : enemyImg;
    ctx.drawImage(img, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);

    // Bullet collision
    bullets.forEach((b, bi) => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.size / 2) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        if (e.type === "enemy2") score = Math.max(0, score - 2);
        else score++;
      }
    });

    // Player collision
    if (dist < 40) {
      if (e.type === "enemy2") {
        score++;
        enemies.splice(ei, 1);
      } else {
        endGame();
      }
    }
  });

  requestAnimationFrame(update);
}
update();
