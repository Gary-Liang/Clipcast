"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import prisma from "@/lib/db/client";
import logger from "@/utils/logger";
import { getCurrentUser } from "@/lib/auth/user";
import { JobStatus } from "@/types/job.types";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFileAction(formData: FormData) {
  try {
    // Get current user
    const user = await getCurrentUser();

    logger.info({ userId: user?.id }, "Receiving file upload via server action");

    const file = formData.get("file") as File;

    if (!file) {
      return { error: "No file provided" };
    }

    // Validate file
    if (!file.name.endsWith(".mp3")) {
      return { error: "Only MP3 files are allowed" };
    }

    if (file.size > 150 * 1024 * 1024) {
      return { error: "File must be less than 150MB" };
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

    logger.info({ jobId, key }, "File uploaded successfully via server action");

    // Create job in database
    await prisma.job.create({
      data: {
        id: jobId,
        filename: file.name,
        fileSize: file.size,
        status: JobStatus.TRANSCRIBING,
        audioUrl: key,
        userId: user?.id,
      },
    });

    logger.info({ jobId }, "Job created successfully");

    return { jobId, success: true };
  } catch (error) {
    logger.error({ error }, "Upload failed in server action");
    return { error: error instanceof Error ? error.message : "Upload failed" };
  }
}
