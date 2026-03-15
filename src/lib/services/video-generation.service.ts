import path from "path";
import { unlink, writeFile } from "fs/promises";
import { spawn } from "child_process";
import https from "https";
import http from "http";
import { nanoid } from "nanoid";
import logger from "@/utils/logger";
import { storageService } from "./storage.service";
import { prisma } from "@/lib/db/client";
import type { TranscriptWord } from "@/remotion/types";

interface VideoGenerationParams {
  clipId: string;
  clipTitle: string;
  audioUrl: string;
  transcript: TranscriptWord[];
  startTime: number;
  endTime: number;
}

class VideoGenerationService {
  /**
   * Render video in a separate Node process to avoid webpack conflicts
   */
  private async renderInSeparateProcess(
    config: any,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // Write config to a temp file to avoid command-line argument length limits
    const configFileName = `render-config-${nanoid()}.json`;
    // Use /tmp in serverless (Vercel), public/temp-audio locally
    const tempDir = process.env.VERCEL ? '/tmp' : path.resolve(process.cwd(), "public", "temp-audio");
    const configFilePath = path.join(tempDir, configFileName);

    await writeFile(configFilePath, JSON.stringify(config), "utf-8");

    return new Promise((resolve, reject) => {
      // Add 10-minute timeout to prevent hung processes
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('Video rendering timed out after 10 minutes'));
      }, 10 * 60 * 1000);
      const scriptPath = path.resolve(process.cwd(), "scripts/render-video.mjs");

      const child = spawn("node", [scriptPath, configFilePath], {
        stdio: "pipe",
        cwd: process.cwd(),
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => {
        const output = data.toString();
        stdout += output;

        // Parse progress updates
        const lines = output.split("\n");
        for (const line of lines) {
          if (line.startsWith("PROGRESS:")) {
            const progress = parseInt(line.replace("PROGRESS:", "").trim(), 10);
            if (!isNaN(progress) && onProgress) {
              onProgress(progress);
            }
          }
        }

        logger.info({ output: output.trim() }, "Remotion render output");
      });

      child.stderr?.on("data", (data) => {
        const output = data.toString();
        stderr += output;
        logger.warn({ output: output.trim() }, "Remotion render stderr");
      });

      child.on("close", async (code) => {
        clearTimeout(timeout);

        // Clean up config file
        try {
          await unlink(configFilePath);
        } catch (err) {
          logger.warn({ configFilePath }, "Failed to delete config file");
        }

        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `Remotion render process exited with code ${code}\nStdout: ${stdout}\nStderr: ${stderr}`
            )
          );
        }
      });

      child.on("error", async (error) => {
        clearTimeout(timeout);

        // Clean up config file on error
        try {
          await unlink(configFilePath);
        } catch (err) {
          logger.warn({ configFilePath }, "Failed to delete config file");
        }
        reject(new Error(`Failed to start render process: ${error.message}`));
      });
    });
  }

  /**
   * Download a file from URL to local filesystem
   */
  private async downloadFile(url: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          const fileStream = require('fs').createWriteStream(outputPath);
          response.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close();
            resolve();
          });

          fileStream.on('error', (err: Error) => {
            unlink(outputPath).catch(() => {});
            reject(err);
          });
        } else {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        }
      }).on('error', reject);
    });
  }

  /**
   * Generate a video for a podcast clip
   * @param params - Video generation parameters
   * @returns URL to the generated video
   */
  async generateVideo(params: VideoGenerationParams): Promise<string> {
    const { clipId, clipTitle, audioUrl, transcript, startTime, endTime } = params;
    let localAudioPath: string | null = null;

    try {
      logger.info({ clipId }, "Starting video generation");

      // Download audio file to temp directory
      logger.info({ clipId }, "Downloading audio file locally...");
      // Use /tmp in serverless (Vercel), public/temp-audio locally
      const tempAudioDir = process.env.VERCEL ? '/tmp' : path.resolve(process.cwd(), "public", "temp-audio");

      // Ensure directory exists
      const fs = require('fs');
      if (!fs.existsSync(tempAudioDir)) {
        fs.mkdirSync(tempAudioDir, { recursive: true });
      }

      localAudioPath = path.join(tempAudioDir, `${clipId}-audio.mp3`);
      const relativeAudioPath = process.env.VERCEL
        ? localAudioPath  // In serverless, use full path
        : `temp-audio/${clipId}-audio.mp3`;  // In local, use relative path from public/

      await this.downloadFile(audioUrl, localAudioPath);
      logger.info({ clipId, localAudioPath, relativeAudioPath }, "Audio downloaded successfully");

      // Step 1: Render video using separate Node process (avoids webpack conflicts)
      // Use /tmp in serverless (Vercel), tmp/ locally
      const outputDir = process.env.VERCEL ? '/tmp' : path.resolve(process.cwd(), "tmp");
      const outputPath = path.join(outputDir, `${clipId}.mp4`);

      const renderConfig = {
        clipTitle,
        audioUrl: relativeAudioPath, // Use relative path from public directory
        transcript,
        startTime,
        endTime,
        outputPath,
      };

      logger.info({ clipId }, "Starting Remotion render in separate process...");

      await this.renderInSeparateProcess(renderConfig, async (progress) => {
        // Update progress in database
        try {
          await prisma.clip.update({
            where: { id: clipId },
            data: { progress },
          });
          logger.info({ clipId, progress }, "Updated render progress");
        } catch (error) {
          logger.warn({ clipId, progress, error }, "Failed to update progress");
        }
      });

      logger.info({ clipId, outputPath }, "Video rendered successfully");

      // Step 4: Upload to R2
      const videoUrl = await storageService.uploadFile(
        outputPath,
        `videos/${clipId}.mp4`,
        "video/mp4"
      );

      logger.info({ clipId, videoUrl }, "Video uploaded to storage");

      // Clean up local audio file
      if (localAudioPath) {
        await unlink(localAudioPath).catch((err) => {
          logger.warn({ clipId, error: err }, "Failed to delete local audio file");
        });
      }

      return videoUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error(
        {
          clipId,
          errorMessage,
          errorStack,
          errorType: error?.constructor?.name
        },
        "Video generation failed"
      );

      // Clean up local audio file on error
      if (localAudioPath) {
        await unlink(localAudioPath).catch(() => {});
      }

      throw new Error(
        `Video generation failed: ${errorMessage}`
      );
    }
  }

  /**
   * Extract word-level timestamps from Deepgram transcript
   * @param deepgramWords - Array of word objects from Deepgram
   * @returns Array of TranscriptWord objects
   */
  extractWordTimestamps(deepgramWords: any[]): TranscriptWord[] {
    return deepgramWords.map((word) => ({
      word: word.word,
      start: word.start,
      end: word.end,
      speaker: word.speaker,
    }));
  }
}

export const videoGenerationService = new VideoGenerationService();
