const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const pino = require('pino');

const logger = pino({ level: 'info' });

// Initialize S3 client for R2
let s3Client = null;

function getS3Client() {
  if (s3Client) return s3Client;

  if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials not configured');
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  return s3Client;
}

/**
 * Download file from URL
 */
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (err) => {
          fs.unlink(outputPath, () => {});
          reject(err);
        });
      } else {
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

/**
 * Upload file to R2
 */
async function uploadToR2(filePath, key, contentType = 'video/mp4') {
  const fileContent = fs.readFileSync(filePath);
  const client = getS3Client();

  // Upload to R2
  const putCommand = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  });

  await client.send(putCommand);

  // Generate presigned URL (valid for 7 days, like audio files)
  const getCommand = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(client, getCommand, {
    expiresIn: 604800, // 7 days (maximum allowed)
  });

  return url;
}

/**
 * Update clip progress in database
 */
async function updateClipProgress(clipId, progress) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    await fetch(`${appUrl}/api/clips/${clipId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
  } catch (error) {
    // Don't fail the render if progress update fails
    logger.warn({ clipId, error: error.message }, 'Failed to update progress');
  }
}

/**
 * Render video using Remotion
 */
async function renderVideo({ clipId, clipTitle, audioUrl, transcript, startTime, endTime, callbackUrl }) {
  // Use PARENT project's public/temp-audio (where Remotion bundle will look for files)
  const parentPublicDir = path.join(__dirname, '..', 'public', 'temp-audio');
  const audioPath = path.join(parentPublicDir, `${clipId}-audio.mp3`);
  const relativeAudioPath = `temp-audio/${clipId}-audio.mp3`; // Relative to parent's public/

  const outputDir = path.join(__dirname, 'tmp');
  const outputPath = path.join(outputDir, `${clipId}.mp4`);

  try {
    // Ensure directories exist
    if (!fs.existsSync(parentPublicDir)) {
      fs.mkdirSync(parentPublicDir, { recursive: true });
    }
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    logger.info({ clipId, audioPath: parentPublicDir }, 'Downloading audio to parent project...');
    await downloadFile(audioUrl, audioPath);

    // Show progress: Audio downloaded
    await updateClipProgress(clipId, 5);

    logger.info({ clipId }, 'Bundling Remotion composition...');

    // Show progress: Starting bundle
    await updateClipProgress(clipId, 10);

    // Bundle the Remotion project (points to parent project)
    const bundleLocation = await bundle({
      entryPoint: path.resolve(__dirname, '../src/remotion/Root.tsx'),
      // This shouldn't be necessary, but for safety:
      webpackOverride: (config) => config,
    });

    logger.info({ clipId, bundleLocation }, 'Bundle created');

    // Select the composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'PodcastClip',
      inputProps: {
        clipTitle,
        audioUrl: relativeAudioPath, // Relative path from public/ (for staticFile)
        transcript,
        startTime,
        endTime,
      },
    });

    logger.info({ clipId, composition: composition.id }, 'Composition selected');

    // Render the video
    logger.info({ clipId }, 'Rendering video...');

    // Show progress: Starting render
    await updateClipProgress(clipId, 15);

    // Track last reported progress to throttle updates (start at 15 since we already reported that)
    let lastReportedProgress = 15;

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        clipTitle,
        audioUrl: relativeAudioPath, // Relative path from public/ (for staticFile)
        transcript,
        startTime,
        endTime,
      },
      onProgress: ({ progress }) => {
        const percent = Math.round(progress * 100);

        // Log every 10%
        if (percent % 10 === 0 && percent !== lastReportedProgress) {
          logger.info({ clipId, progress: percent }, 'Render progress');
        }

        // Update database every 5% to show smooth progress bar
        if (percent >= lastReportedProgress + 5 || percent === 100) {
          lastReportedProgress = percent;
          updateClipProgress(clipId, percent);
        }
      },
    });

    logger.info({ clipId, outputPath }, 'Video rendered');

    // Upload to R2
    logger.info({ clipId }, 'Uploading to R2...');
    const videoUrl = await uploadToR2(outputPath, `videos/${clipId}.mp4`);

    logger.info({ clipId, videoUrl }, 'Upload complete');

    // Clean up
    fs.unlinkSync(audioPath);
    fs.unlinkSync(outputPath);

    return videoUrl;

  } catch (error) {
    logger.error({ clipId, error: error.message, stack: error.stack }, 'Render failed');

    // Clean up on error
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    throw error;
  }
}

module.exports = { renderVideo };
