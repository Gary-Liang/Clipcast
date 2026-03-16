import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import prisma from "@/lib/db/client";
import logger from "@/utils/logger";
import { getCurrentUser } from "@/lib/auth/user";
import { JobStatus } from "@/types/job.types";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile, unlink } from "fs/promises";

export const runtime = 'nodejs';
export const maxDuration = 300;

// Use /tmp in serverless (Vercel), .uploads locally
const UPLOAD_DIR = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), '.uploads');
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

// Lazy initialization for S3Client
let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3ClientInstance) {
    return s3ClientInstance;
  }

  if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials not configured. Check your environment variables.');
  }

  s3ClientInstance = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  return s3ClientInstance;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    const formData = await request.formData();
    const chunk = formData.get('chunk') as Blob;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const filename = formData.get('filename') as string;
    const fileSize = parseInt(formData.get('fileSize') as string);
    let jobId = formData.get('jobId') as string;

    if (!chunk || isNaN(chunkIndex) || isNaN(totalChunks) || !filename) {
      return NextResponse.json({ error: "Invalid chunk data" }, { status: 400 });
    }

    // Generate jobId on first chunk
    if (!jobId && chunkIndex === 0) {
      jobId = nanoid();
    }

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    // Create directories (recursive: true won't error if they exist)
    const chunkDir = path.join(UPLOAD_DIR, jobId);
    await mkdir(chunkDir, { recursive: true });

    const chunkPath = path.join(chunkDir, `chunk-${chunkIndex}`);
    const buffer = Buffer.from(await chunk.arrayBuffer());
    await writeFile(chunkPath, buffer);

    logger.info({ jobId, chunkIndex, totalChunks, chunkSize: buffer.length }, "Chunk saved");

    // If this is the last chunk, assemble and upload
    if (chunkIndex === totalChunks - 1) {
      logger.info({ jobId, totalChunks }, "All chunks received, assembling file");

      // Read all chunks and combine
      const chunks: Buffer[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunkFilePath = path.join(chunkDir, `chunk-${i}`);
        const chunkBuffer = await readFile(chunkFilePath);
        chunks.push(chunkBuffer);
      }

      const completeFile = Buffer.concat(chunks);
      logger.info({ jobId, fileSize: completeFile.length }, "File assembled");

      // Upload to R2
      const key = `audio/${jobId}/${filename}`;
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: completeFile,
        ContentType: "audio/mpeg",
      });

      const s3Client = getS3Client();
      await s3Client.send(command);
      logger.info({ jobId, key }, "File uploaded to R2");

      // Create job in database
      await prisma.job.create({
        data: {
          id: jobId,
          filename,
          fileSize,
          status: JobStatus.PENDING_UPLOAD,
          audioUrl: key,
          userId: user?.id,
        },
      });

      // Clean up temporary files
      for (let i = 0; i < totalChunks; i++) {
        const chunkFilePath = path.join(chunkDir, `chunk-${i}`);
        try {
          await unlink(chunkFilePath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      return NextResponse.json({
        jobId,
        complete: true,
        success: true,
      });
    }

    // Return jobId for subsequent chunks
    return NextResponse.json({
      jobId,
      chunkIndex,
      success: true,
    });
  } catch (error) {
    logger.error({ error }, "Chunk upload failed");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
