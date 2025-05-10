class FractionFrenzy {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = 600;  // Ensure canvas dimensions are set
        this.canvas.height = 400;
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.gameActive = false;
        this.pizzaSlices = [];
        
        // Get difficulty settings
        const settings = window.getGameSettings();
        this.timeLeft = settings.timeLimit;
        this.timeBonus = settings.timeBonus;
        this.timePenalty = settings.timePenalty;
        this.scoreMultiplier = settings.scoreMultiplier;
        
        // Update difficulty badge
        document.getElementById('difficultyBadge').textContent = 
            window.gameSettings?.currentDifficulty.charAt(0).toUpperCase() + 
            window.gameSettings?.currentDifficulty.slice(1);

        this.timeBar = document.getElementById('timeBar');
        this.maxTime = 30; // Set fixed time limit to 30 seconds
        this.timeLeft = this.maxTime;
        
        // Initialize game
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.init();
    }

    init() {
        this.gameActive = true;
        this.updateScore(0);
        this.timeLeft = this.maxTime;
        document.getElementById('timeLeft').textContent = this.timeLeft;
        this.timeBar.style.width = '100%';
        this.startTimer();
        this.generateNewProblem();
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

    generateNewProblem() {
        // Generate random fractions based on difficulty
        const denominators = this.getDenominatorsByDifficulty();
        const denominator = denominators[Math.floor(Math.random() * denominators.length)];
        const numerator = Math.floor(Math.random() * denominator) + 1;
        this.currentFraction = { numerator, denominator };
        
        document.getElementById('question').textContent = 
            `Find ${numerator}/${denominator}`;
        
        this.drawPizza();
    }

    getDenominatorsByDifficulty() {
        const difficulty = window.gameSettings?.currentDifficulty || 'normal';
        switch(difficulty) {
            case 'easy':
                return [2, 3, 4];
            case 'hard':
                return [3, 4, 6, 8, 12];
            default: // normal
                return [2, 3, 4, 6, 8];
        }
    }

    drawPizza() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw multiple pizzas with different fractions
        const pizzaConfigs = this.generatePizzaConfigs();
        this.pizzaSlices = [];

        pizzaConfigs.forEach((config, index) => {
            // Layout in a 2x3 grid
            const col = index % 3;  // 3 columns
            const row = Math.floor(index / 3);  // 2 rows
            const centerX = 100 + col * 200;  // Space pizzas 200px apart horizontally
            const centerY = 100 + row * 200;  // Space pizzas 200px apart vertically
            
            this.drawSinglePizza(centerX, centerY, config.slices, config.highlighted);
            
            // Store pizza data for click detection
            this.pizzaSlices.push({
                x: centerX,
                y: centerY,
                radius: 80,
                fraction: config.fraction,
                isCorrect: config.isCorrect
            });
        });
    }

    generatePizzaConfigs() {
        const configs = [];
        const correctFraction = this.currentFraction.numerator / this.currentFraction.denominator;
        
        // Add correct answer
        configs.push({
            slices: this.currentFraction.denominator,
            highlighted: this.currentFraction.numerator,
            fraction: correctFraction,
            isCorrect: true
        });

        // Add wrong answers
        while (configs.length < 6) {  // Changed from 4 to 6
            const denominator = [2, 3, 4, 6, 8][Math.floor(Math.random() * 5)];
            const numerator = Math.floor(Math.random() * denominator) + 1;
            const fraction = numerator / denominator;
            
            if (!configs.some(c => Math.abs(c.fraction - fraction) < 0.01)) {
                configs.push({
                    slices: denominator,
                    highlighted: numerator,
                    fraction: fraction,
                    isCorrect: false
                });
            }
        }

        // Shuffle configs
        return configs.sort(() => Math.random() - 0.5);
    }

    drawSinglePizza(centerX, centerY, slices, highlightedSlices) {
        const radius = 80;
        
        // Draw full pizza circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.fillStyle = '#FFE4B5';
        this.ctx.fill();
        this.ctx.stroke();

        // Draw slices
        for (let i = 0; i < slices; i++) {
            const startAngle = (i * 2 * Math.PI) / slices;
            const endAngle = ((i + 1) * 2 * Math.PI) / slices;

            // Draw slice lines
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(
                centerX + radius * Math.cos(startAngle),
                centerY + radius * Math.sin(startAngle)
            );
            this.ctx.stroke();

            // Fill highlighted slices
            if (i < highlightedSlices) {
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                this.ctx.fillStyle = '#FFA500';
                this.ctx.fill();
                this.ctx.stroke();
            }
        }
    }

    handleClick(event) {
        if (!this.gameActive) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.pizzaSlices.forEach(pizza => {
            const distance = Math.sqrt(
                Math.pow(x - pizza.x, 2) + Math.pow(y - pizza.y, 2)
            );

            if (distance <= pizza.radius) {
                this.checkAnswer(pizza.isCorrect);
            }
        });
    }

    checkAnswer(isCorrect) {
        if (isCorrect) {
            audioManager.play('correct');
            this.updateScore(this.score + Math.round(10 * this.scoreMultiplier));
            // Add time bonus but don't exceed max time
            this.timeLeft = Math.min(this.maxTime, this.timeLeft + this.timeBonus);
            document.getElementById('timeLeft').textContent = this.timeLeft;
            const percentage = (this.timeLeft / this.maxTime) * 100;
            this.timeBar.style.width = percentage + '%';
        } else {
            audioManager.play('incorrect');
            this.timeLeft = Math.max(0, this.timeLeft - this.timePenalty);
            document.getElementById('timeLeft').textContent = this.timeLeft;
            const percentage = (this.timeLeft / this.maxTime) * 100;
            this.timeBar.style.width = percentage + '%';
        }
        this.generateNewProblem();
    }

    updateScore(newScore) {
        this.score = newScore;
        document.getElementById('score').textContent = this.score;
        // Update the main game hub score
        if (window.updateGameScore) {
            window.updateGameScore('fractionFrenzy', this.score);
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

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FractionFrenzy();
});