import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface AnimatedBackgroundProps {
  accentColor: string;
  secondaryColor?: string;
}

/**
 * Derives a lighter secondary color from the accent color
 * Lightens by approximately 15-20% for gradient harmony
 */
const deriveSecondaryColor = (accentColor: string): string => {
  // Simple lightening: if hex color, increase RGB values
  // For default purple #6c63ff, this becomes approximately #8b7fff

  // If color is already provided, use it
  if (!accentColor.startsWith('#')) return accentColor;

  // Parse hex color
  const hex = accentColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Lighten by 20% (move 20% closer to white)
  const lighten = (value: number) => Math.min(255, Math.round(value + (255 - value) * 0.2));

  const newR = lighten(r);
  const newG = lighten(g);
  const newB = lighten(b);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  accentColor,
  secondaryColor,
}) => {
  const frame = useCurrentFrame();

  // Derive secondary color if not provided
  const derivedSecondary = secondaryColor || deriveSecondaryColor(accentColor);

  // Slow animation loop (600 frames = 20 seconds at 30fps) - subtle color shift
  const animationProgress = (frame % 600) / 600;

  // Animate gradient positions in a slow circular motion (minimal movement)
  const gradient1X = interpolate(animationProgress, [0, 0.5, 1], [20, 23, 20]);
  const gradient1Y = interpolate(animationProgress, [0, 0.5, 1], [30, 33, 30]);

  const gradient2X = interpolate(animationProgress, [0, 0.5, 1], [80, 77, 80]);
  const gradient2Y = interpolate(animationProgress, [0, 0.5, 1], [70, 67, 70]);

  return (
    <AbsoluteFill>
      {/* Base dark gradient - subtle blue to purple shift */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)",
        }}
      />

      {/* Animated accent gradient overlay 1 - very subtle */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at ${gradient1X}% ${gradient1Y}%, ${accentColor}20 0%, transparent 60%)`,
          opacity: 0.8,
        }}
      />

      {/* Animated secondary gradient overlay 2 - very subtle */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at ${gradient2X}% ${gradient2Y}%, ${derivedSecondary}15 0%, transparent 60%)`,
          opacity: 0.8,
        }}
      />
    </AbsoluteFill>
  );
};
