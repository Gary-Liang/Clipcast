import { EventSchemas } from 'inngest';

// Event types for our background jobs
export const schemas = new EventSchemas().fromRecord<{
  'job/transcription.requested': {
    data: {
      jobId: string;
      filename: string;
    };
  };
  'job/clip-detection.requested': {
    data: {
      jobId: string;
      transcript: string;
    };
  };
  'job/video-generation.requested': {
    data: {
      jobId: string;
      clipId: string;
    };
  };
}>();

export default {
  client: 'podcast-to-clips',
  schemas,
};
