class SnakeGame {
    constructor() {
        // DOM Elements
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.lengthElement = document.getElementById('length');
        this.speedElement = document.getElementById('speed');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalLengthElement = document.getElementById('finalLength');
        this.foodEatenElement = document.getElementById('foodEaten');
        
        // Game Elements
        this.startScreen = document.getElementById('startScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.helpModal = document.getElementById('helpModal');
        
        // Audio Elements
        this.eatSound = document.getElementById('eatSound');
        this.gameOverSound = document.getElementById('gameOverSound');
        this.moveSound = document.getElementById('moveSound');
        
        // Game Settings
        this.gridSize = 20;
        this.snake = [];
        this.food = {};
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameSpeed = 100;
        this.gameInterval = null;
        this.isPaused = false;
        this.isGameOver = false;
        this.foodEaten = 0;
        this.soundEnabled = true;
        
        // Initialize
        this.init();
        this.setupEventListeners();
        this.updateHighScoreDisplay();
    }

    init() {
        // Set canvas size
        const canvasSize = Math.min(600, window.innerWidth * 0.8);
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        
        // Initialize snake
        this.resetSnake();
        
        // Generate first food
        this.generateFood();
        
        // Draw initial state
        this.draw();
    }

    resetSnake() {
        const startX = Math.floor((this.canvas.width / this.gridSize) / 2);
        const startY = Math.floor((this.canvas.height / this.gridSize) / 2);
        this.snake = [
            {x: startX, y: startY},
            {x: startX - 1, y: startY},
            {x: startX - 2, y: startY}
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
    }

    generateFood() {
        let foodPosition;
        let validPosition = false;
        
        // Keep generating until we find a position not occupied by snake
        while (!validPosition) {
            foodPosition = {
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
            };
            
            validPosition = !this.snake.some(segment => 
                segment.x === foodPosition.x && segment.y === foodPosition.y
            );
        }
        
        this.food = foodPosition;
    }

    draw() {
        // Clear canvas with gradient
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, '#1a1a2e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (optional, can be disabled for performance)
        this.drawGrid();
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            this.drawSegment(segment, isHead);
        });
        
        // Draw food with glow effect
        this.drawFood();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 0.5;
        
        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawSegment(segment, isHead) {
        const x = segment.x * this.gridSize;
        const y = segment.y * this.gridSize;
        const size = this.gridSize - 2;
        
        // Create gradient for segment
        const gradient = this.ctx.createRadialGradient(
            x + size/2, y + size/2, 0,
            x + size/2, y + size/2, size/2
        );
        
        if (isHead) {
            gradient.addColorStop(0, '#00ff88');
            gradient.addColorStop(1, '#00b4d8');
            
            // Draw eyes on head
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(x + size/3, y + size/3, 3, 3);
            this.ctx.fillRect(x + 2*size/3 - 3, y + size/3, 3, 3);
        } else {
            gradient.addColorStop(0, '#4CAF50');
            gradient.addColorStop(1, '#2E7D32');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, size, size);
        
        // Add border
        this.ctx.strokeStyle = isHead ? '#00ff88' : '#2E7D32';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, size, size);
    }

    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        const size = this.gridSize - 2;
        const centerX = x + size/2;
        const centerY = y + size/2;
        
