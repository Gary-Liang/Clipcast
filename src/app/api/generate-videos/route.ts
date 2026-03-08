import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import logger from "@/utils/logger";
import { getErrorResponse, ValidationError, NotFoundError } from "@/utils/errors";
import { ErrorResponse } from "@/types/api.types";
import { ClipStatus } from "@/types/job.types";
import { videoGenerationService } from "@/lib/services/video-generation.service";
import storageService from "@/lib/services/storage.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clipId } = body;

    if (!clipId) {
      throw new ValidationError("clipId is required");
    }

    logger.info({ clipId }, "Starting video generation for clip");

    // Verify clip exists
    const clip = await prisma.clip.findUnique({
      where: { id: clipId },
      include: {
        job: true,
      },
    });

    if (!clip) {
      throw new NotFoundError(`Clip ${clipId} not found`);
    }

    // Verify job has word-level timestamps
    if (!clip.job.transcriptWords) {
      return NextResponse.json(
        {
          error: "No word-level timestamps available. Please re-transcribe the audio.",
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Update clip status to GENERATING
    await prisma.clip.update({
      where: { id: clipId },
      data: {
        status: ClipStatus.GENERATING,
        progress: 0,
      },
    });

    // Process video generation in background (fire-and-forget for now)
    // Phase 4 will replace this with Inngest for reliable processing
    processVideoGeneration(clipId, clip.jobId).catch((error) => {
      logger.error({ error, clipId }, "Background video generation failed");
    });

    logger.info({ clipId }, "Video generation started");

    return NextResponse.json(
      {
        clipId,
        status: ClipStatus.GENERATING,
      },
      { status: 202 }
    );
  } catch (error) {
    logger.error({ error }, "Generate videos endpoint error");

    const errorResponse = getErrorResponse(error);
    const response: ErrorResponse = {
      error: errorResponse.error,
      details: errorResponse.code,
    };

    return NextResponse.json(response, { status: errorResponse.statusCode });
  }
}

// Background video generation processing (Phase 3 - direct processing)
// Phase 4 will replace this with Inngest for reliability
async function processVideoGeneration(clipId: string, jobId: string) {
  try {
    logger.info({ clipId, jobId }, "Processing video generation");

    // Get clip and job data
    const clip = await prisma.clip.findUnique({
      where: { id: clipId },
      include: { job: true },
    });

    if (!clip || !clip.job) {
      throw new Error("Clip or job not found");
    }

    // Get audio URL
    const audioUrl = await storageService.getAudioUrl(jobId, clip.job.filename);

    // Get transcript words (this includes word-level timestamps)
    const words = clip.job.transcriptWords as any[];

    if (!words || words.length === 0) {
      throw new Error("No word-level timestamps available");
    }

    // Extract clip segment from full transcript
    const clipWords = words.filter(
      (word: any) => word.start >= clip.startTime && word.end <= clip.endTime
    );

    logger.info({ clipId, wordCount: clipWords.length }, "Extracted clip words");

    // Generate video using Remotion (already uploads to R2 and returns URL)
    const videoUrl = await videoGenerationService.generateVideo({
      clipId,
      clipTitle: clip.title,
      audioUrl,
      transcript: clipWords,
      startTime: clip.startTime,
      endTime: clip.endTime,
    });

    logger.info({ clipId, videoUrl }, "Video generated and uploaded successfully");

    // Update clip status to COMPLETE
    await prisma.clip.update({
      where: { id: clipId },
      data: {
        status: ClipStatus.COMPLETE,
        videoUrl,
        progress: 100,
      },
    });

    logger.info({ clipId }, "Video generation complete");
  } catch (error) {
    logger.error({ error, clipId }, "Video generation processing failed");

    // Update clip status to FAILED
    await prisma.clip.update({
      where: { id: clipId },
      data: {
        status: ClipStatus.FAILED,
        progress: 0,
      },
    });
  }
}
