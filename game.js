const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;    
}
window.addEventListener("resize", resize);
resize();

let center = { x: canvas.width / 2, y: canvas.height / 2 };
let angle = 0, bullets = [], enemies = [], score = 0, gameOver = false;
let startTime = Date.now();

// Load images
const playerImg = new Image();
playerImg.src = "player.png";

const enemyImg = new Image();
enemyImg.src = "enemy.png";

const enemy2Img = new Image();
enemy2Img.src = "enemy2.png";

// Controls
window.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    center.x = canvas.width / 2;
    center.y = canvas.height / 2;
    angle = Math.atan2(e.clientY - rect.top - center.y, e.clientX - rect.left - center.x);
});

window.addEventListener("click", () => {
    if (!gameOver) {
        bullets.push({ 
            x: canvas.width / 2, 
            y: canvas.height / 2, 
            dx: Math.cos(angle) * 7, 
            dy: Math.sin(angle) * 7, 
            r: 6 // Slightly larger bullets
        });
    }
});

// Reset Logic
const screen = document.getElementById("gameOverScreen");
const text = document.getElementById("gameOverText");
document.getElementById("restartBtn").onclick = () => {
    bullets = [];
    enemies = [];
    score = 0;
    gameOver = false;
    startTime = Date.now();
    document.getElementById("scoreValue").textContent = "0";
    document.getElementById("timeValue").textContent = "00:00";
    screen.style.display = "none";
    requestAnimationFrame(update);
};

function spawnEnemy() {
    if (gameOver) return;
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = -100; y = Math.random() * canvas.height; }
    else if (edge === 1) { x = canvas.width + 100; y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = -100; }
    else { x = Math.random() * canvas.width; y = canvas.height + 100; }

    const type = Math.random() < 0.2 ? "enemy2" : "enemy1";
    // INCREASED SIZE: from 60 to 100
    enemies.push({ x, y, size: 100, type }); 
}
setInterval(spawnEnemy, 1000);

function endGame() {
    gameOver = true;
    text.textContent = "Game Over! Score: " + score;
    screen.style.display = "flex";
}

function update() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    center.x = canvas.width / 2;
    center.y = canvas.height / 2;

    // HUD Update
    document.getElementById("scoreValue").textContent = score;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const secs = String(elapsed % 60).padStart(2, "0");
    document.getElementById("timeValue").textContent = `${mins}:${secs}`;

    // --- DRAW PLAYER (Size increased from 50 to 90) ---
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);
    ctx.drawImage(playerImg, -90, -90, 180, 180); 
    ctx.restore();

    // Bullets
    bullets.forEach((b, i) => {
        b.x += b.dx;
        b.y += b.dy;
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        if (b.x < -50 || b.x > canvas.width + 50 || b.y < -50 || b.y > canvas.height + 50) {
            bullets.splice(i, 1);
        }
    });

    // Enemies
    enemies.forEach((e, ei) => {
        const dx = center.x - e.x;
        const dy = center.y - e.y;
        const dist = Math.hypot(dx, dy);

        e.x += (dx / dist) * 1.5;
        e.y += (dy / dist) * 1.5;

        const img = e.type === "enemy2" ? enemy2Img : enemyImg;
        // Draw the larger enemies
        ctx.drawImage(img, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);

        // Bullet collision (Adjusted for larger size)
        bullets.forEach((b, bi) => {
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.size / 2) {
                bullets.splice(bi, 1);
                enemies.splice(ei, 1);
                if (e.type === "enemy2") score = Math.max(0, score - 2);
                else score++;
            }
        });

        // Player collision (Distance threshold increased for larger player)
        if (dist < 65) { 
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