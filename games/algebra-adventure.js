class AlgebraAdventure {
    constructor() {
        // Get difficulty settings
        const settings = window.getGameSettings();
        this.timeLeft = settings.timeLimit;
        this.timeBonus = settings.timeBonus;
        this.timePenalty = settings.timePenalty;
        this.scoreMultiplier = settings.scoreMultiplier;
        
        // Game state
        this.score = 0;
        this.gameActive = false;
        this.currentEquation = null;
        this.currentAnswer = null;

        // DOM elements
        this.equationDisplay = document.getElementById('equation');
        this.answerInput = document.getElementById('answer-input');
        this.submitButton = document.getElementById('submitAnswer');
        this.numberPad = document.getElementById('numberPad');
        this.feedbackDiv = document.getElementById('feedback');
        this.timeBar = document.getElementById('timeBar');
        this.maxTime = 30; // Set fixed time limit to 30 seconds
        this.timeLeft = this.maxTime;
        
        // Update difficulty badge
        document.getElementById('difficultyBadge').textContent = 
            window.gameSettings?.currentDifficulty.charAt(0).toUpperCase() + 
            window.gameSettings?.currentDifficulty.slice(1);

        // Event listeners
        this.submitButton.addEventListener('click', () => this.checkAnswer());
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkAnswer();
        });

        this.createNumberPad();
        this.init();
    }

    init() {
        this.gameActive = true;
        this.updateScore(0);
        this.timeLeft = this.maxTime;
        document.getElementById('timeLeft').textContent = this.timeLeft;
        this.timeBar.style.width = '100%';
        this.startTimer();
        this.generateEquation();
    }

    createNumberPad() {
        // Create number buttons 0-9
        for (let i = 1; i <= 9; i++) {
            const button = document.createElement('button');
            button.className = 'number-button';
            button.textContent = i;
            button.addEventListener('click', () => this.appendNumber(i));
            this.numberPad.appendChild(button);
        }
        
        // Add 0 button
        const zeroButton = document.createElement('button');
        zeroButton.className = 'number-button';
        zeroButton.textContent = '0';
        zeroButton.addEventListener('click', () => this.appendNumber(0));
        this.numberPad.appendChild(zeroButton);

        // Add clear button
        const clearButton = document.createElement('button');
        clearButton.className = 'number-button';
        clearButton.textContent = 'C';
        clearButton.addEventListener('click', () => this.clearInput());
        this.numberPad.appendChild(clearButton);

        // Add negative button
        const negativeButton = document.createElement('button');
        negativeButton.className = 'number-button';
        negativeButton.textContent = '±';
        negativeButton.addEventListener('click', () => this.toggleNegative());
        this.numberPad.appendChild(negativeButton);
    }

    appendNumber(num) {
        if (!this.gameActive) return;
        const currentValue = this.answerInput.value;
        this.answerInput.value = currentValue === '0' ? num : currentValue + num;
        audioManager.play('click');
    }

    clearInput() {
        this.answerInput.value = '';
        audioManager.play('click');
    }

    toggleNegative() {
        const currentValue = this.answerInput.value;
        if (currentValue.startsWith('-')) {
            this.answerInput.value = currentValue.substring(1);
        } else if (currentValue !== '') {
            this.answerInput.value = '-' + currentValue;
        }
        audioManager.play('click');
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

    getEquationByDifficulty() {
        const difficulty = window.gameSettings?.currentDifficulty || 'normal';
        let x, a, b, c;
        
        switch(difficulty) {
            case 'easy':
                // Simple equations like 2x + 1 = 5
                x = Math.floor(Math.random() * 10) + 1;
                a = Math.floor(Math.random() * 3) + 1;
                b = Math.floor(Math.random() * 10) - 5;
                c = a * x + b;
                return { x, equation: `${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}` };
            
            case 'hard':
                // More complex equations like 3x - 7 = -16 or -2x + 4 = 10
                x = Math.floor(Math.random() * 20) - 10; // Allow negative answers
                a = Math.floor(Math.random() * 5) - 2; // Allow negative coefficients
                if (a === 0) a = 1; // Avoid zero coefficient
                b = Math.floor(Math.random() * 20) - 10;
                c = a * x + b;
                return { x, equation: `${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}` };
            
            default: // normal
                // Medium equations like 3x + 4 = 13 or 2x - 3 = 5
                x = Math.floor(Math.random() * 12) - 6; // Some negative answers
                a = Math.floor(Math.random() * 4) + 1;
                b = Math.floor(Math.random() * 12) - 6;
                c = a * x + b;
                return { x, equation: `${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}` };
        }
    }

    generateEquation() {
        const { x, equation } = this.getEquationByDifficulty();
        this.currentAnswer = x;
        this.equationDisplay.textContent = equation;
        this.clearInput();
        this.feedbackDiv.textContent = '';
    }

    showFeedback(isCorrect, message) {
        this.feedbackDiv.textContent = message;
        this.feedbackDiv.className = isCorrect ? 'feedback correct' : 'feedback incorrect';
        setTimeout(() => {
            this.feedbackDiv.textContent = '';
            this.feedbackDiv.className = 'feedback';
        }, 2000);
    }

    checkAnswer() {
        if (!this.gameActive) return;

        const userAnswer = parseInt(this.answerInput.value);
        if (isNaN(userAnswer)) return;

        if (userAnswer === this.currentAnswer) {
            audioManager.play('correct');
            this.showFeedback(true, 'Correct! Well done! 🎉');
            this.updateScore(this.score + Math.round(10 * this.scoreMultiplier));
            this.timeLeft = Math.min(this.maxTime, this.timeLeft + this.timeBonus);
            document.getElementById('timeLeft').textContent = this.timeLeft;
            const percentage = (this.timeLeft / this.maxTime) * 100;
            this.timeBar.style.width = percentage + '%';
            setTimeout(() => this.generateEquation(), 1000);
        } else {
            audioManager.play('incorrect');
            this.showFeedback(false, `Try again! The answer was ${this.currentAnswer}`);
            this.timeLeft = Math.max(0, this.timeLeft - this.timePenalty);
            document.getElementById('timeLeft').textContent = this.timeLeft;
            const percentage = (this.timeLeft / this.maxTime) * 100;
            this.timeBar.style.width = percentage + '%';
            setTimeout(() => this.generateEquation(), 2000);
        }
    }

    updateScore(newScore) {
        this.score = newScore;
        document.getElementById('score').textContent = this.score;
        if (window.updateGameScore) {
            window.updateGameScore('algebraAdventure', this.score);
        }
    }

    endGame() {
        this.gameActive = false;
        audioManager.play('gameOver');
        
        this.equationDisplay.textContent = 'Game Over!';
        this.feedbackDiv.textContent = `Final Score: ${this.score}`;
        this.feedbackDiv.className = 'feedback';
        
        this.answerInput.disabled = true;
        this.submitButton.disabled = true;
        
        // Disable number pad
        const buttons = this.numberPad.getElementsByClassName('number-button');
        for (let button of buttons) {
            button.disabled = true;
        }
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AlgebraAdventure();
});