import { inngest } from '../client';
import { prisma } from '@/lib/db/client';
import clipDetectionService from '@/lib/services/clip-detection.service';
import logger from '@/utils/logger';
import { JobStatus, ClipStatus } from '@/types/job.types';
import { timeStringToSeconds } from '@/utils/time';

export const processClipDetectionJob = inngest.createFunction(
  {
    id: 'process-clip-detection',
    retries: 3,
    name: 'Detect Viral Clips from Transcript',
  },
  { event: 'job/clip-detection.requested' },
  async ({ event, step }) => {
    const { jobId, transcript } = event.data;

    logger.info({ jobId }, 'Starting clip detection');

    // Step 1: Update job status
    await step.run('update-status', async () => {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DETECTING_CLIPS },
      });
    });

    // Step 2: Detect clips using AI
    const detectedClips = await step.run('detect-clips', async () => {
      return await clipDetectionService.detectClipsWithRetry(transcript, jobId);
    });

    logger.info({ jobId, clipCount: detectedClips.length }, 'Clips detected');

    // Step 3: Save clips to database
    const savedClips = await step.run('save-clips', async () => {
      return await prisma.$transaction([
        // Create all clips
        ...detectedClips.map((clip) =>
          prisma.clip.create({
            data: {
              jobId,
              title: clip.title,
              description: `${clip.hook} (${clip.category}) - Score: ${clip.viral_score}/10`,
              startTime: timeStringToSeconds(clip.start_time),
              endTime: timeStringToSeconds(clip.end_time),
              status: ClipStatus.PENDING,
            },
          })
        ),
        // Update job status
        prisma.job.update({
          where: { id: jobId },
          data: { status: JobStatus.CLIPS_DETECTED },
        }),
      ]);
    });

    logger.info({ jobId }, 'Clip detection completed successfully');

    return {
      jobId,
      clipsDetected: detectedClips.length,
    };
  }
);
