import React from "react";
import { Composition, registerRoot } from "remotion";
import { PodcastClip, PodcastClipSchema } from "./compositions/PodcastClip";
import type { TranscriptWord } from "./types";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PodcastClip"
        component={PodcastClip}
        durationInFrames={1800} // 60 seconds at 30fps (will be dynamic)
        fps={30}
        width={1080}
        height={1920}
        schema={PodcastClipSchema}
        defaultProps={{
          clipTitle: "Sample Podcast Clip",
          audioUrl: "",
          transcript: [] as TranscriptWord[],
          startTime: 0,
          endTime: 60,
          backgroundColor: "#1a1a2e",
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
