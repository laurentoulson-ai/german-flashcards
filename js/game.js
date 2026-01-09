// Game session logic
class GameSession {
    constructor() {
        this.currentCardIndex = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.sessionWords = [];
        this.answeredWords = new Map(); // word index -> isCorrect
        this.isFlipped = false;
        this.clueShown = false;
        
        // Get session settings
        this.chapterNumber = parseInt(localStorage.getItem('currentChapter')) || 1;
        this.level = parseInt(localStorage.getItem('gameLevel')) || 1;
        this.cardCount = parseInt(localStorage.getItem('cardCount')) || 10;
        this.sessionMode = localStorage.getItem('sessionMode') || 'mix';
        
        // Get chapter data
        const chapterData = JSON.parse(localStorage.getItem('chapterData'));
        this.chapterTitle = chapterData?.title || `Chapter ${this.chapterNumber}`;
        
        this.init();
    }
    
    async init() {
        await this.loadSessionWords();
        this.setupUI();
        this.displayCurrentCard();
        this.setupEventListeners();
        this.updateProgressDisplay();
    }
    
    async loadSessionWords() {
        this.sessionWords = flashcardData.getSessionWords(
            this.chapterNumber,
            this.level,
            this.cardCount,
            this.sessionMode
        );
        
        // Shuffle the words
        this.sessionWords = this.shuffleArray(this.sessionWords);
        
        // If no words available, show message
        if (this.sessionWords.length === 0) {
            this.showNoWordsMessage();
            return;
        }
    }
    
    setupUI() {
        // Set chapter title and level
        document.getElementById('gameChapter').textContent = this.chapterTitle;
        
        // Set level badge
        const levelBadge = document.getElementById('levelBadge');
        levelBadge.innerHTML = `
            <i class="fas fa-${this.getLevelIcon()}"></i>
            <span>Level ${this.level}</span>
        `;
        levelBadge.className = `level-badge level-${this.level}`;
        
        // Update total cards
        document.getElementById('totalCards').textContent = this.sessionWords.length;
        
        // Show/hide clue button based on level
        const clueBtn = document.getElementById('clueBtn');
        if (this.level === 2 || this.level === 3) {
            clueBtn.style.display = 'none';
        }
    }
    
    getLevelIcon() {
        switch(this.level) {
            case 1: return 'graduation-cap';
            case 2: return 'brain';
            case 3: return 'star';
            default: return 'question-circle';
        }
    }
    
    displayCurrentCard() {
        if (this.currentCardIndex >= this.sessionWords.length) {
            this.endSession();
            return;
        }
        
        const currentWord = this.sessionWords[this.currentCardIndex];
        this.clueShown = false;
        this.isFlipped = false;
        
        // Reset card to front
        document.getElementById('flashcard').classList.remove('flipped');
        document.getElementById('clueText').classList.remove('shown');
        document.getElementById('clueText').innerHTML = '';
        
        // Update card position
        document.getElementById('cardPosition').textContent = this.currentCardIndex + 1;
        
        // Set word based on level
        if (this.level === 1) {
            // Level 1: German word on front
            document.getElementById('currentWord').textContent = currentWord.german;
            document.getElementById('currentTranslation').textContent = currentWord.english;
            document.querySelector('.card-front .card-label').textContent = 'GERMAN';
            document.querySelector('.card-back .card-label').textContent = 'ENGLISH';
        } else if (this.level === 2) {
            // Level 2: English word on front
            document.getElementById('currentWord').textContent = currentWord.english;
            document.getElementById('currentTranslation').textContent = currentWord.german;
            document.querySelector('.card-front .card-label').textContent = 'ENGLISH';
            document.querySelector('.card-back .card-label').textContent = 'GERMAN';
        } else if (this.level === 3) {
            // Level 3: Sentence with blank on front
            const clue = currentWord.clue;
            const germanWord = currentWord.german;
            
            // Create sentence with blank (replace the word with _____)
            let sentenceWithBlank = clue;
            // Try to find and replace the German word in the clue
            const regex = new RegExp(`\\b${germanWord}\\b`, 'i');
            if (regex.test(clue)) {
                sentenceWithBlank = clue.replace(regex, '__________');
            } else {
                // If word not found in clue, just show the clue
                sentenceWithBlank = clue;
            }
            
            document.getElementById('currentWord').innerHTML = `
                <div class="sentence-blank">${sentenceWithBlank}</div>
            `;
            document.getElementById('currentTranslation').textContent = germanWord;
            document.querySelector('.card-front .card-label').textContent = 'COMPLETE THE SENTENCE';
            document.querySelector('.card-back .card-label').textContent = 'CORRECT WORD';
        }
        
        // Set clue text on back
        document.getElementById('backClueText').textContent = currentWord.clue;
        
        // Update hint text
        const hintText = document.getElementById('hintText');
        if (this.level === 1) {
            hintText.textContent = 'Tap to reveal translation';
        } else if (this.level === 2) {
            hintText.textContent = 'Tap to reveal German word';
        } else {
            hintText.textContent = 'Tap to reveal missing word';
        }
    }
    
