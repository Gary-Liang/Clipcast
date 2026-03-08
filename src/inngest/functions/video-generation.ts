import { inngest } from '../client';
import { prisma } from '@/lib/db/client';
import { videoGenerationService } from '@/lib/services/video-generation.service';
import { storageService } from '@/lib/services/storage.service';
import { incrementClipUsage } from '@/lib/auth/user';
import logger from '@/utils/logger';
import { ClipStatus } from '@/types/job.types';

export const processVideoGenerationJob = inngest.createFunction(
  {
    id: 'process-video-generation',
    retries: 2,
    name: 'Generate Video from Clip',
  },
  { event: 'job/video-generation.requested' },
  async ({ event, step }) => {
    const { jobId, clipId } = event.data;

    logger.info({ clipId, jobId }, 'Starting video generation');

    // Step 1: Get clip and job data
    const clipData = await step.run('get-clip-data', async () => {
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: {
          job: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!clip) {
        throw new Error(`Clip ${clipId} not found`);
      }

      return clip;
    });

    // Step 2: Check usage limits and increment atomically
    await step.run('check-and-increment-usage', async () => {
      // If clip has a user, check their limits
      if (clipData.job.user) {
        const user = clipData.job.user;

        // Check if user can create this clip
        if (user.plan === 'FREE' && user.clipsUsed >= user.clipsLimit) {
          throw new Error(
            `Usage limit exceeded. Free users are limited to ${user.clipsLimit} clips. Please upgrade to Pro for unlimited clips.`
          );
        }

        // Increment usage counter
        await incrementClipUsage(user.clerkId);

        logger.info(
          { userId: user.id, clipsUsed: user.clipsUsed + 1, plan: user.plan },
          'User clip usage incremented'
        );
      }
    });

    // Step 3: Get audio URL
    const audioUrl = await step.run('get-audio-url', async () => {
      return await storageService.getAudioUrl(
        clipData.job.id,
        clipData.job.filename
      );
    });

    // Step 4: Extract word-level timestamps for this clip
    const clipWords = await step.run('extract-clip-words', async () => {
      const allWords = clipData.job.transcriptWords as any[];
      return allWords.filter(
        (word: any) =>
          word.start >= clipData.startTime && word.end <= clipData.endTime
      );
    });

    // Step 5: Generate video with Remotion
    const videoUrl = await step.run('generate-video', async () => {
      return await videoGenerationService.generateVideo({
        clipId: clipData.id,
        clipTitle: clipData.title,
        audioUrl,
        transcript: clipWords,
        startTime: clipData.startTime,
        endTime: clipData.endTime,
      });
    });

    // Step 6: Update clip with video URL
    await step.run('update-clip', async () => {
      await prisma.clip.update({
        where: { id: clipId },
        data: {
          videoUrl,
          status: ClipStatus.COMPLETE,
          progress: 100,
        },
      });

      logger.info({ clipId, videoUrl }, 'Video generation completed successfully');
    });

    return {
      clipId,
      videoUrl,
    };
  }
);
