import { z } from "zod";

export const TranscriptWordSchema = z.object({
  word: z.string(),
  start: z.number(), // seconds
  end: z.number(), // seconds
  speaker: z.number().optional(),
});

export type TranscriptWord = z.infer<typeof TranscriptWordSchema>;

export const PodcastClipPropsSchema = z.object({
  clipTitle: z.string(),
  audioUrl: z.string(),
  transcript: z.array(TranscriptWordSchema),
  startTime: z.number(), // seconds
  endTime: z.number(), // seconds
  backgroundColor: z.string().optional().default("#1a1a2e"),
  accentColor: z.string().optional().default("#6c63ff"),
  // Phase 3.5 enhancements
  secondaryColor: z.string().optional(), // Auto-derived from accent if not provided
  showProgress: z.boolean().optional().default(true),
  showTimestamp: z.boolean().optional().default(false),
});

export type PodcastClipProps = z.infer<typeof PodcastClipPropsSchema>;
