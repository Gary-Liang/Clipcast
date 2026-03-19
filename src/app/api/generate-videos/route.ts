import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import logger from "@/utils/logger";
import { getErrorResponse, ValidationError, NotFoundError } from "@/utils/errors";
import { ErrorResponse } from "@/types/api.types";
import { ClipStatus } from "@/types/job.types";
import storageService from "@/lib/services/storage.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clipId } = body;

    if (!clipId) {
      throw new ValidationError("clipId is required");
    }

    logger.info({ clipId }, "Starting video generation for clip");

    // Verify clip exists and get user info
    const clip = await prisma.clip.findUnique({
      where: { id: clipId },
      include: {
        job: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!clip) {
      throw new NotFoundError(`Clip ${clipId} not found`);
    }

    // Check usage limits (but don't increment yet - only increment on successful render)
    if (clip.job.user) {
      const user = clip.job.user;

      if (user.plan === 'FREE') {
        // Check if we need to reset monthly usage
        const now = new Date();
        const lastReset = new Date(user.lastResetDate);
        const monthsSinceReset = (now.getFullYear() - lastReset.getFullYear()) * 12
                                + (now.getMonth() - lastReset.getMonth());

        // If a month or more has passed, reset usage
        if (monthsSinceReset >= 1) {
          logger.info(
            { userId: user.id, lastResetDate: user.lastResetDate, monthsSinceReset },
            "Resetting monthly clip usage"
          );

          await prisma.user.update({
            where: { id: user.id },
            data: {
              clipsUsed: 0,
              lastResetDate: now,
            },
          });

          logger.info(
            { userId: user.id, plan: user.plan },
            "Monthly usage reset complete"
          );
        }

        // PRE-INCREMENT usage atomically to prevent race conditions
        // This ensures users can't bypass limits by rapid-clicking
        const updateResult = await prisma.user.updateMany({
          where: {
            id: user.id,
            clipsUsed: { lt: user.clipsLimit }, // Only increment if under limit
          },
          data: {
            clipsUsed: { increment: 1 },
          },
        });

        // If no rows were updated, user is at limit
        if (updateResult.count === 0) {
          const currentUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { clipsUsed: true, clipsLimit: true },
          });

          return NextResponse.json(
            {
              error: `Free tier limit reached (${currentUser?.clipsLimit || 3} clips). Upgrade to Pro for unlimited clips.`,
            } as ErrorResponse,
            { status: 403 }
          );
        }

        logger.info(
          { userId: user.id, clipsUsed: user.clipsUsed + 1, plan: user.plan },
          "Usage pre-incremented - will decrement on failure"
        );
      }
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

    // Call render service (Railway or local)
    const renderServiceUrl = process.env.RENDER_SERVICE_URL || 'http://localhost:3001';
    const callbackUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/webhooks/render-complete`;

    logger.info({ clipId, renderServiceUrl }, "Calling render service");

    const renderResponse = await fetch(`${renderServiceUrl}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clipId,
        clipTitle: clip.title,
        audioUrl,
        transcript: clipWords,
        startTime: clip.startTime,
        endTime: clip.endTime,
        callbackUrl,
      }),
    });

    if (!renderResponse.ok) {
      const errorText = await renderResponse.text();
      throw new Error(`Render service error: ${renderResponse.status} - ${errorText}`);
    }

    const renderResult = await renderResponse.json();
    logger.info({ clipId, renderResult }, "Render service accepted job");
  } catch (error) {
    logger.error({ error, clipId }, "Video generation processing failed");

    // Get clip with user info for usage refund
    const failedClip = await prisma.clip.findUnique({
      where: { id: clipId },
      include: { job: { include: { user: true } } },
    });

    // Update clip status to FAILED
    await prisma.clip.update({
      where: { id: clipId },
      data: {
        status: ClipStatus.FAILED,
        progress: 0,
      },
    });

    // Refund usage for failed renders (FREE users only)
    if (failedClip?.job?.user && failedClip.job.user.plan === 'FREE') {
      await prisma.user.update({
        where: { id: failedClip.job.user.id },
        data: {
          clipsUsed: { decrement: 1 },
        },
      });

      logger.info(
        { userId: failedClip.job.user.id, clipId },
        "Usage refunded due to processing error"
      );
    }
  }
}
