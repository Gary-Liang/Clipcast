import React from "react";
import { AbsoluteFill } from "remotion";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  accentColor: string;
  secondaryColor?: string;
}

/**
 * Progress bar component that shows video playback progress
 * Renders at the bottom of the frame (bottom 2%)
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  accentColor,
  secondaryColor,
}) => {
  // Calculate progress percentage (0-100)
  const progress = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "12px",
        pointerEvents: "none",
        zIndex: 100, // Ensure it's on top
      }}
    >
      {/* Background track - dark for high contrast */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "12px",
          backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark background for contrast
        }}
      />

      {/* Progress fill - bright cyan/teal for brand visibility */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "12px",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #14B8A6 0%, #06B6D4 100%)", // Teal to cyan gradient
          opacity: 1.0,
          boxShadow: "0 0 12px rgba(20, 184, 166, 0.8)", // Glowing teal shadow
        }}
      />
    </div>
  );
};
