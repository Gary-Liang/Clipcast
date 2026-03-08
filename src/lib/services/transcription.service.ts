import { createClient } from "@deepgram/sdk";
import logger from "@/utils/logger";
import { TranscriptionError } from "@/utils/errors";
import {
  DeepgramResult,
  TranscriptionResult,
  DeepgramUtterance,
} from "@/types/transcription.types";

class TranscriptionService {
  private deepgram;

  constructor() {
    if (!process.env.DEEPGRAM_API_KEY) {
      throw new Error("DEEPGRAM_API_KEY is not set in environment variables");
    }

    this.deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    logger.info("Transcription service initialized with Deepgram");
  }

  /**
   * Transcribe audio from URL using Deepgram
   * @param audioUrl - Presigned URL to the audio file
   * @param jobId - Job ID for logging
   * @returns Transcription result with formatted transcript
   */
  async transcribeFromUrl(
    audioUrl: string,
    jobId: string
  ): Promise<TranscriptionResult> {
    try {
      logger.info({ jobId }, "Starting transcription with Deepgram");

      const { result, error } = await this.deepgram.listen.prerecorded.transcribeUrl(
        { url: audioUrl },
        {
          model: "nova-2",
          smart_format: true,
          punctuate: true,
          paragraphs: true,
          utterances: true,
          diarize: true, // Speaker detection
          language: "en-US",
        }
      );

      if (error) {
        throw new TranscriptionError(`Deepgram API error: ${error.message}`);
      }

      if (!result) {
        throw new TranscriptionError("No result returned from Deepgram");
      }

      logger.info({ jobId, duration: result.metadata?.duration }, "Transcription completed");

      return this.processDeepgramResult(result as DeepgramResult);
    } catch (error) {
      logger.error({ error, jobId }, "Transcription failed");
      throw new TranscriptionError(
        "Failed to transcribe audio",
        error as Error
      );
    }
  }

  /**
   * Transcribe with retry logic (exponential backoff)
   * @param audioUrl - Presigned URL to the audio file
   * @param jobId - Job ID for logging
   * @param maxRetries - Maximum number of retry attempts
   * @returns Transcription result
   */
  async transcribeWithRetry(
    audioUrl: string,
    jobId: string,
    maxRetries: number = 3
  ): Promise<TranscriptionResult> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.transcribeFromUrl(audioUrl, jobId);
      } catch (error) {
        lastError = error as Error;
        logger.warn(
          { jobId, attempt, maxRetries, error: (error as Error).message },
          `Transcription attempt ${attempt}/${maxRetries} failed`
        );

        if (attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, attempt) * 1000;
          logger.info({ jobId, delay }, `Retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new TranscriptionError(
      `Failed after ${maxRetries} attempts: ${lastError!.message}`,
      lastError!
    );
  }

  /**
   * Process Deepgram result and format transcript
   * @param result - Raw Deepgram API result
   * @returns Processed transcription result
   */
  private processDeepgramResult(result: DeepgramResult): TranscriptionResult {
    const utterances = result.results.utterances || [];
    const words = result.results.channels[0]?.alternatives[0]?.words || [];
    const rawTranscript = result.results.channels[0]?.alternatives[0]?.transcript || "";
    const duration = result.metadata.duration;

    const formattedTranscript = this.formatTranscriptForClipDetection(utterances);

    return {
      formattedTranscript,
      rawTranscript,
      duration,
      utterances,
      words,
    };
  }

  /**
   * Format transcript for AI clip detection
   * Format: [HH:MM:SS] Speaker N: "text"
   * @param utterances - Deepgram utterances with speaker diarization
   * @returns Formatted transcript string
   */
  private formatTranscriptForClipDetection(
    utterances: DeepgramUtterance[]
  ): string {
    return utterances
      .map((utterance) => {
        const timestamp = this.formatTimestamp(utterance.start);
        // Convert 0-based speaker index to 1-based for user-friendly display
        const speaker = `Speaker ${(utterance.speaker ?? 0) + 1}`;
        const text = utterance.transcript;

        return `[${timestamp}] ${speaker}: "${text}"`;
      })
      .join("\n\n");
  }

  /**
   * Format seconds to HH:MM:SS
   * @param seconds - Time in seconds
   * @returns Formatted timestamp string
   */
  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();
export default transcriptionService;
