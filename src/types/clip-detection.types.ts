export interface ClipDetectionResponse {
  clips: DetectedClip[];
}

export interface DetectedClip {
  title: string;
  hook: string;
  start_time: string;  // "MM:SS"
  end_time: string;    // "MM:SS"
  transcript_excerpt: string;
  viral_score: number; // 1-10
  category: "insight" | "funny" | "controversial" | "emotional" | "story" | "advice";
}
