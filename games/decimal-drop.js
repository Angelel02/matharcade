class DecimalDrop {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = 600;  // Ensure canvas dimensions are set
        this.canvas.height = 400;
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.gameActive = false;
        this.bucketX = this.canvas.width / 2;
        this.bucketWidth = 60;
        this.bucketHeight = 40;
        this.fallingNumbers = [];
        this.currentTarget = null;
        
        // Get difficulty settings
        const settings = window.getGameSettings();
        this.timeLeft = settings.timeLimit;
        this.timeBonus = settings.timeBonus;
        this.timePenalty = settings.timePenalty;
        this.scoreMultiplier = settings.scoreMultiplier;
        this.dropSpeed = this.getSpeedByDifficulty();
        
        // Update difficulty badge
        document.getElementById('difficultyBadge').textContent = 
            window.gameSettings?.currentDifficulty.charAt(0).toUpperCase() + 
            window.gameSettings?.currentDifficulty.slice(1);
        
        this.timeBar = document.getElementById('timeBar');
        this.maxTime = 30; // Set fixed time limit to 30 seconds
        this.timeLeft = this.maxTime;
        
        // Controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        this.init();
    }

    getSpeedByDifficulty() {
        const difficulty = window.gameSettings?.currentDifficulty || 'normal';
        switch(difficulty) {
            case 'easy':
                return 0.8;
            case 'hard':
                return 1.8;
            default: // normal
                return 1.2;
        }
    }

    getRangesByDifficulty() {
        const difficulty = window.gameSettings?.currentDifficulty || 'normal';
        switch(difficulty) {
            case 'easy':
                return [
                    { min: 0, max: 0.5, text: "Numbers less than 0.5" },
                    { min: 0.5, max: 1, text: "Numbers greater than 0.5" }
                ];
            case 'hard':
                return [
                    { min: 0, max: 0.25, text: "Numbers less than 0.25" },
                    { min: 0.25, max: 0.5, text: "Numbers between 0.25 and 0.5" },
                    { min: 0.5, max: 0.75, text: "Numbers between 0.5 and 0.75" },
                    { min: 0.75, max: 1, text: "Numbers greater than 0.75" }
                ];
            default: // normal
                return [
                    { min: 0, max: 0.3, text: "Numbers less than 0.3" },
                    { min: 0.3, max: 0.7, text: "Numbers between 0.3 and 0.7" },
                    { min: 0.7, max: 1, text: "Numbers greater than 0.7" }
                ];
        }
    }

    init() {
        this.gameActive = true;
        this.updateScore(0);
        this.timeLeft = this.maxTime;
        document.getElementById('timeLeft').textContent = this.timeLeft;
        this.timeBar.style.width = '100%';
        this.startTimer();
        this.generateTarget();
        this.gameLoop();
    }

    startTimer() {
        const timerInterval = setInterval(() => {
            if (this.timeLeft > 0 && this.gameActive) {
                this.timeLeft--;
                document.getElementById('timeLeft').textContent = this.timeLeft;
                // Update time bar
                const percentage = (this.timeLeft / this.maxTime) * 100;
                this.timeBar.style.width = percentage + '%';
            } else {
                clearInterval(timerInterval);
                this.endGame();
            }
        }, 1000);
    }

    generateTarget() {
        const ranges = this.getRangesByDifficulty();
        this.currentTarget = ranges[Math.floor(Math.random() * ranges.length)];
        audioManager.play('click');
    }

    createFallingNumber() {
        if (this.fallingNumbers.length < 5) {  // Limit concurrent numbers
            const number = Math.random();
            this.fallingNumbers.push({
                value: number,
                x: Math.random() * (this.canvas.width - 40),
                y: 0,
                color: '#333'
            });
        }
    }

    handleKeyPress(e) {
        if (!this.gameActive) return;

        const moveSpeed = 20;
        if (e.key === 'ArrowLeft') {
            this.bucketX = Math.max(0, this.bucketX - moveSpeed);
        } else if (e.key === 'ArrowRight') {
            this.bucketX = Math.min(this.canvas.width - this.bucketWidth, this.bucketX + moveSpeed);
        }
    }

    checkCollisions() {
        const bucketTop = this.canvas.height - this.bucketHeight;
        
        this.fallingNumbers = this.fallingNumbers.filter(number => {
            if (number.y + 20 >= bucketTop &&
                number.x + 40 >= this.bucketX &&
                number.x <= this.bucketX + this.bucketWidth) {
                
                const isCorrect = 
                    number.value >= this.currentTarget.min &&
                    number.value < this.currentTarget.max;
                
                if (isCorrect) {
                    audioManager.play('correct');
                    this.updateScore(this.score + Math.round(10 * this.scoreMultiplier));
                    this.timeLeft = Math.min(this.maxTime, this.timeLeft + this.timeBonus);
                    document.getElementById('timeLeft').textContent = this.timeLeft;
                    const percentage = (this.timeLeft / this.maxTime) * 100;
                    this.timeBar.style.width = percentage + '%';
                    this.generateTarget();
                } else {
                    audioManager.play('incorrect');
                    this.timeLeft = Math.max(0, this.timeLeft - this.timePenalty);
                    document.getElementById('timeLeft').textContent = this.timeLeft;
                    const percentage = (this.timeLeft / this.maxTime) * 100;
                    this.timeBar.style.width = percentage + '%';
                    number.color = '#ff0000';
                }
                return false;
            }
            
            if (number.y > this.canvas.height) {
                return false;
            }
            
            return true;
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw target text
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `Catch ${this.currentTarget.text}`,
            this.canvas.width / 2,
            30
        );
        
        // Draw falling numbers
        this.fallingNumbers.forEach(number => {
            this.ctx.fillStyle = number.color;
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                number.value.toFixed(2),
                number.x + 20,
                number.y + 20
            );
        });
        
        // Draw bucket
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.fillRect(
            this.bucketX,
            this.canvas.height - this.bucketHeight,
            this.bucketWidth,
            this.bucketHeight
        );
    }

    update() {
        this.fallingNumbers.forEach(number => {
            number.y += this.dropSpeed;
        });
        
        if (Math.random() < 0.02) {
            this.createFallingNumber();
        }
        
        this.checkCollisions();
    }

    gameLoop() {
        if (!this.gameActive) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    updateScore(newScore) {
        this.score = newScore;
        document.getElementById('score').textContent = this.score;
        if (window.updateGameScore) {
            window.updateGameScore('decimalDrop', this.score);
        }
    }

    endGame() {
        this.gameActive = false;
        audioManager.play('gameOver');
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width/2, this.canvas.height/2);
        this.ctx.font = '20px Arial';
        this.ctx.fillText(
            `Final Score: ${this.score}`,
            this.canvas.width/2,
            this.canvas.height/2 + 40
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DecimalDrop();
});