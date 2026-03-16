import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { z } from "zod";
import { PodcastClipPropsSchema } from "../types";
import { AnimatedCaptions } from "../components/AnimatedCaptions";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { ProgressBar } from "../components/ProgressBar";

export const PodcastClipSchema = PodcastClipPropsSchema;
export type PodcastClipProps = z.infer<typeof PodcastClipSchema>;

export const PodcastClip: React.FC<PodcastClipProps> = ({
  clipTitle,
  audioUrl,
  transcript,
  startTime,
  endTime,
  backgroundColor = "#1a1a2e",
  accentColor = "#6c63ff",
  secondaryColor,
  showProgress = true,
  showTimestamp = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate current time in seconds
  const currentTime = startTime + frame / fps;
  const duration = endTime - startTime;

  // Title animation: Keep title visible throughout entire video
  // Simple and effective - no flickering or disappearing
  const titleOpacity = 1.0;

  // Phase 3.7: Slow zoom effect - Scale from 1.0 to 1.05 over entire duration
  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });

  // Phase 3.7: Fade out at end - Last 0.5 seconds (15 frames at 30fps)
  const fadeOutStart = durationInFrames - 15;
  const fadeOutOpacity = interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* Animated Gradient Background */}
      <AnimatedBackground
        accentColor={accentColor}
        secondaryColor={secondaryColor}
      />

      {/* Audio */}
      {audioUrl && <Audio src={staticFile(audioUrl)} startFrom={Math.floor(startTime * fps)} />}

      {/* Content container with zoom and fade out effects */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          transform: `scale(${zoom})`,
          opacity: fadeOutOpacity,
        }}
      >
        {/* Clip Title - TOP 10% (show for 3 seconds, then fade out) */}
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: 0,
            right: 0,
            height: "10%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: titleOpacity,
          }}
        >
          <h1
            style={{
              color: "white",
              fontSize: 40,
              fontWeight: "bold",
              margin: 0,
              padding: "0 40px",
              textAlign: "center",
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            {clipTitle}
          </h1>
        </div>

        {/* Animated Captions - CENTER (40-70%) - THE STAR */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: 0,
            right: 0,
            height: "30%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatedCaptions
            transcript={transcript}
            currentTime={currentTime}
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* Progress Bar - BOTTOM (outside zoom/fade container for persistent visibility) */}
      {showProgress && (
        <ProgressBar
          currentTime={currentTime - startTime}
          duration={duration}
          accentColor={accentColor}
          secondaryColor={secondaryColor}
        />
      )}
    </AbsoluteFill>
  );
};
