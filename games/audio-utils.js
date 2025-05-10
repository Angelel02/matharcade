class AudioManager {
    constructor() {
        this.sounds = {
            correct: new Audio('../sounds/correct.mp3'),
            incorrect: new Audio('../sounds/incorrect.mp3'),
            gameOver: new Audio('../sounds/game-over.mp3'),
            click: new Audio('../sounds/click.mp3')
        };

        // Pre-load sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.5;
            sound.load();
        });
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => console.log('Audio playback failed:', e));
        }
    }
}

// Create singleton instance
const audioManager = new AudioManager();