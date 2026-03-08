import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import logger from "@/utils/logger";
import { getErrorResponse, NotFoundError } from "@/utils/errors";
import { JobStatusResponse, ErrorResponse } from "@/types/api.types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    logger.info({ jobId }, "Fetching job status");

    // Query job with clips
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        clips: {
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!job) {
      throw new NotFoundError(`Job ${jobId} not found`);
    }

    const response: JobStatusResponse = {
      id: job.id,
      filename: job.filename,
      fileSize: job.fileSize,
      status: job.status as any,
      audioUrl: job.audioUrl,
      transcriptUrl: job.transcriptUrl,
      transcript: job.transcript,
      duration: job.duration,
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      clips: job.clips.map((clip) => ({
        id: clip.id,
        title: clip.title,
        description: clip.description,
        startTime: clip.startTime,
        endTime: clip.endTime,
        videoUrl: clip.videoUrl,
        status: clip.status,
        progress: clip.progress,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error({ error }, "Job status endpoint error");

    const errorResponse = getErrorResponse(error);
    const response: ErrorResponse = {
      error: errorResponse.error,
      details: errorResponse.code,
    };

    return NextResponse.json(response, { status: errorResponse.statusCode });
  }
}
