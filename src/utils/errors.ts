export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class TranscriptionError extends AppError {
  constructor(message: string, public originalError?: Error) {
    super(message, 500, "TRANSCRIPTION_ERROR");
    this.name = "TranscriptionError";
  }
}

export class StorageError extends AppError {
  constructor(message: string, public originalError?: Error) {
    super(message, 500, "STORAGE_ERROR");
    this.name = "StorageError";
  }
}

export class ClipDetectionError extends AppError {
  constructor(message: string, public originalError?: Error) {
    super(message, 500, "CLIP_DETECTION_ERROR");
    this.name = "ClipDetectionError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function getErrorResponse(error: unknown) {
  if (isAppError(error)) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  return {
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    statusCode: 500,
  };
}