    setupEventListeners() {
        // Flip card on click
        document.getElementById('flashcard').addEventListener('click', (e) => {
            if (!e.target.closest('.btn-clue')) {
                this.flipCard();
            }
        });
        
        // Flip button
        document.getElementById('flipBtn').addEventListener('click', () => this.flipCard());
        
        // Answer buttons
        document.getElementById('correctBtn').addEventListener('click', () => this.answerCard(true));
        document.getElementById('wrongBtn').addEventListener('click', () => this.answerCard(false));
        
        // Clue button
        document.getElementById('clueBtn').addEventListener('click', () => this.showClue());
        
        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to end this session? Your progress will be saved.')) {
                this.saveProgress();
                window.location.href = 'level-select.html';
            }
        });
        
        // Session complete modal buttons
        document.getElementById('practiceAgainBtn').addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('backToLevelsBtn').addEventListener('click', () => {
            window.location.href = 'level-select.html';
        });
        
        document.getElementById('backToChaptersBtn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    flipCard() {
        const flashcard = document.getElementById('flashcard');
        this.isFlipped = !this.isFlipped;
        flashcard.classList.toggle('flipped');
    }
    
    showClue() {
        if (this.clueShown || this.level !== 1) return;
        
        const currentWord = this.sessionWords[this.currentCardIndex];
        const clueText = document.getElementById('clueText');
        
        clueText.innerHTML = `
            <i class="fas fa-quote-left"></i>
            ${currentWord.clue}
            <i class="fas fa-quote-right"></i>
        `;
        clueText.classList.add('shown');
        this.clueShown = true;
    }
    
    answerCard(isCorrect) {
        const currentWord = this.sessionWords[this.currentCardIndex];
        
        // Record answer
        this.answeredWords.set(currentWord.index, isCorrect);
        
        // Update counters
        if (isCorrect) {
            this.correctAnswers++;
        } else {
            this.wrongAnswers++;
        }
        
        // Update progress display
        this.updateProgressDisplay();
        
        // Move to next card
        this.currentCardIndex++;
        
        // If there are more cards, display next one
        if (this.currentCardIndex < this.sessionWords.length) {
            setTimeout(() => {
                this.displayCurrentCard();
            }, 300);
        } else {
            // End session
            setTimeout(() => {
                this.endSession();
            }, 500);
        }
    }
    
    updateProgressDisplay() {
        const remaining = this.sessionWords.length - this.currentCardIndex;
        document.getElementById('cardsRemaining').textContent = remaining;
        document.getElementById('correctCount').textContent = this.correctAnswers;
        document.getElementById('wrongCount').textContent = this.wrongAnswers;
    }
    
    async endSession() {
        // Save progress for all answered words
        for (const [wordIndex, isCorrect] of this.answeredWords.entries()) {
            flashcardData.updateWordStatus(
                this.chapterNumber,
                wordIndex,
                this.level,
                isCorrect
            );
        }
        
        // Save to localStorage
        flashcardData.saveProgress();
        
        // Calculate results
        const totalCards = this.sessionWords.length;
        const accuracy = totalCards > 0 ? Math.round((this.correctAnswers / totalCards) * 100) : 0;
        
        // Update results modal
        document.getElementById('resultTotal').textContent = totalCards;
        document.getElementById('resultCorrect').textContent = this.correctAnswers;
        document.getElementById('resultWrong').textContent = this.wrongAnswers;
        document.getElementById('resultAccuracy').textContent = `${accuracy}%`;
        
        // Update progress text
        const progressText = document.getElementById('progressUpdateText');
        let updateText = '';
        
        if (this.level === 1) {
            const newLearned = Array.from(this.answeredWords.values()).filter(v => v).length;
            updateText = `You learned ${newLearned} new words!`;
        } else if (this.level === 2) {
            const mastered = Array.from(this.answeredWords.values()).filter(v => v).length;
            updateText = `You mastered ${mastered} words!`;
        } else {
            const strengthened = Array.from(this.answeredWords.values()).filter(v => v).length;
            updateText = `You strengthened ${strengthened} words!`;
        }
        
        progressText.textContent = updateText;
        
        // Show modal
        document.getElementById('sessionCompleteModal').style.display = 'flex';
    }
    
    saveProgress() {
        // Save any answered words before leaving
        for (const [wordIndex, isCorrect] of this.answeredWords.entries()) {
            flashcardData.updateWordStatus(
                this.chapterNumber,
                wordIndex,
                this.level,
                isCorrect
            );
        }
        flashcardData.saveProgress();
    }
    
    showNoWordsMessage() {
        document.querySelector('.flashcard-container').innerHTML = `
            <div class="no-words-message">
                <i class="fas fa-book-open"></i>
                <h3>No words available</h3>
                <p>There are no words available for this level and mode.</p>
                <button class="btn" onclick="window.location.href='level-select.html'">
                    <i class="fas fa-arrow-left"></i>
                    Back to Level Select
                </button>
            </div>
        `;
        document.querySelector('.answer-buttons').style.display = 'none';
    }
    
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gameSession = new GameSession();
});