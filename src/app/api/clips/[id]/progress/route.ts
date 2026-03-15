import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import logger from "@/utils/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clipId } = await params;
    const body = await request.json();
    const { progress } = body;

    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: "Invalid progress value (must be 0-100)" },
        { status: 400 }
      );
    }

    // Update clip progress
    await prisma.clip.update({
      where: { id: clipId },
      data: { progress },
    });

    logger.info({ clipId, progress }, "Clip progress updated");

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    logger.error({ error, clipId: (await params).id }, "Failed to update clip progress");
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
