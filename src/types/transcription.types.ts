export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
}

export interface DeepgramUtterance {
  start: number;
  end: number;
  confidence: number;
  channel: number;
  transcript: string;
  words: DeepgramWord[];
  speaker?: number;
  id: string;
}

export interface DeepgramParagraph {
  sentences: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  start: number;
  end: number;
  num_words: number;
}

export interface DeepgramMetadata {
  transaction_key: string;
  request_id: string;
  sha256: string;
  created: string;
  duration: number;
  channels: number;
}

export interface DeepgramResult {
  metadata: DeepgramMetadata;
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words: DeepgramWord[];
        paragraphs?: {
          transcript: string;
          paragraphs: DeepgramParagraph[];
        };
      }>;
    }>;
    utterances?: DeepgramUtterance[];
  };
}

export interface TranscriptionResult {
  formattedTranscript: string;
  rawTranscript: string;
  duration: number;
  utterances: DeepgramUtterance[];
  words: DeepgramWord[];
}

export interface TranscriptionSegment {
  timestamp: string;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}
