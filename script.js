// تعريف عناصر الواجهة
const gameContainer = document.getElementById('gameContainer');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuScreen = document.getElementById('menuScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreValueElement = document.getElementById('scoreValue');
const finalScoreElement = document.getElementById('finalScore');
const startButton = document.getElementById('startButton');
const ingameRestartBtn = document.getElementById('ingameRestartBtn');
const gameOverRestartBtn = document.getElementById('gameOverRestartBtn');

// ===== إضافة: تعريف عناصر الصوت =====
const muteBtn = document.getElementById('muteBtn');
const iconSoundOn = document.getElementById('iconSoundOn');
const iconSoundOff = document.getElementById('iconSoundOff');
const bgMusic = document.getElementById('bgMusic');

// متغيرات اللعبة
let isMuted = false; // حالة كتم الصوت
let gameStarted = false;
let animationFrameId;
let gameTime = 0;
let score = 0;
let gameSpeed = 3.5;
let groundY;
let scaleFactor = 1;

const player = { x: 0, y: 0, width: 0, height: 0, baseHeight: 0, vx: 0, vy: 0, jumping: false, trail: [] };

let obstacles = [], particles = [], bgLayers = [], stars = [];
const screenShake = { magnitude: 0, duration: 0 };
const keys = {};

// ===== إضافة: دالة التحكم بالصوت =====
function toggleMute() {
    isMuted = !isMuted;
    muteBtn.title = isMuted ? "تشغيل الصوت" : "كتم الصوت";
    iconSoundOn.style.display = isMuted ? 'none' : 'block';
    iconSoundOff.style.display = isMuted ? 'block' : 'none';

    if (isMuted) {
        bgMusic.pause();
    } else {
        // لا تشغل الموسيقى إلا إذا كانت اللعبة تعمل بالفعل
        if (gameStarted) {
            bgMusic.play();
        }
    }
}

// إضافة مستمعي الأحداث
muteBtn.addEventListener('click', toggleMute);
startButton.addEventListener('click', startGame);
ingameRestartBtn.addEventListener('click', restartGame);
gameOverRestartBtn.addEventListener('click', restartGame);

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') { e.preventDefault(); handleJump(); }
    if ((gameStarted || gameOverScreen.style.display === 'flex') && (e.code === 'Enter' || e.code === 'KeyR')) {
        restartGame();
    }
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });
canvas.addEventListener('touchstart', handleTouch, false);
canvas.addEventListener('mousedown', (e) => {
    if (e.target.closest('.ui-button')) return; // تجاهل النقر على أي من أزرار الواجهة
    handleJump();
}, false);


function handleJump() {
    if (gameStarted && !player.jumping) {
        player.vy = -scale(28);
        player.jumping = true;
        createParticles(player.x + player.width / 2, player.y + player.height, 20, '#ffcc00', scale(4));
        // لا يوجد صوت قفز هنا حسب الطلب
    }
}

function handleTouch(e) {
    e.preventDefault();
    handleJump();
}

function startGame() {
    menuScreen.classList.add('hidden');
    setTimeout(() => {
        menuScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        gameStarted = true;
        // ===== تعديل: تشغيل الموسيقى عند بدء اللعبة =====
        if (!isMuted) {
            bgMusic.play().catch(e => console.error("لا يمكن تشغيل الصوت تلقائيا:", e));
        }
        if (!animationFrameId) {
            gameLoop();
        }
    }, 700);
}

function gameOver() {
    if (!gameStarted) return;
    gameStarted = false;
    bgMusic.pause(); // ===== تعديل: إيقاف الموسيقى عند نهاية اللعبة =====

    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'flex';
    createParticles(player.x, player.y, 100, '#ff3366', scale(8));
    triggerScreenShake(15, 20);
}

function restartGame() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    gameStarted = false;
    gameOverScreen.style.display = 'none';
    resetGame();
    initGraphics();
    gameStarted = true;

    // ===== تعديل: إعادة تشغيل الموسيقى =====
    if (!isMuted) {
        bgMusic.currentTime = 0; // إعادة المقطع للبداية
        bgMusic.play();
    }

    gameLoop();
}


// --- باقي دوال اللعبة (بدون تغيير) ---

