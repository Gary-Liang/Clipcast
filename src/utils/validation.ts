import { z } from "zod";

// File validation
export const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB
export const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3"];
export const ALLOWED_EXTENSIONS = [".mp3"];

export const uploadRequestSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .refine(
      (filename) => {
        const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
        return ALLOWED_EXTENSIONS.includes(ext);
      },
      { message: "Only MP3 files are allowed" }
    ),
  fileSize: z
    .number()
    .positive("File size must be positive")
    .max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`),
});

export const transcribeRequestSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

export const detectClipsRequestSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

export function validateUploadRequest(data: unknown) {
  return uploadRequestSchema.parse(data);
}

export function validateTranscribeRequest(data: unknown) {
  return transcribeRequestSchema.parse(data);
}

export function validateDetectClipsRequest(data: unknown) {
  return detectClipsRequestSchema.parse(data);
}

export function isValidAudioFile(filename: string, fileSize: number): boolean {
  try {
    uploadRequestSchema.parse({ filename, fileSize });
    return true;
  } catch {
    return false;
  }
}
