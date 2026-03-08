import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import clipDetectionService from "@/lib/services/clip-detection.service";
import logger from "@/utils/logger";
import { getErrorResponse, ValidationError, NotFoundError } from "@/utils/errors";
import { DetectClipsResponse, ErrorResponse } from "@/types/api.types";
import { JobStatus, ClipStatus } from "@/types/job.types";
import { validateDetectClipsRequest } from "@/utils/validation";
import { timeStringToSeconds } from "@/utils/time";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    let validatedData;
    try {
      validatedData = validateDetectClipsRequest(body);
    } catch (error) {
      throw new ValidationError("Invalid detect clips request", error);
    }

    const { jobId } = validatedData;

    logger.info({ jobId }, "Starting clip detection job");

    // Verify job exists and has correct status
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError(`Job ${jobId} not found`);
    }

    // Job must be in TRANSCRIPTION_COMPLETE status
    if (job.status !== JobStatus.TRANSCRIPTION_COMPLETE) {
      return NextResponse.json(
        {
          error: `Job must be in TRANSCRIPTION_COMPLETE status, currently ${job.status}`,
        } as ErrorResponse,
        { status: 400 }
      );
    }

    if (!job.transcript) {
      return NextResponse.json(
        { error: "No transcript available for this job" } as ErrorResponse,
        { status: 400 }
      );
    }

    // Update status to DETECTING_CLIPS
    await prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.DETECTING_CLIPS },
    });

    // Process clip detection in background
    logger.info({ jobId }, "Processing clip detection in background");
    processClipDetection(jobId, job.transcript).catch((error) => {
      logger.error({ error, jobId }, "Background clip detection failed");
    });

    const response: DetectClipsResponse = {
      jobId,
      status: JobStatus.DETECTING_CLIPS,
    };

    return NextResponse.json(response, { status: 202 });
  } catch (error) {
    logger.error({ error }, "Detect clips endpoint error");

    const errorResponse = getErrorResponse(error);
    const response: ErrorResponse = {
      error: errorResponse.error,
      details: errorResponse.code,
    };

    return NextResponse.json(response, { status: errorResponse.statusCode });
  }
}

/**
 * Background function to process clip detection
 * This runs asynchronously after the API response is sent
 */
async function processClipDetection(
  jobId: string,
  transcript: string
): Promise<void> {
  try {
    logger.info({ jobId }, "Starting clip detection with OpenAI");

    // Call clip detection service with retry
    const detectedClips = await clipDetectionService.detectClipsWithRetry(
      transcript,
      jobId
    );

    logger.info(
      { jobId, clipCount: detectedClips.length },
      "Clips detected, saving to database"
    );

    // Save clips to database in atomic transaction
    await prisma.$transaction([
      // Create all clips
      ...detectedClips.map((clip) =>
        prisma.clip.create({
          data: {
            jobId,
            title: clip.title,
            description: `${clip.hook} (${clip.category}) - Score: ${clip.viral_score}/10`,
            startTime: timeStringToSeconds(clip.start_time),
            endTime: timeStringToSeconds(clip.end_time),
            status: ClipStatus.PENDING,
          },
        })
      ),
      // Update job status
      prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.CLIPS_DETECTED },
      }),
    ]);

    logger.info({ jobId }, "Clip detection completed successfully");
  } catch (error) {
    logger.error({ error, jobId }, "Clip detection processing failed");

    // Update job status to failed
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        error: `Clip detection failed: ${(error as Error).message}`,
      },
    });
  }
}
