import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface WaveformProps {
  audioUrl: string;
  currentTime: number;
  accentColor: string;
}

export const Waveform: React.FC<WaveformProps> = ({
  currentTime,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Number of bars in the waveform
  const barCount = 60;
  const bars = Array.from({ length: barCount }, (_, i) => i);

  // Enhanced dynamic waveform simulation with more realistic variation
  const getBarHeight = (index: number) => {
    // Create multiple sine waves with varying frequencies for realistic audio feel
    const wave1 = Math.sin((frame + index * 3) / 8);      // Primary mid frequency
    const wave2 = Math.sin((frame + index * 2) / 12);     // Secondary mid frequency
    const wave3 = Math.sin((frame + index * 5) / 6);      // High frequency
    const bass = Math.sin((frame + index) / 20);          // Bass (slower)
    const variation = Math.sin((frame + index * 7) / 15); // Random variation

    // Add peak moments - occasional spikes for impact
    const peakFrequency = Math.sin(frame / 30);
    const isPeakMoment = peakFrequency > 0.7 && index % 8 === 0;
    const peakBoost = isPeakMoment ? 0.4 : 0;

    // Combine waves with weighted distribution + peak boost
    const combined =
      (wave1 * 0.35) +
      (wave2 * 0.25) +
      (wave3 * 0.15) +
      (bass * 0.15) +
      (variation * 0.1) +
      peakBoost;

    // Map to height range (30-180 pixels) - smaller for supporting role
    const height = interpolate(combined, [-1, 1], [30, 180]);

    return height;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: "5px",
        height: "200px", // Reduced from 300px - supporting element
      }}
    >
      {bars.map((index) => {
        const height = getBarHeight(index);
        const isCenter = index >= barCount / 2 - 5 && index <= barCount / 2 + 5;

        // Calculate opacity and glow based on bar height for more dynamic effect
        const heightRatio = (height - 40) / (220 - 40); // Normalize to 0-1
        const opacity = 0.4 + (heightRatio * 0.6); // Range: 0.4 to 1.0

        // Enhanced glow on peaks (taller bars get stronger glow)
        const isPeak = heightRatio > 0.7;
        const glowIntensity = isPeak ? heightRatio : 0.5;

        // Glow color - accent for center, white for sides
        const glowColor = isCenter ? accentColor : `rgba(255, 255, 255, ${glowIntensity})`;

        return (
          <div
            key={index}
            style={{
              width: "8px", // Slightly thinner bars
              height: `${height}px`,
              background: isCenter
                ? `linear-gradient(to top, ${accentColor}, ${accentColor}00)`
                : `linear-gradient(to top, rgba(255, 255, 255, ${opacity}), rgba(255, 255, 255, 0))`,
              borderRadius: "6px",
              transition: "all 0.1s ease",
              boxShadow: isPeak || isCenter
                ? `0 0 ${15 + glowIntensity * 20}px ${glowColor}, 0 0 ${30 + glowIntensity * 30}px ${glowColor}40`
                : "none",
            }}
          />
        );
      })}
    </div>
  );
};
