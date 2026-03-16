import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import logger from "@/utils/logger";
import { ClipStatus } from "@/types/job.types";

// Add CORS headers to allow Railway render service to call this endpoint
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clipId, videoUrl, status, error, duration } = body;

    logger.info({ clipId, status, videoUrl, duration }, "Render webhook received");

    if (!clipId) {
      return NextResponse.json({ error: "clipId is required" }, { status: 400 });
    }

    // Update clip based on status
    if (status === 'completed' && videoUrl) {
      // Get clip with user info
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: { job: { include: { user: true } } },
      });

      // Update clip status
      await prisma.clip.update({
        where: { id: clipId },
        data: {
          status: ClipStatus.COMPLETE,
          videoUrl,
          progress: 100,
        },
      });

      // NOW increment usage (only on successful render)
      if (clip?.job?.user && clip.job.user.plan === 'FREE') {
        const updatedUser = await prisma.user.updateMany({
          where: {
            id: clip.job.user.id,
            clipsUsed: { lt: clip.job.user.clipsLimit },
          },
          data: {
            clipsUsed: { increment: 1 },
          },
        });

        logger.info(
          { userId: clip.job.user.id, clipId },
          "User clip usage incremented after successful render"
        );
      }

      logger.info({ clipId, videoUrl }, "Clip marked as complete");
    } else if (status === 'failed') {
      await prisma.clip.update({
        where: { id: clipId },
        data: {
          status: ClipStatus.FAILED,
          progress: 0,
        },
      });

      logger.error({ clipId, error }, "Clip marked as failed");
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    logger.error({ error }, "Render webhook error");
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
