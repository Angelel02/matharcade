// Game settings and scores management
window.gameSettings = {
    currentDifficulty: 'normal',
    difficulties: {
        easy: { timeLimit: 90, timeBonus: 5, timePenalty: 2, scoreMultiplier: 1 },
        normal: { timeLimit: 60, timeBonus: 3, timePenalty: 3, scoreMultiplier: 1.5 },
        hard: { timeLimit: 45, timeBonus: 2, timePenalty: 4, scoreMultiplier: 2 }
    }
};

const gameScores = {
    fractionFrenzy: 0,
    decimalDrop: 0,
    algebraAdventure: 0
};

// High scores management
const highScores = {
    fractionFrenzy: [],
    decimalDrop: [],
    algebraAdventure: []
};

function loadScores() {
    const savedScores = localStorage.getItem('mathArcadeScores');
    const savedHighScores = localStorage.getItem('mathArcadeHighScores');
    const savedSettings = localStorage.getItem('mathArcadeSettings');
    
    if (savedScores) {
        Object.assign(gameScores, JSON.parse(savedScores));
        updateTotalScore();
    }
    
    if (savedHighScores) {
        Object.assign(highScores, JSON.parse(savedHighScores));
        updateHighScoresDisplay();
    }
    
    if (savedSettings) {
        Object.assign(gameSettings, JSON.parse(savedSettings));
        const difficultySelect = document.getElementById('difficultySelect');
        if (difficultySelect) {
            difficultySelect.value = gameSettings.currentDifficulty;
        }
    }
}

function saveScores() {
    localStorage.setItem('mathArcadeScores', JSON.stringify(gameScores));
    localStorage.setItem('mathArcadeHighScores', JSON.stringify(highScores));
    localStorage.setItem('mathArcadeSettings', JSON.stringify(gameSettings));
}

function updateHighScore(game, score) {
    highScores[game].push({
        score: Math.round(score * gameSettings.difficulties[gameSettings.currentDifficulty].scoreMultiplier),
        difficulty: gameSettings.currentDifficulty,
        date: new Date().toLocaleDateString()
    });
    
    // Sort and keep only top 5 scores
    highScores[game].sort((a, b) => b.score - a.score);
    highScores[game] = highScores[game].slice(0, 5);
    
    saveScores();
    updateHighScoresDisplay();
}

function updateHighScoresDisplay() {
    const container = document.getElementById('highScores');
    if (!container) return;
    
    container.innerHTML = '';
    Object.entries(highScores).forEach(([game, scores]) => {
        const gameSection = document.createElement('div');
        gameSection.className = 'high-score-section';
        gameSection.innerHTML = `
            <h3>${formatGameName(game)}</h3>
            <ul>
                ${scores.map(score => `
                    <li>${score.score} points (${score.difficulty}) - ${score.date}</li>
                `).join('')}
            </ul>
        `;
        container.appendChild(gameSection);
    });
}

function formatGameName(gameName) {
    // Split the camelCase into words and capitalize each word
    return gameName
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function updateTotalScore() {
    const totalScore = Object.values(gameScores).reduce((a, b) => a + b, 0);
    const totalScoreElement = document.getElementById('totalScore');
    if (totalScoreElement) {
        totalScoreElement.textContent = totalScore;
    }
}

// Handle difficulty changes
document.addEventListener('DOMContentLoaded', () => {
    const difficultySelect = document.getElementById('difficultySelect');
    if (difficultySelect) {
        difficultySelect.addEventListener('change', (e) => {
            gameSettings.currentDifficulty = e.target.value;
            saveScores();
        });
    }
    loadScores();
});

// Export functions and settings for use in mini-games
window.updateGameScore = function(game, score) {
    gameScores[game] = score;
    updateHighScore(game, score);
    saveScores();
    updateTotalScore();
};

window.getGameSettings = function() {
    return window.gameSettings.difficulties[window.gameSettings.currentDifficulty];
};