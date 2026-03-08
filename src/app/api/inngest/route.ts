import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { processTranscriptionJob } from '@/inngest/functions/transcription';
import { processClipDetectionJob } from '@/inngest/functions/clip-detection';
import { processVideoGenerationJob } from '@/inngest/functions/video-generation';

// Create the Inngest serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processTranscriptionJob,
    processClipDetectionJob,
    processVideoGenerationJob,
  ],
});
