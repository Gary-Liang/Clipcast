import { JobStatus } from "./job.types";

// Upload endpoint types
export interface UploadRequest {
  filename: string;
  fileSize: number;
}

export interface UploadResponse {
  jobId: string;
  uploadUrl: string;
}

// Transcribe endpoint types
export interface TranscribeRequest {
  jobId: string;
}

export interface TranscribeResponse {
  jobId: string;
  status: JobStatus;
}

// Detect clips endpoint types
export interface DetectClipsRequest {
  jobId: string;
}

export interface DetectClipsResponse {
  jobId: string;
  status: JobStatus;
}

// Job status endpoint types
export interface JobStatusResponse {
  id: string;
  filename: string;
  fileSize: number;
  status: JobStatus;
  audioUrl?: string | null;
  transcriptUrl?: string | null;
  transcript?: string | null;
  duration?: number | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
  clips?: Array<{
    id: string;
    title: string;
    description?: string | null;
    startTime: number;
    endTime: number;
    videoUrl?: string | null;
    status: string;
    progress?: number;
  }>;
}

// Error response type
export interface ErrorResponse {
  error: string;
  details?: string;
}
