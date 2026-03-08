import React, { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { TranscriptWord } from "../types";

interface AnimatedCaptionsProps {
  transcript: TranscriptWord[];
  currentTime: number;
  accentColor: string;
}

interface CaptionPhrase {
  words: TranscriptWord[];
  text: string;
  startTime: number;
  endTime: number;
}

export const AnimatedCaptions: React.FC<AnimatedCaptionsProps> = ({
  transcript,
  currentTime,
  accentColor,
}) => {
  const { fps } = useVideoConfig();

  // Helper function to estimate text width (rough approximation)
  // Using average character widths for uppercase, bold, 80px font
  const estimateTextWidth = (text: string): number => {
    // Rough estimates based on typical font metrics:
    // Uppercase bold at 80px: average ~60px per character
    // Add 0.3em spacing between words (~24px per space)
    const charWidth = 60; // pixels per character (scaled from 64px to 80px)
    const spaceWidth = 24; // pixels per space (0.3em at 80px)

    const chars = text.length;
    const spaces = (text.match(/ /g) || []).length;

    return (chars * charWidth) + (spaces * spaceWidth);
  };

  // Group words into phrases that FIT ON SCREEN (max 70% width for better centering)
  const phrases = useMemo(() => {
    const result: CaptionPhrase[] = [];
    const maxWidth = 756; // 70% of 1080px screen width (was 80%)

    // Get the clip's start time from the first word
    const clipStartTime = transcript.length > 0 ? transcript[0].start : 0;

    let currentPhrase: TranscriptWord[] = [];

    for (let i = 0; i < transcript.length; i++) {
      const word = transcript[i];

      // Test if adding this word would exceed width limit
      const testPhrase = [...currentPhrase, word];
      const testText = testPhrase.map(w => w.word).join(" ");
      const testWidth = estimateTextWidth(testText);

      // Break conditions:
      // 1. Width exceeds limit (PRIORITY)
      // 2. Last word in transcript
      // 3. Phrase has 5+ words (safety limit)
      const isLastWord = i === transcript.length - 1;
      const exceedsWidth = testWidth > maxWidth;
      const exceedsLength = testPhrase.length >= 5;

      if (exceedsWidth || (isLastWord && currentPhrase.length === 0)) {
        // Width exceeded - save current phrase and start new one with this word
        if (currentPhrase.length > 0) {
          result.push({
            words: [...currentPhrase],
            text: currentPhrase.map(w => w.word).join(" "),
            startTime: currentPhrase[0].start - clipStartTime,
            endTime: currentPhrase[currentPhrase.length - 1].end - clipStartTime,
          });
        }
        currentPhrase = [word]; // Start new phrase with current word

        // If this is the last word, push it as a single-word phrase
        if (isLastWord) {
          result.push({
            words: [word],
            text: word.word,
            startTime: word.start - clipStartTime,
            endTime: word.end - clipStartTime,
          });
          currentPhrase = [];
        }
      } else if (isLastWord) {
        // Last word and fits - add to current phrase and save
        currentPhrase.push(word);
        result.push({
          words: [...currentPhrase],
          text: currentPhrase.map(w => w.word).join(" "),
          startTime: currentPhrase[0].start - clipStartTime,
          endTime: currentPhrase[currentPhrase.length - 1].end - clipStartTime,
        });
        currentPhrase = [];
      } else if (exceedsLength) {
        // Safety: too many words - break here
        currentPhrase.push(word);
        result.push({
          words: [...currentPhrase],
          text: currentPhrase.map(w => w.word).join(" "),
          startTime: currentPhrase[0].start - clipStartTime,
          endTime: currentPhrase[currentPhrase.length - 1].end - clipStartTime,
        });
        currentPhrase = [];
      } else {
        // Fits - add word to current phrase
        currentPhrase.push(word);
      }
    }

    return result;
  }, [transcript]);

  // Convert absolute currentTime to relative time within the clip
  const clipStartTime = transcript.length > 0 ? transcript[0].start : 0;
  const relativeTime = currentTime - clipStartTime;

  // Find current phrase (ONE phrase at a time)
  let currentPhraseIndex = phrases.findIndex(
    (phrase) => relativeTime >= phrase.startTime && relativeTime <= phrase.endTime
  );

  // FIX: If no current phrase (gap between phrases), show the previous phrase
  // This prevents the caption box from disappearing
  if (currentPhraseIndex === -1) {
    // Find the most recent phrase that has ended
    const previousPhraseIndex = phrases.findIndex(
      (phrase, idx) => {
        const nextPhrase = phrases[idx + 1];
        return (
          relativeTime > phrase.endTime &&
          (!nextPhrase || relativeTime < nextPhrase.startTime)
        );
      }
    );

    // If we found a previous phrase, use it; otherwise use the last phrase
    if (previousPhraseIndex !== -1) {
      currentPhraseIndex = previousPhraseIndex;
    } else if (phrases.length > 0) {
      // Fallback: if we're before the first phrase, show it; if after all, show the last
      if (relativeTime < phrases[0].startTime) {
        currentPhraseIndex = 0;
      } else {
        currentPhraseIndex = phrases.length - 1;
      }
    } else {
      // No phrases at all
      return null;
    }
  }

  const currentPhrase = phrases[currentPhraseIndex];

  // Find current word within phrase for highlighting
  let currentWordIndex = currentPhrase.words.findIndex(
    (word) => relativeTime >= (word.start - clipStartTime) && relativeTime < (word.end - clipStartTime)
  );

  // If no word matches (gap between words or at phrase end), use the closest word
  if (currentWordIndex === -1) {
    // Find the last word that has started
    for (let i = currentPhrase.words.length - 1; i >= 0; i--) {
      if (relativeTime >= (currentPhrase.words[i].start - clipStartTime)) {
        currentWordIndex = i;
        break;
      }
    }
    // If still no match, use first word (we're before the phrase starts)
    if (currentWordIndex === -1) {
      currentWordIndex = 0;
    }
  }

  // Get current word for pop animation
  const currentWord = currentWordIndex >= 0 ? currentPhrase.words[currentWordIndex] : null;

  // Keep caption box ALWAYS visible - no fade animations
  // This prevents flickering/disappearing during phrase transitions
  const opacity = 1.0;
  const scale = 1.0;

  // Still need relativeFrame for word pop animation
  const relativeFrame = relativeTime * fps;

  // Centered captions: ONE phrase at a time, BIG and BOLD
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.6)", // More subtle background
          padding: "32px 64px",
          borderRadius: "20px",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
          maxWidth: "85%", // Fill more of the screen width
          textAlign: "center",
          overflow: "visible",
        }}
      >
        {/* Single phrase - pre-computed to fit on screen */}
        <div
          style={{
            fontSize: 80, // Larger - was 64px
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "0.01em",
            lineHeight: 1.15,
            whiteSpace: "normal",
            wordBreak: "keep-all",
            overflowWrap: "normal",
            display: "block",
          }}
        >
          {currentPhrase.words.map((word, idx) => {
            const isCurrentWord = idx === currentWordIndex;

            // Phase 3.7: Word pop animation - current word scales 1.0 → 1.1 → 1.0
            let wordScale = 1.0;
            if (isCurrentWord && currentWord) {
              const wordStartFrame = (currentWord.start - clipStartTime) * fps;
              const wordDuration = (currentWord.end - currentWord.start) * fps;
              const popDuration = Math.min(5, wordDuration * 0.3); // 30% of word duration or 5 frames

              wordScale = interpolate(
                relativeFrame,
                [wordStartFrame, wordStartFrame + popDuration, wordStartFrame + popDuration * 2],
                [1.0, 1.1, 1.0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
            }

            return (
              <span
                key={`${currentPhraseIndex}-${idx}-${word.word}`}
                style={{
                  color: isCurrentWord ? "#FFFFFF" : "#888888", // White for current, gray for others
                  opacity: isCurrentWord ? 1.0 : 1.0, // Both full opacity (gray color handles dimming)
                  textShadow: "0 4px 12px rgba(0,0,0,0.8)", // Simple shadow for readability
                  display: "inline-block", // Changed to inline-block for transform to work
                  marginRight: "0.5em", // Increased space between words for better readability
                  transform: `scale(${wordScale})`,
                  transformOrigin: "center center",
                }}
              >
                {word.word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
