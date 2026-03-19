import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import logger from "@/utils/logger";
import { ClipStatus } from "@/types/job.types";

// Add CORS headers to allow Railway render service to call this endpoint
// Note: Authorization header validation provides the real security, not CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Kept as * because render service may not have fixed origin
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate webhook is from our render service
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.RENDER_WEBHOOK_SECRET;

    if (!expectedSecret) {
      logger.error("RENDER_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      logger.warn({ ip: request.ip }, "Unauthorized webhook attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

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

      // Usage already pre-incremented in /api/generate-videos
      // No need to increment here anymore

      logger.info({ clipId, videoUrl }, "Clip marked as complete");
    } else if (status === 'failed') {
      // Get clip with user info for usage refund
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: { job: { include: { user: true } } },
      });

      await prisma.clip.update({
        where: { id: clipId },
        data: {
          status: ClipStatus.FAILED,
          progress: 0,
        },
      });

      // Refund usage for failed renders (FREE users only)
      if (clip?.job?.user && clip.job.user.plan === 'FREE') {
        await prisma.user.update({
          where: { id: clip.job.user.id },
          data: {
            clipsUsed: { decrement: 1 },
          },
        });

        logger.info(
          { userId: clip.job.user.id, clipId },
          "Usage refunded due to failed render"
        );
      }

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
