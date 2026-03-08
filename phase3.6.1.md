```
## CRITICAL FIX: Word Cutoff Issue

STOP. The captions are still cutting off words (showing "TH" instead of "THE" or "THAT").

This is NOT a CSS issue. This is a phrase generation issue.

### The Problem:
Phrases are being built without checking if they fit on screen. Words are getting truncated.

### The Solution:

STEP 1: Pre-compute phrases BEFORE rendering
- Take all words from transcript
- Group into phrases of 3-5 words max
- Each phrase must contain COMPLETE words only
- Store phrases in an array with start/end timestamps

STEP 2: Calculate text width BEFORE displaying
- For each phrase, measure its pixel width using the chosen font/size
- If phrase width > 80% of screen width (864px for 1080 wide), remove last word and start new phrase
- Repeat until all phrases fit

STEP 3: Display one phrase at a time
- Render current phrase, centered
- When timestamp passes, swap to next phrase
- No animation between phrases for now—just swap

### Pseudo-code:

function buildPhrases(words, maxWidth) {
  let phrases = [];
  let currentPhrase = [];
  
  for (let word of words) {
    let testPhrase = [...currentPhrase, word];
    let width = measureTextWidth(testPhrase.join(' '));
    
    if (width > maxWidth) {
      phrases.push(currentPhrase);
      currentPhrase = [word];
    } else {
      currentPhrase = testPhrase;
    }
  }
  
  if (currentPhrase.length > 0) {
    phrases.push(currentPhrase);
  }
  
  return phrases;
}

### DO NOT:
- Use CSS text-overflow
- Use CSS truncation
- Rely on word-wrap to fix this
- Display partial words ever

### Test:
Render video and pause at multiple frames. Every visible word must be COMPLETE. If any word is cut off, the logic is broken.
```