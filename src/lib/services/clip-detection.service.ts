import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import logger from "@/utils/logger";
import { ClipDetectionError } from "@/utils/errors";
import {
  ClipDetectionResponse,
  DetectedClip,
} from "@/types/clip-detection.types";

class ClipDetectionService {
  private anthropic: Anthropic | null = null;
  private promptTemplate: string | null = null;

  constructor() {
    // Lazy initialization - don't throw during build time
  }

  private initialize() {
    if (this.anthropic && this.promptTemplate) {
      return; // Already initialized
    }

    // Validate ANTHROPIC_API_KEY
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set in environment variables");
    }

    // Initialize Anthropic client
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Load prompt template (cache it)
    try {
      const promptPath = join(process.cwd(), "clip detection prompt.md");
      this.promptTemplate = readFileSync(promptPath, "utf-8");
      logger.info("Clip detection service initialized with Claude Sonnet 4.5");
    } catch (error) {
      throw new Error(
        `Failed to load clip detection prompt: ${(error as Error).message}`
      );
    }
  }

  /**
   * Detect viral-worthy clips from a podcast transcript
   * @param transcript - Formatted transcript with timestamps
   * @param jobId - Job ID for logging
   * @returns Array of detected clips
   */
  async detectClips(
    transcript: string,
    jobId: string
  ): Promise<DetectedClip[]> {
    this.initialize(); // Lazy initialization

    try {
      logger.info({ jobId }, "Detecting clips with Claude Sonnet 4.5");

      // Replace {{TRANSCRIPT}} placeholder
      const prompt = this.promptTemplate.replace("{{TRANSCRIPT}}", transcript);

      // Call Claude API - using Sonnet 4.5 (enterprise)
      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: prompt + "\n\nIMPORTANT: Return ONLY valid JSON in the exact format specified. No additional text.",
          },
        ],
      });

      // Extract content from response
      const contentBlock = response.content[0];
      if (contentBlock.type !== "text") {
        throw new ClipDetectionError("Unexpected response format from Claude");
      }

      const content = contentBlock.text;
      if (!content) {
        throw new ClipDetectionError("Empty response from Claude");
      }

      logger.info({ jobId }, "Claude response received");

      // Parse JSON response
      let parsed: ClipDetectionResponse;
      try {
        // Try to extract JSON if it's wrapped in markdown code blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                          content.match(/```\s*([\s\S]*?)\s*```/);
        const jsonText = jsonMatch ? jsonMatch[1] : content;
        parsed = JSON.parse(jsonText) as ClipDetectionResponse;
      } catch (parseError) {
        logger.error({ jobId, content, parseError }, "Failed to parse Claude response");
        throw new ClipDetectionError("Invalid JSON response from Claude");
      }

      // Validate clips array exists
      if (!parsed.clips || !Array.isArray(parsed.clips)) {
        throw new ClipDetectionError("Response missing clips array");
      }

      if (parsed.clips.length === 0) {
        throw new ClipDetectionError("No clips detected in transcript");
      }

      // Limit to 5 clips maximum
      if (parsed.clips.length > 5) {
        logger.warn(
          { jobId, count: parsed.clips.length },
          "More than 5 clips returned, taking first 5"
        );
        parsed.clips = parsed.clips.slice(0, 5);
      }

      // Validate each clip
      parsed.clips.forEach((clip, index) => {
        if (!this.validateClip(clip)) {
          logger.error({ jobId, index, clip }, "Invalid clip detected");
          throw new ClipDetectionError(`Invalid clip at index ${index}`);
        }
      });

      logger.info(
        { jobId, clipCount: parsed.clips.length },
        "Clips detected successfully"
      );

      return parsed.clips;
    } catch (error) {
      if (error instanceof ClipDetectionError) {
        throw error;
      }

      // Handle Anthropic API errors
      if (error instanceof Error) {
        logger.error({ jobId, error: error.message }, "Claude API error");
        throw new ClipDetectionError(
          `Claude API error: ${error.message}`,
          error
        );
      }

      throw new ClipDetectionError("Unknown error during clip detection");
    }
  }

  /**
   * Detect clips with automatic retry logic
   * @param transcript - Formatted transcript with timestamps
   * @param jobId - Job ID for logging
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Array of detected clips
   */
  async detectClipsWithRetry(
    transcript: string,
    jobId: string,
    maxRetries: number = 3
  ): Promise<DetectedClip[]> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.detectClips(transcript, jobId);
      } catch (error) {
        lastError = error as Error;
        logger.warn(
          {
            jobId,
            attempt,
            maxRetries,
            error: (error as Error).message,
          },
          `Clip detection attempt ${attempt}/${maxRetries} failed`
        );

        // Don't retry on validation errors or configuration errors
        if (
          error instanceof ClipDetectionError &&
          (error.message.includes("ANTHROPIC_API_KEY") ||
            error.message.includes("Invalid clip"))
        ) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          logger.info({ jobId, delay }, `Retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new ClipDetectionError(
      `Failed after ${maxRetries} attempts: ${lastError!.message}`,
      lastError!
    );
  }

  /**
   * Validate a detected clip has all required fields
   * @param clip - Clip to validate
   * @returns true if valid, false otherwise
   */
  private validateClip(clip: any): boolean {
    // Check required string fields
    if (
      !clip.title ||
      typeof clip.title !== "string" ||
      !clip.hook ||
      typeof clip.hook !== "string" ||
      !clip.start_time ||
      typeof clip.start_time !== "string" ||
      !clip.end_time ||
      typeof clip.end_time !== "string"
    ) {
      return false;
    }

    // Validate timestamp format (MM:SS or HH:MM:SS, allows 3+ digit minutes for long podcasts)
    const timeRegex = /^\d+:\d{2}(:\d{2})?$/;
    if (!timeRegex.test(clip.start_time) || !timeRegex.test(clip.end_time)) {
      logger.warn(
        { start: clip.start_time, end: clip.end_time },
        "Invalid timestamp format"
      );
      return false;
    }

    // Validate viral score
    if (
      typeof clip.viral_score !== "number" ||
      clip.viral_score < 1 ||
      clip.viral_score > 10
    ) {
      logger.warn({ score: clip.viral_score }, "Invalid viral score");
      return false;
    }

    // Validate category
    const validCategories = [
      "insight",
      "funny",
      "controversial",
      "emotional",
      "story",
      "advice",
    ];
    if (!validCategories.includes(clip.category)) {
      logger.warn({ category: clip.category }, "Invalid category");
      return false;
    }

    // Validate end time is after start time
    const startSeconds = this.timeToSeconds(clip.start_time);
    const endSeconds = this.timeToSeconds(clip.end_time);
    if (endSeconds <= startSeconds) {
      logger.warn(
        { start: clip.start_time, end: clip.end_time },
        "End time must be after start time"
      );
      return false;
    }

    return true;
  }

  /**
   * Convert MM:SS or HH:MM:SS time string to seconds
   * @param timeString - Time in MM:SS or HH:MM:SS format
   * @returns Total seconds
   */
  private timeToSeconds(timeString: string): number {
    const parts = timeString.split(":").map(Number);

    if (parts.length === 2) {
      // MM:SS format
      const [minutes, seconds] = parts;
      return minutes * 60 + seconds;
    } else if (parts.length === 3) {
      // HH:MM:SS format
      const [hours, minutes, seconds] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    }

    return 0; // Invalid format
  }
}

// Export singleton instance
export default new ClipDetectionService();
