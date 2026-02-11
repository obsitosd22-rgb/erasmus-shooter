const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Elements
const scoreElement = document.getElementById("scoreValue");
const timeElement = document.getElementById("timeValue");
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverText = document.getElementById("gameOverText");
const highScoreText = document.getElementById("highScoreText");
const restartBtn = document.getElementById("restartBtn");

// Game State
let center = { x: 0, y: 0 };
let angle = 0;
let bullets = [];
let enemies = [];
let score = 0;
let gameOver = false;
let startTime = Date.now();
let spawnInterval;
let highScore = localStorage.getItem("sheepSlayerHighScore") || 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    center.x = canvas.width / 2;
    center.y = canvas.height / 2;

    // Keep Pixel Art Sharp
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

window.addEventListener("resize", resize);
resize();

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
    angle = Math.atan2(e.clientY - rect.top - center.y, e.clientX - rect.left - center.x);
});

window.addEventListener("click", () => {
    if (!gameOver) {
        bullets.push({ 
            x: center.x, 
            y: center.y, 
            dx: Math.cos(angle) * 7, 
            dy: Math.sin(angle) * 7, 
            r: 6 
        });
    }
});

function spawnEnemy() {
    if (gameOver) return;
    
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    
    if (edge === 0) { x = -100; y = Math.random() * canvas.height; }
    else if (edge === 1) { x = canvas.width + 100; y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = -100; }
    else { x = Math.random() * canvas.width; y = canvas.height + 100; }

    const type = Math.random() < 0.2 ? "enemy2" : "enemy1";
    enemies.push({ x, y, size: 100, type }); 
}

function endGame() {
    gameOver = true;
    clearInterval(spawnInterval); // Stop spawning

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("sheepSlayerHighScore", highScore);
    }

    gameOverText.textContent = "Game Over! Score: " + score;
    highScoreText.textContent = "High Score: " + highScore;
    gameOverScreen.style.display = "flex";
}

restartBtn.onclick = () => {
    bullets = [];
    enemies = [];
    score = 0;
    gameOver = false;
    startTime = Date.now();
    
    scoreElement.textContent = "0";
    timeElement.textContent = "00:00";
    gameOverScreen.style.display = "none";
    
    // Restart Spawning
    clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnEnemy, 1000);
    
    requestAnimationFrame(update);
};

function update() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update Timer/HUD
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const secs = String(elapsed % 60).padStart(2, "0");
    timeElement.textContent = `${mins}:${secs}`;
    scoreElement.textContent = score;

    // Draw Player
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);
    ctx.drawImage(playerImg, -90, -90, 180, 180); 
    ctx.restore();

    // Bullets Logic
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.dx;
        b.y += b.dy;
        
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();

        if (b.x < -50 || b.x > canvas.width + 50 || b.y < -50 || b.y > canvas.height + 50) {
            bullets.splice(i, 1);
        }
    }

    // Enemies Logic
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        const dx = center.x - e.x;
        const dy = center.y - e.y;
        const dist = Math.hypot(dx, dy);

        e.x += (dx / dist) * 1.5;
        e.y += (dy / dist) * 1.5;

        const img = (e.type === "enemy2") ? enemy2Img : enemyImg;
        ctx.drawImage(img, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);

        // Player collision
        if (dist < 65) { 
            if (e.type === "enemy2") {
                score++;
                enemies.splice(i, 1);
                continue; // Move to next enemy
            } else {
                endGame();
                return;
            }
        }

        // Bullet collision
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.size / 2) {
                bullets.splice(j, 1);
                enemies.splice(i, 1);
                if (e.type === "enemy2") {
                    score = Math.max(0, score - 2);
                } else {
                    score++;
                }
                break; // Stop checking bullets for this dead enemy
            }
        }
    }

    requestAnimationFrame(update);
}

// Start the game
spawnInterval = setInterval(spawnEnemy, 1000);
update();