import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface VisualizerOrbProps {
  audioUrl: string;
  currentTime: number;
  accentColor: string;
}

export const VisualizerOrb: React.FC<VisualizerOrbProps> = ({
  currentTime,
  accentColor,
}) => {
  const frame = useCurrentFrame();

  // Enhanced audio simulation - similar to waveform logic
  const getOrbIntensity = () => {
    // Multiple sine waves for realistic pulsing
    const wave1 = Math.sin(frame / 8);
    const wave2 = Math.sin(frame / 12);
    const wave3 = Math.sin(frame / 6);
    const bass = Math.sin(frame / 20);

    // Peak moments for impact
    const peakFrequency = Math.sin(frame / 30);
    const isPeakMoment = peakFrequency > 0.7;
    const peakBoost = isPeakMoment ? 0.3 : 0;

    // Combine waves
    const combined =
      (wave1 * 0.35) +
      (wave2 * 0.25) +
      (wave3 * 0.2) +
      (bass * 0.2) +
      peakBoost;

    return combined;
  };

  const intensity = getOrbIntensity();

  // Map intensity to scale (0.85 to 1.15)
  const scale = interpolate(intensity, [-1, 1], [0.85, 1.15]);

  // Map intensity to opacity (0.7 to 1.0)
  const pulseOpacity = interpolate(intensity, [-1, 1], [0.7, 1.0]);

  // Map intensity to glow size (60 to 120)
  const glowSize = interpolate(intensity, [-1, 1], [60, 120]);

  return (
    <div
      style={{
        position: "relative",
        width: "400px",
        height: "400px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Outer glow layers */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
          filter: `blur(${glowSize}px)`,
          transform: `scale(${scale * 1.3})`,
          opacity: pulseOpacity * 0.6,
        }}
      />

      {/* Middle glow */}
      <div
        style={{
          position: "absolute",
          width: "80%",
          height: "80%",
          borderRadius: "50%",
          background: `radial-gradient(circle, #8b7fff40 0%, transparent 70%)`,
          filter: `blur(${glowSize * 0.7}px)`,
          transform: `scale(${scale * 1.15})`,
          opacity: pulseOpacity * 0.7,
        }}
      />

      {/* Core orb - blue to purple gradient */}
      <div
        style={{
          position: "absolute",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: `radial-gradient(circle at 30% 30%, #6c63ff 0%, #b24bf3 50%, #6c63ff 100%)`,
          transform: `scale(${scale})`,
          opacity: pulseOpacity,
          boxShadow: `
            0 0 ${glowSize * 0.5}px ${accentColor}80,
            0 0 ${glowSize}px ${accentColor}40,
            inset 0 0 60px rgba(255, 255, 255, 0.1)
          `,
        }}
      />

      {/* Inner highlight for depth */}
      <div
        style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.3) 0%, transparent 60%)`,
          transform: `scale(${scale})`,
          opacity: pulseOpacity * 0.8,
        }}
      />
    </div>
  );
};
