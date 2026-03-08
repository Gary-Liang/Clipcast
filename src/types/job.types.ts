export enum JobStatus {
  PENDING_UPLOAD = "PENDING_UPLOAD",
  TRANSCRIBING = "TRANSCRIBING",
  TRANSCRIPTION_COMPLETE = "TRANSCRIPTION_COMPLETE",
  TRANSCRIPTION_FAILED = "TRANSCRIPTION_FAILED",
  DETECTING_CLIPS = "DETECTING_CLIPS",
  CLIPS_DETECTED = "CLIPS_DETECTED",
  FAILED = "FAILED",
}

export enum ClipStatus {
  PENDING = "PENDING",
  GENERATING = "GENERATING",
  COMPLETE = "COMPLETE",
  FAILED = "FAILED",
}

export interface Job {
  id: string;
  filename: string;
  fileSize: number;
  status: JobStatus;
  audioUrl?: string | null;
  transcriptUrl?: string | null;
  transcript?: string | null;
  duration?: number | null;
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Clip {
  id: string;
  jobId: string;
  title: string;
  description?: string | null;
  startTime: number;
  endTime: number;
  videoUrl?: string | null;
  status: ClipStatus;
  createdAt: Date;
  updatedAt: Date;
}
