const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
let maxScore = parseInt(prompt("Enter the maximum score to win the game:", "5"));
if (isNaN(maxScore) || maxScore < 1) maxScore = 5; // Fallback

let gameOver = false;

// Game settings
const PADDLE_WIDTH = 14;
const PADDLE_HEIGHT = 90;
const PADDLE_MARGIN = 24;
const BALL_RADIUS = 12;
const PLAYER_COLOR = 'linear-gradient(180deg, #33c3ff 0%, #53e6ff 100%)';
const AI_COLOR = 'linear-gradient(180deg, #ff5c93 0%, #ffc371 100%)';
const BALL_COLOR = 'white';
const NET_COLOR = '#53e6ff';
const SPEED = 7;
const AI_SPEED = 4.5;

// State
let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = SPEED * (Math.random() < 0.5 ? 1 : -1);
let ballSpeedY = SPEED * (Math.random() - 0.5);
let playerScore = 0;
let aiScore = 0;

function drawNet() {
    ctx.save();
    ctx.strokeStyle = NET_COLOR;
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 22]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

function drawGradientRect(x, y, w, h, color1, color2) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
}

function drawPaddle(x, y, color) {
    if (color === PLAYER_COLOR) {
        drawGradientRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT, "#33c3ff", "#53e6ff");
    } else {
        drawGradientRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT, "#ff5c93", "#ffc371");
    }
    // Soft corner highlight
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, PADDLE_WIDTH, 18);
    ctx.restore();
}

function drawBall(x, y, color) {
    // Ball shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 3, y + 4, BALL_RADIUS, 0, Math.PI * 2);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();

    // Ball gradient
    const grad = ctx.createRadialGradient(
        x - 5, y - 5, BALL_RADIUS / 2, x, y, BALL_RADIUS
    );
    grad.addColorStop(0, "#fff");
    grad.addColorStop(0.8, "#eee");
    grad.addColorStop(1, "#53e6ff");
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = "#53e6ff";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function updateScoreboard() {
    playerScoreEl.textContent = playerScore;
    aiScoreEl.textContent = aiScore;
}
function checkGameOver() {
    if (playerScore >= maxScore || aiScore >= maxScore) {
        gameOver = true;
        let winner = playerScore >= maxScore ? "Player" : "AI";
        setTimeout(() => {
            alert(`${winner} wins! Final Score: ${playerScore} - ${aiScore}`);
        }, 100);
    }
}
// Reset ball position and direction
function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = SPEED * (Math.random() < 0.5 ? 1 : -1);
    ballSpeedY = SPEED * (Math.random() - 0.5);
}

// Collision detection for paddle
function paddleCollision(paddleX, paddleY) {
    return (
        ballX - BALL_RADIUS < paddleX + PADDLE_WIDTH &&
        ballX + BALL_RADIUS > paddleX &&
        ballY + BALL_RADIUS > paddleY &&
        ballY - BALL_RADIUS < paddleY + PADDLE_HEIGHT
    );
}
// Game update
function update() {
    if (gameOver) return;
    // Move ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Top and bottom wall collision
    if (ballY - BALL_RADIUS < 0) {
        ballY = BALL_RADIUS;
        ballSpeedY = -ballSpeedY;
    }
    if (ballY + BALL_RADIUS > canvas.height) {
        ballY = canvas.height - BALL_RADIUS;
        ballSpeedY = -ballSpeedY;
    }

    // Left paddle collision
    if (paddleCollision(PADDLE_MARGIN, playerY)) {
        ballX = PADDLE_MARGIN + PADDLE_WIDTH + BALL_RADIUS;
        ballSpeedX = -ballSpeedX * 1.03;
        // Add some spin
        let hitPoint = (ballY - (playerY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballSpeedY = SPEED * hitPoint * 1.1 + ballSpeedY * 0.15;
    }

    // Right paddle (AI) collision
    if (paddleCollision(canvas.width - PADDLE_MARGIN - PADDLE_WIDTH, aiY)) {
        ballX = canvas.width - PADDLE_MARGIN - PADDLE_WIDTH - BALL_RADIUS;
        ballSpeedX = -ballSpeedX * 1.03;
        let hitPoint = (ballY - (aiY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballSpeedY = SPEED * hitPoint * 1.1 + ballSpeedY * 0.15;
    }

    // Left wall (AI scores)
    if (ballX - BALL_RADIUS < 0) {
        aiScore++;
        updateScoreboard();
        checkGameOver();
        resetBall();
    }

    // Right wall (Player scores)
    if (ballX + BALL_RADIUS > canvas.width) {
        playerScore++;
        updateScoreboard();
        checkGameOver();
        resetBall();
    }

    // AI paddle movement (anticipate ball with slight inertia)
    let aiCenter = aiY + PADDLE_HEIGHT / 2;
    let target = ballY + (Math.random() - 0.5) * 16;
    if (aiCenter < target - 18) {
        aiY += AI_SPEED;
    } else if (aiCenter > target + 18) {
        aiY -= AI_SPEED;
    }
    // Clamp AI paddle position
    aiY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiY));
}

// Render game
function render() {
    // Background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Soft vignette
    let vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
    );
    vignette.addColorStop(0.85, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(21, 30, 48, 0.58)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Net
    drawNet();

    // Paddles
    drawPaddle(PADDLE_MARGIN, playerY, PLAYER_COLOR);
    drawPaddle(canvas.width - PADDLE_MARGIN - PADDLE_WIDTH, aiY, AI_COLOR);

    // Ball
    drawBall(ballX, ballY, BALL_COLOR);
}

// Mouse controls for player paddle
canvas.addEventListener('mousemove', function (evt) {
    let rect = canvas.getBoundingClientRect();
    let mouseY = evt.clientY - rect.top;
    playerY = mouseY - PADDLE_HEIGHT / 2;
    // Clamp to canvas
    playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));
});

// Main loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Setup
updateScoreboard();
gameLoop();