import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import prisma from "@/lib/db/client";
import logger from "@/utils/logger";
import { getErrorResponse } from "@/utils/errors";
import { JobStatus } from "@/types/job.types";
import { getCurrentUser } from "@/lib/auth/user";

// Configure route to accept larger request bodies (150MB)
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    // Get current user (optional - allows unauthenticated uploads for testing)
    const user = await getCurrentUser();

    logger.info({ userId: user?.id }, "Receiving file upload request");
    const formData = await request.formData();
    logger.info("FormData parsed");
    const file = formData.get("file") as File;
    logger.info({ filename: file?.name, size: file?.size }, "File extracted from form");

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file
    if (!file.name.endsWith(".mp3")) {
      return NextResponse.json(
        { error: "Only MP3 files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 150 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be less than 150MB" },
        { status: 400 }
      );
    }

    const jobId = nanoid();
    const key = `audio/${jobId}/${file.name}`;

    logger.info({ jobId, filename: file.name, size: file.size, userId: user?.id }, "Uploading file to R2");

    // Read file as buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: "audio/mpeg",
      })
    );

    logger.info({ jobId, key }, "File uploaded successfully");

    // Create job in database
    await prisma.job.create({
      data: {
        id: jobId,
        filename: file.name,
        fileSize: file.size,
        status: JobStatus.TRANSCRIBING,
        audioUrl: key,
        userId: user?.id, // Link to user if authenticated
      },
    });

    return NextResponse.json({
      jobId,
      message: "Upload successful",
    });
  } catch (error) {
    logger.error({ error, stack: (error as Error).stack }, "Upload failed");
    console.error("Full error:", error);
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error, details: (error as Error).message },
      { status: errorResponse.statusCode }
    );
  }
}
