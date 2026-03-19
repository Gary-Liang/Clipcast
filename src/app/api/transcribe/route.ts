import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import logger from "@/utils/logger";
import { validateTranscribeRequest } from "@/utils/validation";
import {
  getErrorResponse,
  ValidationError,
  NotFoundError,
} from "@/utils/errors";
import { TranscribeResponse, ErrorResponse } from "@/types/api.types";
import { JobStatus } from "@/types/job.types";
import transcriptionService from "@/lib/services/transcription.service";
import storageService from "@/lib/services/storage.service";
import { getCurrentUser } from "@/lib/auth/user";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Rate limiting
    const rateLimitCheck = await enforceRateLimit(user.id, "transcribe");
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck.response;
    }

    const body = await request.json();

    // Validate request
    let validatedData;
    try {
      validatedData = validateTranscribeRequest(body);
    } catch (error) {
      throw new ValidationError("Invalid transcribe request", error);
    }

    const { jobId } = validatedData;

    // Verify job exists and belongs to user
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError(`Job ${jobId} not found`);
    }

    if (job.userId && job.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    logger.info({ jobId }, "Starting transcription job");

    // Update job status to transcribing
    await prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.TRANSCRIBING },
    });

    // Process transcription in background (fire-and-forget for now)
    // Phase 4 will replace this with Inngest for reliable processing
    processTranscription(jobId, job.filename).catch((error) => {
      logger.error({ error, jobId }, "Background transcription failed");
    });

    logger.info({ jobId }, "Transcription job started");

    const response: TranscribeResponse = {
      jobId,
      status: JobStatus.TRANSCRIBING,
    };

    return NextResponse.json(response, { status: 202 });
  } catch (error) {
    logger.error({ error }, "Transcribe endpoint error");

    const errorResponse = getErrorResponse(error);
    const response: ErrorResponse = {
      error: errorResponse.error,
      details: errorResponse.code,
    };

    return NextResponse.json(response, { status: errorResponse.statusCode });
  }
}

// Background transcription processing (Phase 3 - direct processing)
// Phase 4 will replace this with Inngest for reliability
async function processTranscription(jobId: string, filename: string) {
  try {
    logger.info({ jobId, filename }, "Processing transcription");

    // Get audio URL from storage
    const audioUrl = await storageService.getAudioUrl(jobId, filename);
    logger.info({ jobId, audioUrl }, "Retrieved audio URL");

    // Transcribe audio
    const result = await transcriptionService.transcribeWithRetry(audioUrl, jobId);
    logger.info({ jobId, wordCount: result.words.length }, "Transcription complete");

    // Update job with transcription data
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.TRANSCRIPTION_COMPLETE,
        transcript: result.formattedTranscript,
        transcriptWords: result.words as any, // Save word-level timestamps for video generation
        duration: result.duration,
      },
    });

    logger.info({ jobId }, "Job updated with transcription");
  } catch (error) {
    logger.error({ error, jobId }, "Transcription processing failed");

    // Update job status to failed
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.TRANSCRIPTION_FAILED,
        error: error instanceof Error ? error.message : "Transcription failed",
      },
    });
  }
}
