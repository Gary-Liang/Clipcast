import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readFile } from "fs/promises";
import logger from "@/utils/logger";
import { StorageError } from "@/utils/errors";

class StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string | null = null;

  constructor() {
    // Lazy initialization - don't throw during build time
  }

  private initialize() {
    if (this.s3Client && this.bucketName) {
      return; // Already initialized
    }

    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      throw new Error("R2 configuration is missing. Check your environment variables.");
    }

    this.bucketName = process.env.R2_BUCKET_NAME;

    this.s3Client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    logger.info("Storage service initialized with R2");
  }

  /**
   * Generate a presigned URL for uploading audio files
   * @param jobId - The job ID
   * @param filename - Original filename
   * @returns Presigned PUT URL valid for 1 hour
   */
  async generateUploadUrl(jobId: string, filename: string): Promise<string> {
    this.initialize(); // Lazy initialization

    try {
      const key = `audio/${jobId}/${filename}`;

      // Create command with CORS-friendly settings
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: "audio/mpeg",
        // Add ACL to make sure the object is accessible
        ACL: "private",
        // Add metadata that might help with CORS
        Metadata: {
          "uploaded-by": "podcast-to-clips",
        },
      });

      // Remove checksum middleware from this specific command
      command.middlewareStack.remove("flexibleChecksumsMiddleware");
      command.middlewareStack.remove("getFlexibleChecksum");

      // Generate presigned URL with unhoisted payload
      let url = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600, // 1 hour
        unhoistableHeaders: new Set(), // Don't hoist any headers
      });

      // Remove problematic checksum parameters that cause CORS issues
      const urlObj = new URL(url);
      urlObj.searchParams.delete('x-amz-checksum-crc32');
      urlObj.searchParams.delete('x-amz-sdk-checksum-algorithm');

      // Ensure all necessary headers are in the URL, not as separate headers
      url = urlObj.toString();

      logger.info({ jobId, filename, key, url: url.substring(0, 100) + '...' }, "Generated upload URL");
      return url;
    } catch (error) {
      logger.error({ error, jobId, filename }, "Failed to generate upload URL");
      throw new StorageError("Failed to generate upload URL", error as Error);
    }
  }

  /**
   * Generate a presigned URL for downloading audio files (for Deepgram)
   * @param jobId - The job ID
   * @param filename - Original filename
   * @returns Presigned GET URL valid for 24 hours
   */
  async getAudioUrl(jobId: string, filename: string): Promise<string> {
    this.initialize(); // Lazy initialization

    try {
      const key = `audio/${jobId}/${filename}`;

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: 86400, // 24 hours
      });

      logger.info({ jobId, filename, key }, "Generated audio download URL");
      return url;
    } catch (error) {
      logger.error({ error, jobId, filename }, "Failed to generate audio URL");
      throw new StorageError("Failed to generate audio URL", error as Error);
    }
  }

  /**
   * Save transcript to R2 storage
   * @param jobId - The job ID
   * @param transcript - The formatted transcript text
   * @returns The storage key for the transcript
   */
  async saveTranscript(jobId: string, transcript: string): Promise<string> {
    this.initialize(); // Lazy initialization

    try {
      const key = `transcripts/${jobId}/transcript.txt`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: transcript,
        ContentType: "text/plain",
      });

      await this.s3Client.send(command);

      logger.info({ jobId, key }, "Saved transcript to storage");
      return key;
    } catch (error) {
      logger.error({ error, jobId }, "Failed to save transcript");
      throw new StorageError("Failed to save transcript", error as Error);
    }
  }

  /**
   * Get the public URL for a transcript (if R2_PUBLIC_DOMAIN is configured)
   * @param key - The storage key
   * @returns Public URL or null
   */
  getPublicUrl(key: string): string | null {
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;
    if (!publicDomain) {
      return null;
    }
    return `https://${publicDomain}/${key}`;
  }

  /**
   * Upload a file from disk to R2 storage
   * @param filePath - Local path to the file
   * @param key - Storage key (path in bucket)
   * @param contentType - MIME type of the file
   * @returns Presigned URL to access the file
   */
  async uploadFile(
    filePath: string,
    key: string,
    contentType: string
  ): Promise<string> {
    this.initialize(); // Lazy initialization

    try {
      // Read file from disk
      const fileBuffer = await readFile(filePath);

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      logger.info({ key, contentType }, "Uploaded file to storage");

      // Generate a presigned URL for accessing the file
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn: 604800, // 7 days (maximum allowed)
      });

      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error(
        {
          errorMessage,
          errorStack,
          errorName: error?.constructor?.name,
          filePath,
          key,
        },
        "Failed to upload file"
      );
      throw new StorageError("Failed to upload file", error as Error);
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
