/**
 * Standalone script to render videos using Remotion
 * This runs outside of Next.js webpack context to avoid conflicts
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, getCompositions } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get config file path from command line
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node render-video.mjs <config-file-path>');
  process.exit(1);
}

const configFilePath = args[0];

async function renderVideo() {
  let config;

  try {
    const configJson = await readFile(configFilePath, 'utf-8');
    config = JSON.parse(configJson);
  } catch (error) {
    console.error(`Failed to read config file: ${configFilePath}`, error.message);
    process.exit(1);
  }

  try {
    console.log('[Remotion] Starting video generation...');
    console.log('[Remotion] Config:', JSON.stringify(config, null, 2));

    // Bundle the Remotion project
    console.log('[Remotion] Bundling project...');
    const bundleLocation = await bundle({
      entryPoint: path.resolve(process.cwd(), "src/remotion/Root.tsx"),
      webpackOverride: (config) => config,
    });

    if (!bundleLocation) {
      throw new Error('Bundle location is undefined');
    }

    console.log('[Remotion] Bundle complete:', bundleLocation);

    // Get compositions
    console.log('[Remotion] Getting compositions...');
    const compositions = await getCompositions(bundleLocation, {
      inputProps: {
        clipTitle: config.clipTitle,
        audioUrl: config.audioUrl,
        transcript: config.transcript,
        startTime: config.startTime,
        endTime: config.endTime,
      },
    });

    console.log(`[Remotion] Found ${compositions.length} composition(s)`);

    const composition = await selectComposition({
      id: "PodcastClip",
      serveUrl: bundleLocation,
      inputProps: {
        clipTitle: config.clipTitle,
        audioUrl: config.audioUrl,
        transcript: config.transcript,
        startTime: config.startTime,
        endTime: config.endTime,
      },
      compositionId: "PodcastClip",
    });

    if (!composition) {
      throw new Error('PodcastClip composition not found');
    }

    // Calculate duration
    const clipDuration = config.endTime - config.startTime;
    const fps = 30;
    const durationInFrames = Math.ceil(clipDuration * fps);

    console.log(`[Remotion] Clip duration: ${clipDuration}s (${durationInFrames} frames)`);

    // Render video
    console.log('[Remotion] Rendering video...');
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames,
      },
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: config.outputPath,
      inputProps: {
        clipTitle: config.clipTitle,
        audioUrl: config.audioUrl,
        transcript: config.transcript,
        startTime: config.startTime,
        endTime: config.endTime,
      },
      onProgress: ({ progress, renderedFrames, encodedFrames, totalFrames }) => {
        const percentage = Math.round(progress * 100);
        console.log(`[Remotion Progress] ${percentage}% - Rendered: ${renderedFrames}/${totalFrames}, Encoded: ${encodedFrames}/${totalFrames}`);
        // Output progress in a parseable format
        console.log(`PROGRESS:${percentage}`);
      },
    });

    console.log('[Remotion] Video rendered successfully:', config.outputPath);
    process.exit(0);
  } catch (error) {
    console.error('[Remotion] Error:', error.message);
    console.error('[Remotion] Stack:', error.stack);
    process.exit(1);
  }
}

renderVideo();
