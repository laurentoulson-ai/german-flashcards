// Level selection page logic
document.addEventListener('DOMContentLoaded', async function() {
    const chapterNumber = parseInt(localStorage.getItem('selectedChapter')) || 1;
    await loadChapterData(chapterNumber);
    setupEventListeners();
});

async function loadChapterData(chapterNumber) {
    // Load chapter data
    const chapter = flashcardData.chapters[chapterNumber - 1] || 
                   await flashcardData.loadChapter(chapterNumber);
    
    if (!chapter) return;
    
    // Update UI with chapter info
    document.getElementById('chapterTitle').textContent = chapter.title || `Chapter ${chapterNumber}`;
    document.getElementById('chapterSubtitle').textContent = `Choose your learning mode`;
    
    // Set chapter image
    const imageContainer = document.getElementById('chapterImage');
    const imageUrl = chapter.words.length > 0 && chapter.image ? 
                    chapter.image : 'data/images/placeholder.jpg';
    imageContainer.style.backgroundImage = `url('${imageUrl}')`;
    
    // Initialize progress for this chapter
    flashcardData.initChapterProgress(chapterNumber, chapter.words.length);
    const progress = flashcardData.progress.chapters[chapterNumber];
    
    // Update statistics
    document.getElementById('wordsToLearn').textContent = progress.wordsToLearn.length;
    document.getElementById('learnedWords').textContent = progress.learnedWords.length;
    document.getElementById('masteredWords').textContent = progress.strongestWords.length;
    document.getElementById('totalWords').textContent = chapter.words.length;
    
    // Update level counts
    document.getElementById('level1Count').textContent = progress.wordsToLearn.length + progress.learnedWords.length;
    document.getElementById('level2Count').textContent = progress.learnedWords.length + progress.strongestWords.length;
    document.getElementById('level3Count').textContent = progress.strongestWords.length;
    
    // Store chapter data for game session
    localStorage.setItem('currentChapter', chapterNumber);
    localStorage.setItem('chapterData', JSON.stringify(chapter));
}

function setupEventListeners() {
    // Card count input
    const cardCountInput = document.getElementById('cardCount');
    cardCountInput.addEventListener('change', function() {
        const max = parseInt(document.getElementById('totalWords').textContent);
        if (this.value > max) this.value = max;
        if (this.value < 1) this.value = 1;
    });
    
    // Back button
    document.querySelector('.back-btn').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
    });
}

function changeCardCount(amount) {
    const input = document.getElementById('cardCount');
    const max = parseInt(document.getElementById('totalWords').textContent);
    let newValue = parseInt(input.value) + amount;
    
    if (newValue < 1) newValue = 1;
    if (newValue > max) newValue = max;
    
    input.value = newValue;
}

function startLevel(level) {
    const chapterNumber = parseInt(localStorage.getItem('currentChapter'));
    const cardCount = parseInt(document.getElementById('cardCount').value);
    
    // For level 1, get the session mode
    let sessionMode = 'mix';
    if (level === 1) {
        sessionMode = document.getElementById('sessionMode').value;
    }
    
    // Store session settings
    localStorage.setItem('gameLevel', level);
    localStorage.setItem('cardCount', cardCount);
    localStorage.setItem('sessionMode', sessionMode);
    
    // Navigate to game
    window.location.href = 'game.html';
}