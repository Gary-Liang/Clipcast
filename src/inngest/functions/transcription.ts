import { inngest } from '../client';
import { prisma } from '@/lib/db/client';
import storageService from '@/lib/services/storage.service';
import transcriptionService from '@/lib/services/transcription.service';
import logger from '@/utils/logger';
import { JobStatus } from '@/types/job.types';

export const processTranscriptionJob = inngest.createFunction(
  {
    id: 'process-transcription',
    retries: 3,
    name: 'Process Audio Transcription',
  },
  { event: 'job/transcription.requested' },
  async ({ event, step }) => {
    const { jobId, filename } = event.data;

    logger.info({ jobId }, 'Starting transcription job');

    // Step 1: Get audio URL from R2
    const audioUrl = await step.run('get-audio-url', async () => {
      return await storageService.getAudioUrl(jobId, filename);
    });

    // Step 2: Transcribe audio with Deepgram
    const result = await step.run('transcribe-audio', async () => {
      return await transcriptionService.transcribeWithRetry(audioUrl, jobId);
    });

    // Step 3: Save transcript to R2
    const transcriptKey = await step.run('save-transcript', async () => {
      return await storageService.saveTranscript(jobId, result.formattedTranscript);
    });

    const transcriptUrl = storageService.getPublicUrl(transcriptKey);

    // Step 4: Update job in database
    await step.run('update-job', async () => {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.TRANSCRIPTION_COMPLETE,
          transcript: result.formattedTranscript,
          transcriptWords: result.words as any,
          transcriptUrl,
          audioUrl,
          duration: result.duration,
        },
      });

      logger.info({ jobId, duration: result.duration }, 'Transcription completed successfully');
    });

    // Step 5: Trigger clip detection automatically
    await step.sendEvent('trigger-clip-detection', {
      name: 'job/clip-detection.requested',
      data: {
        jobId,
        transcript: result.formattedTranscript,
      },
    });

    return {
      jobId,
      duration: result.duration,
      transcriptLength: result.formattedTranscript.length,
    };
  }
);
