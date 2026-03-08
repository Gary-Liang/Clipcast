import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import prisma from "@/lib/db/client";
import logger from "@/utils/logger";
import { getCurrentUser } from "@/lib/auth/user";
import { JobStatus } from "@/types/job.types";

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large uploads

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
    const user = await getCurrentUser();
    logger.info({ userId: user?.id }, "Starting streaming upload");

    // Get filename and size from query params (sent separately to avoid body parsing)
    const url = new URL(request.url);
    const filename = url.searchParams.get('filename');
    const fileSize = parseInt(url.searchParams.get('fileSize') || '0');

    if (!filename || !fileSize) {
      return NextResponse.json(
        { error: "Missing filename or fileSize" },
        { status: 400 }
      );
    }

    // Validate file
    if (!filename.endsWith(".mp3")) {
      return NextResponse.json(
        { error: "Only MP3 files are allowed" },
        { status: 400 }
      );
    }

    if (fileSize > 150 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be less than 150MB" },
        { status: 400 }
      );
    }

    const jobId = nanoid();
    const key = `audio/${jobId}/${filename}`;

    logger.info({ jobId, filename, fileSize, userId: user?.id }, "Streaming upload to R2");

    // Get the request body as a stream
    if (!request.body) {
      return NextResponse.json(
        { error: "No request body" },
        { status: 400 }
      );
    }

    // Convert Web ReadableStream to Node.js Readable for S3
    const { Readable } = await import('stream');
    const reader = request.body.getReader();

    const nodeStream = new Readable({
      async read() {
        try {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
          } else {
            this.push(Buffer.from(value));
          }
        } catch (error) {
          this.destroy(error as Error);
        }
      }
    });

    // Upload to R2 using stream
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: nodeStream,
      ContentType: "audio/mpeg",
      ContentLength: fileSize,
    });

    await s3Client.send(command);

    logger.info({ jobId, key }, "File uploaded successfully via streaming");

    // Create job in database
    await prisma.job.create({
      data: {
        id: jobId,
        filename,
        fileSize,
        status: JobStatus.PENDING_UPLOAD, // Will be updated to TRANSCRIBING by /api/transcribe
        audioUrl: key,
        userId: user?.id,
      },
    });

    logger.info({ jobId }, "Job created successfully");

    return NextResponse.json({
      jobId,
      success: true,
    });
  } catch (error) {
    logger.error({ error }, "Streaming upload failed");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
