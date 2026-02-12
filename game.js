const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- ELEMENTS ---
const scoreElement = document.getElementById("scoreValue");
const timeElement = document.getElementById("timeValue");
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverText = document.getElementById("gameOverText");
const highScoreText = document.getElementById("highScoreText");
const restartBtn = document.getElementById("restartBtn");

// --- SOUNDS ---
const shootSound = new Audio("Gun.mp3");
const hitGoodSound = new Audio("Sheep.mp3");
const hitBadSound = new Audio("Horse.mp3");

// --- HINTERGRUNDMUSIK (NEU) ---
const bgMusic = new Audio("Background.mp3");
bgMusic.loop = true; // Musik soll sich wiederholen
bgMusic.volume = 0.2; // Leiser als die Effekte (20%)

// Soundeffekte Lautstärke
shootSound.volume = 0.4;
hitGoodSound.volume = 0.6;
hitBadSound.volume = 0.6;

// --- GAME STATE ---
let center = { x: 0, y: 0 };
let angle = 0;
let bullets = [];
let enemies = [];
let score = 0;
let gameOver = false; // Startet als "false", aber Spiel läuft erst nach Klick richtig
let gameRunning = false; // Neuer Status, damit Musik nicht zu früh startet
let startTime = Date.now();
let spawnInterval;
let highScore = localStorage.getItem("sheepSlayerHighScore") || 0;

// Reload system
let lastShotTime = 0;
const reloadTime = 400; 

// --- RESIZE ---
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    center.x = canvas.width / 2;
    center.y = canvas.height / 2;
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", resize);
resize();

// --- IMAGES ---
const playerImg = new Image(); playerImg.src = "player.png";
const enemyImg = new Image();  enemyImg.src = "enemy.png"; 
const enemy2Img = new Image(); enemy2Img.src = "enemy2.png"; 

// --- CONTROLS ---
window.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    angle = Math.atan2(
        e.clientY - rect.top - center.y,
        e.clientX - rect.left - center.x
    );
});

window.addEventListener("click", () => {
    if (gameOver || !gameRunning) return;

    const now = Date.now();
    if (now - lastShotTime >= reloadTime) {
        bullets.push({
            x: center.x,
            y: center.y,
            dx: Math.cos(angle) * 12,
            dy: Math.sin(angle) * 12,
            r: 6
        });

        shootSound.currentTime = 0;
        shootSound.play();

        lastShotTime = now;
    }
});

window.addEventListener("keydown", e => {
    if (e.code === "Space") {
        if (gameOver || !gameRunning) return;

    const now = Date.now();
    if (now - lastShotTime >= reloadTime) {
        bullets.push({
            x: center.x,
            y: center.y,
            dx: Math.cos(angle) * 12,
            dy: Math.sin(angle) * 12,
            r: 6
        });

        shootSound.currentTime = 0;
        shootSound.play();

        lastShotTime = now;
    }
    }
}
);

// --- SPAWN LOGIC ---
function spawnEnemy() {
    if (gameOver || !gameRunning) return;

    const edge = Math.floor(Math.random() * 4);
    let x, y;

    if (edge === 0) { x = -100; y = Math.random() * canvas.height; } 
    else if (edge === 1) { x = canvas.width + 100; y = Math.random() * canvas.height; } 
    else if (edge === 2) { x = Math.random() * canvas.width; y = -100; } 
    else { x = Math.random() * canvas.width; y = canvas.height + 100; }

    const type = Math.random() < 0.2 ? "enemy2" : "enemy1";
    enemies.push({ x, y, size: 80, type });
}

// --- GAME OVER ---
function endGame() {
    gameOver = true;
    gameRunning = false;
    clearInterval(spawnInterval);
    
    // MUSIK STOPPEN BEI GAME OVER
    bgMusic.pause();
    bgMusic.currentTime = 0; // Zurückspulen für nächstes Mal

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("sheepSlayerHighScore", highScore);
    }

    gameOverText.textContent = "Game Over! Score: " + score;
    highScoreText.textContent = "High Score: " + highScore;
    gameOverScreen.style.display = "flex";
}

// --- RESTART / START ---
restartBtn.onclick = () => {
    bullets = [];
    enemies = [];
    score = 0;
    gameOver = false;
    gameRunning = true; // Spielstatus aktiv setzen
    startTime = Date.now();
    lastShotTime = 0;

    scoreElement.textContent = "0";
    timeElement.textContent = "00:00";
    gameOverScreen.style.display = "none";

    // MUSIK STARTEN
    // Browser erlauben das jetzt, weil der User geklickt hat
    bgMusic.play().catch(e => console.log("Audio play failed: ", e));

    clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnEnemy, 1000); 

    requestAnimationFrame(update);
};

// --- MAIN LOOP ---
function update() {
    if (!gameRunning && !gameOver) {
        // Erstes Rendering bevor Spiel startet (optional)
        // Zeigt Startbildschirm logic wenn nötig
    }

    if (gameOver) return;
    
    // Request Animation Frame immer weiterlaufen lassen, aber Logik stoppen wenn Pause
    if(gameRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Timer
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const secs = String(elapsed % 60).padStart(2, "0");
        timeElement.textContent = `${mins}:${secs}`;
        scoreElement.textContent = score;

        // Player
        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.rotate(angle);
        try {
            ctx.drawImage(playerImg, -45, -45, 90, 90);
        } catch(e) {
            ctx.fillStyle = "white"; ctx.fillRect(-25,-25,50,50);
        }
        ctx.restore();

        // Bullets
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

        // Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i];

            const dx = center.x - e.x;
            const dy = center.y - e.y;
            const dist = Math.hypot(dx, dy);

            e.x += (dx / dist) * 2; 
            e.y += (dy / dist) * 2;

            const img = e.type === "enemy2" ? enemy2Img : enemyImg;
            
            try {
                ctx.drawImage(img, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
            } catch(err) {
                ctx.fillStyle = e.type === "enemy2" ? "cyan" : "red";
                ctx.beginPath(); ctx.arc(e.x, e.y, e.size/2, 0, Math.PI*2); ctx.fill();
            }

            // Kollision Player
            if (dist < 50) {
                if (e.type === "enemy2") {
                    score += 5;
                    hitGoodSound.currentTime = 0;
                    hitGoodSound.play();
                    enemies.splice(i, 1);
                    continue;
                } else {
                    endGame();
                    return;
                }
            }

            // Kollision Bullet
            for (let j = bullets.length - 1; j >= 0; j--) {
                let b = bullets[j];
                if (Math.hypot(b.x - e.x, b.y - e.y) < e.size / 2) {
                    
                    bullets.splice(j, 1);
                    enemies.splice(i, 1);

                    if (e.type === "enemy2") {
                        score = Math.max(0, score - 5);
                        hitBadSound.currentTime = 0;
                        hitBadSound.play();
                    } else {
                        score++;
                        hitGoodSound.currentTime = 0;
                        hitGoodSound.play();
                    }
                    break;
                }
            }
        }
    }

    requestAnimationFrame(update);
}

// Initialer Start (zeigt Game Over Screen als "Start Screen" zuerst an, damit man klicken muss)
// Wir simulieren ein Game Over beim Laden, damit der Button da ist.
gameOver = true; 
gameOverScreen.style.display = "flex";
gameOverText.textContent = "Sheep Slayer"; // Titel beim Start
restartBtn.textContent = "Start Game";       // Button Text beim ersten Mal