function scale(value) { return value * scaleFactor; }
function resizeGame() {
    const containerRect = gameContainer.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    scaleFactor = canvas.width / 900;
    groundY = canvas.height - scale(70);
    if(gameStarted || gameOverScreen.style.display === 'flex') {
        restartGame();
    } else {
        resetGame();
        initGraphics();
    }
}
function initGraphics() {
    bgLayers = []; stars = [];
    for (let i = 0; i < 20; i++) {
        bgLayers.push({ x: Math.random() * canvas.width * 2, y: groundY - scale(100 + Math.random() * 200),
            width: scale(50 + Math.random() * 100), height: scale(100 + Math.random() * 200),
            speed: 0.2, color: 'rgba(22, 34, 42, 0.7)' });
    }
    for (let i = 0; i < 10; i++) {
        bgLayers.push({ x: Math.random() * canvas.width * 1.5, y: groundY - scale(80 + Math.random() * 150),
            width: scale(80 + Math.random() * 120), height: scale(80 + Math.random() * 150),
            speed: 0.5, color: 'rgba(58, 96, 115, 0.6)' });
    }
    for (let i = 0; i < 100; i++) {
        stars.push({ x: Math.random() * canvas.width, y: Math.random() * groundY,
            size: Math.random() * 1.5, opacity: Math.random() * 0.8 });
    }
}
function createParticles(x, y, count, color, speed) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y, vx: (Math.random() - 0.5) * speed, vy: (Math.random() - 0.5) * speed,
            size: scale(Math.random() * 3 + 1), life: 50 + Math.random() * 30, color: color });
    }
}
function triggerScreenShake(magnitude, duration) {
    screenShake.magnitude = scale(magnitude);
    screenShake.duration = duration;
}
function drawPlayer() {
    ctx.fillStyle = 'rgba(255, 51, 102, 0.1)';
    player.trail.forEach(p => { ctx.fillRect(p.x, p.y, player.width, player.height); });
    if (player.jumping) {
        const flameHeight = scale(Math.random() * 20 + 10);
        const flameGradient = ctx.createLinearGradient(player.x + player.width / 2, player.y + player.height, player.x + player.width / 2, player.y + player.height + flameHeight);
        flameGradient.addColorStop(0, '#ffcc00'); flameGradient.addColorStop(1, '#ff3366');
        ctx.fillStyle = flameGradient; ctx.beginPath();
        ctx.moveTo(player.x, player.y + player.height);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.lineTo(player.x + player.width / 2, player.y + player.height + flameHeight);
        ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = scale(15); ctx.shadowColor = '#ff3366'; ctx.fillStyle = '#ff3366';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = scale(5); ctx.shadowColor = '#4cd1ff'; ctx.fillStyle = '#4cd1ff';
    ctx.fillRect(player.x + player.width - scale(15), player.y + scale(10), scale(10), scale(10));
    ctx.shadowBlur = 0;
}
function drawObstacle(obstacle) {
    const pulse = Math.sin(gameTime * 0.005) * 5 + 20;
    ctx.shadowBlur = scale(pulse); ctx.shadowColor = '#4cd1ff';
    const gradient = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.height);
    gradient.addColorStop(0, '#4cd1ff'); gradient.addColorStop(1, '#1CB5E0');
    ctx.fillStyle = gradient; ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = scale(2);
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y + (obstacle.height / 4) * i);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + (obstacle.height / 4) * i);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
}
function drawGround() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    ctx.lineWidth = scale(1); ctx.shadowBlur = scale(10); ctx.shadowColor = '#4cd1ff';
    for (let i = 0; i < 8; i++) {
        const pulseAlpha = Math.sin(gameTime * 0.001 + i * 0.5) * 0.1 + 0.2;
        ctx.strokeStyle = `rgba(76, 209, 255, ${pulseAlpha})`;
        const y = groundY + i * scale(15);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(76, 209, 255, 0.2)';
    for (let i = -10; i < 11; i++) {
        const perspectiveCenter = canvas.width / 2;
        ctx.beginPath(); ctx.moveTo(perspectiveCenter + i * scale(30), groundY);
        ctx.lineTo(perspectiveCenter + i * scale(200), canvas.height); ctx.stroke();
    }
    ctx.shadowBlur = 0;
}
function drawBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGradient.addColorStop(0, '#0d0d1a'); skyGradient.addColorStop(1, '#16222A');
    ctx.fillStyle = skyGradient; ctx.fillRect(0, 0, canvas.width, groundY);
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    bgLayers.forEach(layer => { ctx.fillStyle = layer.color; ctx.fillRect(layer.x, layer.y, layer.width, layer.height); });
}
function drawVignette() {
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width/3, canvas.width/2, canvas.height/2, canvas.width/1.5);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function update() {
    if (!gameStarted) return;
    gameTime += 16.67;
    if (keys['ArrowLeft'] || keys['KeyA']) player.vx = -scale(5);
    else if (keys['ArrowRight'] || keys['KeyD']) player.vx = scale(5);
    else player.vx *= 0.9;
    player.vy += scale(0.8);
    player.x += player.vx;
    player.y += player.vy;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    const idleBob = !player.jumping && Math.abs(player.vx) < 1 ? Math.sin(gameTime * 0.005) * scale(1) : 0;
    if (player.y + player.height >= groundY) {
        player.y = groundY - player.height; player.vy = 0;
        if (player.jumping) {
            player.height = player.baseHeight * 0.8; player.y += player.baseHeight * 0.2;
            createParticles(player.x + player.width / 2, groundY, 10, '#ffffff', scale(2));
        }
        player.jumping = false;
    }
    player.y += idleBob;
    if (player.height < player.baseHeight) {
        player.height += scale(2); player.y -= scale(2);
        if (player.height > player.baseHeight) { player.height = player.baseHeight; }
    }
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 10) player.trail.shift();
    bgLayers.forEach(layer => {
        layer.x -= layer.speed * (scale(gameSpeed) / 4);
        if (layer.x + layer.width < 0) layer.x = canvas.width + Math.random() * scale(200);
    });
    const canSpawnObstacle = obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - scale(850);
    const obstacleSpawnRate = 0.03;
    if (gameTime > 3000 && canSpawnObstacle && Math.random() < obstacleSpawnRate) {
        const height = scale(60 + Math.random() * 40);
        obstacles.push({ x: canvas.width, y: groundY - height, width: scale(30 + Math.random() * 20), height: height, passed: false });
    }
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= scale(gameSpeed);
        if (player.x < obstacle.x + obstacle.width && player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height && player.y + player.height > obstacle.y) {
            gameOver();
        }
        if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
            obstacle.passed = true; score += 10;
            scoreValueElement.textContent = score;
            createParticles(obstacle.x + obstacle.width / 2, obstacle.y, 30, '#4cd1ff', scale(5));
        }
        if (obstacle.x + obstacle.width < 0) { obstacles.splice(index, 1); }
    });
    particles.forEach((p, index) => {
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.life <= 0) particles.splice(index, 1);
    });
    if (gameTime > 3000) { gameSpeed += 0.00025; }
    if (screenShake.duration > 0) { screenShake.duration--; } else { screenShake.magnitude = 0; }
}
function draw() {
    if (!gameStarted) return;
    ctx.save();
    if (screenShake.magnitude > 0) {
        const dx = (Math.random() - 0.5) * screenShake.magnitude;
        const dy = (Math.random() - 0.5) * screenShake.magnitude;
        ctx.translate(dx, dy);
    }
    drawBackground();
    drawGround();
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 60; ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1;
    });
    obstacles.forEach(drawObstacle);
    drawPlayer();
    drawVignette();
    ctx.restore();
}
function gameLoop() {
    if (!gameStarted) return;
    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}
function resetGame() {
    gameSpeed = 3.5; score = 0; gameTime = 0;
    scoreValueElement.textContent = '0';
    obstacles = []; particles = [];
    player.width = scale(40); player.height = scale(60); player.baseHeight = scale(60);
    player.x = scale(100); player.y = groundY - player.height;
    player.vx = 0; player.vy = 0; player.jumping = false; player.trail = [];
}
window.addEventListener('resize', resizeGame);
window.addEventListener('load', () => {
    const containerRect = gameContainer.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    scaleFactor = canvas.width / 900;
    groundY = canvas.height - scale(70);
    resetGame();
    initGraphics();
});