// Main app initialization for index.html
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize data
    await flashcardData.loadAllChapters();
    displayChapters();
    updateProgressSummary();
    
    // Set up export/import buttons
    document.getElementById('exportBtn').addEventListener('click', function() {
        flashcardData.exportProgress();
    });
    
    document.getElementById('importBtn').addEventListener('click', function() {
        document.getElementById('importFile').click();
    });
    
    document.getElementById('importFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const success = flashcardData.importProgress(event.target.result);
            if (success) {
                alert('Progress imported successfully!');
                location.reload();
            } else {
                alert('Failed to import progress. Please check the file format.');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    });
});

// Display all chapters in the grid
function displayChapters() {
    const container = document.getElementById('chaptersContainer');
    container.innerHTML = '';
    
    flashcardData.chapters.forEach((chapter, index) => {
        const chapterNumber = index + 1;
        const progress = flashcardData.progress.chapters[chapterNumber] || {
            wordsToLearn: Array.from({length: chapter.words.length}, (_, i) => i),
            learnedWords: [],
            strongestWords: []
        };
        
        const wordsToLearnCount = progress.wordsToLearn.length;
        const learnedWordsCount = progress.learnedWords.length;
        
        const chapterCard = document.createElement('div');
        chapterCard.className = 'chapter-card';
        chapterCard.onclick = () => selectChapter(chapterNumber);
        
        // Check if chapter has content
        const hasContent = chapter.words.length > 0;
        const imageUrl = hasContent && chapter.image ? chapter.image : 'data/images/placeholder.jpg';
        
        chapterCard.innerHTML = `
            <div class="chapter-image" style="background-image: url('${imageUrl}')">
                <div class="chapter-number">${chapterNumber}</div>
                ${!hasContent ? '<div class="placeholder-overlay"><i class="fas fa-clock"></i> Coming Soon</div>' : ''}
            </div>
            <div class="chapter-info">
                <h3 class="chapter-title">${chapter.title || `Chapter ${chapterNumber}`}</h3>
                <div class="chapter-stats">
                    <div class="stat">
                        <i class="fas fa-book"></i>
                        <span>To Learn: ${wordsToLearnCount}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-check-circle"></i>
                        <span>Learned: ${learnedWordsCount}</span>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(chapterCard);
    });
}

// Navigate to level selection for a chapter
function selectChapter(chapterNumber) {
    const chapter = flashcardData.chapters[chapterNumber - 1];
    if (!chapter) return;
    
    // Initialize progress for this chapter if needed
    flashcardData.initChapterProgress(chapterNumber, chapter.words.length);
    
    // Store selected chapter
    localStorage.setItem('selectedChapter', chapterNumber);
    window.location.href = 'level-select.html';
}

// Update the progress summary at the bottom
function updateProgressSummary() {
    document.getElementById('totalWords').textContent = flashcardData.progress.stats.totalWords;
    document.getElementById('learnedWords').textContent = flashcardData.progress.stats.learnedWords;
    document.getElementById('chaptersCount').textContent = 
        `${flashcardData.chapters.filter(c => c.words.length > 0).length}/17`;
}