        // Create glowing effect
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, size/2
        );
        gradient.addColorStop(0, '#ff5252');
        gradient.addColorStop(1, '#c62828');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, size/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add shine effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - size/4, centerY - size/4, size/4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    update() {
        if (this.isPaused || this.isGameOver) return;
        
        // Move snake
        const head = {...this.snake[0]};
        this.direction = this.nextDirection;
        
        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        
        // Check wall collision (wrap-around or game over - using wrap-around for fun)
        if (head.x < 0) head.x = (this.canvas.width / this.gridSize) - 1;
        if (head.x >= this.canvas.width / this.gridSize) head.x = 0;
        if (head.y < 0) head.y = (this.canvas.height / this.gridSize) - 1;
        if (head.y >= this.canvas.height / this.gridSize) head.y = 0;
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.foodEaten++;
            this.updateScore();
            this.generateFood();
            this.playSound(this.eatSound);
            
            // Increase speed every 5 foods
            if (this.foodEaten % 5 === 0 && this.gameSpeed > 40) {
                this.gameSpeed = Math.max(40, this.gameSpeed - 10);
                this.updateGameSpeed();
                if (this.gameInterval) {
                    clearInterval(this.gameInterval);
                    this.startGameLoop();
                }
            }
        } else {
            this.snake.pop(); // Remove tail if no food eaten
        }
        
        // Update length display
        this.lengthElement.textContent = this.snake.length.toString().padStart(2, '0');
    }

    gameLoop() {
        this.update();
        this.draw();
    }

    startGame() {
        this.resetGame();
        this.startScreen.classList.remove('active');
        this.isPaused = false;
        this.isGameOver = false;
        this.startGameLoop();
    }

    startGameLoop() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), this.gameSpeed);
    }

    pauseGame() {
        if (this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            clearInterval(this.gameInterval);
            this.pauseScreen.classList.add('active');
        } else {
            this.startGameLoop();
            this.pauseScreen.classList.remove('active');
        }
    }

    gameOver() {
        this.isGameOver = true;
        clearInterval(this.gameInterval);
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScoreDisplay();
            
            // Show special message for new high score
            this.finalScoreElement.innerHTML = `${this.score} <span style="color:#ffd700;">(NEW HIGH SCORE!)</span>`;
        } else {
            this.finalScoreElement.textContent = this.score;
        }
        
        this.finalLengthElement.textContent = this.snake.length;
        this.foodEatenElement.textContent = this.foodEaten;
        
        // Play game over sound
        this.playSound(this.gameOverSound);
        
        // Show game over screen
        setTimeout(() => {
            this.gameOverScreen.classList.add('active');
        }, 500);
    }

    resetGame() {
        clearInterval(this.gameInterval);
        this.snake = [];
        this.resetSnake();
        this.generateFood();
        this.score = 0;
        this.foodEaten = 0;
        this.isPaused = false;
        this.isGameOver = false;
        
        // Reset to selected speed
        const activeSpeedBtn = document.querySelector('.speed-btn.active');
        if (activeSpeedBtn) {
            this.gameSpeed = parseInt(activeSpeedBtn.dataset.speed);
        }
        
        this.updateScore();
        this.updateGameSpeed();
        this.startScreen.classList.remove('active');
        this.pauseScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');
    }

    updateScore() {
        this.scoreElement.textContent = this.score.toString().padStart(4, '0');
    }

    updateHighScoreDisplay() {
        this.highScoreElement.textContent = this.highScore.toString().padStart(4, '0');
    }

    updateGameSpeed() {
        let speedText = '';
        if (this.gameSpeed >= 150) speedText = 'SLOW';
        else if (this.gameSpeed >= 100) speedText = 'NORMAL';
        else if (this.gameSpeed >= 70) speedText = 'FAST';
        else speedText = 'INSANE';
        
        this.speedElement.textContent = speedText;
    }

    playSound(soundElement) {
        if (this.soundEnabled) {
            soundElement.currentTime = 0;
            soundElement.play().catch(e => console.log("Audio play failed:", e));
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.querySelector('#soundToggle i');
        icon.className = this.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        
        // Add visual feedback
        const btn = document.getElementById('soundToggle');
        btn.style.borderColor = this.soundEnabled ? '#00b4d8' : '#ff5252';
        setTimeout(() => {
            btn.style.borderColor = '';
        }, 1000);
    }

    changeDirection(newDirection) {
        // Prevent 180-degree turns
        if (
            (newDirection === 'up' && this.direction !== 'down') ||
            (newDirection === 'down' && this.direction !== 'up') ||
            (newDirection === 'left' && this.direction !== 'right') ||
            (newDirection === 'right' && this.direction !== 'left')
        ) {
            this.nextDirection = newDirection;
            this.playSound(this.moveSound);
        }
    }

    changeSpeed(speed) {
        this.gameSpeed = speed;
        this.updateGameSpeed();
        
        if (this.gameInterval && !this.isPaused && !this.isGameOver) {
            clearInterval(this.gameInterval);
            this.startGameLoop();
        }
        
        // Update active button state
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.speed) === speed);
        });
    }

    setupEventListeners() {
        // Keyboard Controls
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    e.preventDefault();
                    this.changeDirection('up');
                    break;
                case 'arrowdown':
                case 's':
                    e.preventDefault();
                    this.changeDirection('down');
                    break;
                case 'arrowleft':
                case 'a':
                    e.preventDefault();
                    this.changeDirection('left');
                    break;
                case 'arrowright':
                case 'd':
                    e.preventDefault();
                    this.changeDirection('right');
                    break;
                case ' ':
                case 'p':
                    e.preventDefault();
                    this.pauseGame();
                    break;
                case 'r':
                    if (this.isGameOver) {
                        this.resetGame();
                        this.startGame();
                    }
                    break;
                case 'escape':
                    e.preventDefault();
                    if (!this.startScreen.classList.contains('active')) {
                        this.resetGame();
                        this.startScreen.classList.add('active');
                    }
                    break;
                case 'm':
                    e.preventDefault();
                    this.toggleSound();
                    break;
            }
        });

        // Directional Buttons
        document.querySelectorAll('.dir-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.dir;
                this.changeDirection(direction);
                
                // Add click animation
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 150);
            });
            
            // Add touch support for mobile
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const direction = btn.dataset.dir;
                this.changeDirection(direction);
                
                // Visual feedback
                btn.style.transform = 'scale(0.95)';
            });
            
            btn.addEventListener('touchend', () => {
                btn.style.transform = '';
            });
        });

        // Speed Control Buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseInt(btn.dataset.speed);
                this.changeSpeed(speed);
            });
        });

        // Game Control Buttons
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('pauseGameBtn').addEventListener('click', () => {
            this.pauseGame();
        });

        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.pauseGame();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });

        document.getElementById('resetScoreBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset your high score?')) {
                this.highScore = 0;
                localStorage.removeItem('snakeHighScore');
                this.updateHighScoreDisplay();
            }
        });

        // Sound Toggle
        document.getElementById('soundToggle').addEventListener('click', () => {
            this.toggleSound();
        });

        // Help Button
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.helpModal.classList.add('active');
        });

        document.querySelector('.close-modal').addEventListener('click', () => {
            this.helpModal.classList.remove('active');
        });

        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.helpModal.classList.remove('active');
            }
        });

        // Difficulty Selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => 
                    b.classList.remove('active')
                );
                btn.classList.add('active');
                const speed = parseInt(btn.dataset.speed);
                this.gameSpeed = speed;
                this.updateGameSpeed();
            });
        });

        // Window Resize
        window.addEventListener('resize', () => {
            const canvasSize = Math.min(600, window.innerWidth * 0.8);
            this.canvas.width = canvasSize;
            this.canvas.height = canvasSize;
            this.draw();
        });

        // Prevent context menu on canvas (right-click)
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Touch swipe controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            // Minimum swipe distance
            if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
            
            // Determine primary direction
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                if (dx > 0) this.changeDirection('right');
                else this.changeDirection('left');
            } else {
                // Vertical swipe
                if (dy > 0) this.changeDirection('down');
                else this.changeDirection('up');
            }
            
            e.preventDefault();
        }, { passive: false });
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
    
    // Make game instance globally available for debugging if needed
    window.snakeGame = game;
    
    // Show start screen initially
    game.startScreen.classList.add('active');
});