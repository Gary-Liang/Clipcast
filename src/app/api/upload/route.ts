import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import prisma from "@/lib/db/client";
import storageService from "@/lib/services/storage.service";
import { getCurrentUser } from "@/lib/auth/user";
import logger from "@/utils/logger";
import { validateUploadRequest } from "@/utils/validation";
import { getErrorResponse, ValidationError } from "@/utils/errors";
import { UploadResponse, ErrorResponse } from "@/types/api.types";
import { JobStatus } from "@/types/job.types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    let validatedData;
    try {
      validatedData = validateUploadRequest(body);
    } catch (error) {
      throw new ValidationError("Invalid upload request", error);
    }

    const { filename, fileSize } = validatedData;

    // Get current user (optional - allows unauthenticated uploads for testing)
    const user = await getCurrentUser();

    // Generate unique job ID
    const jobId = nanoid();

    logger.info({ jobId, filename, fileSize, userId: user?.id }, "Creating upload job");

    // Create database record
    await prisma.job.create({
      data: {
        id: jobId,
        filename,
        fileSize,
        status: JobStatus.PENDING_UPLOAD,
        userId: user?.id, // Link to user if authenticated
      },
    });

    // Generate presigned upload URL
    const uploadUrl = await storageService.generateUploadUrl(jobId, filename);

    const response: UploadResponse = {
      jobId,
      uploadUrl,
    };

    logger.info({ jobId }, "Upload URL generated successfully");

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Upload endpoint error");

    const errorResponse = getErrorResponse(error);
    const response: ErrorResponse = {
      error: errorResponse.error,
      details: errorResponse.code,
    };

    return NextResponse.json(response, { status: errorResponse.statusCode });
  }
}
