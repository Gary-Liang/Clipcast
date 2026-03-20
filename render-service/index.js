require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pino = require('pino');
const { renderVideo } = require('./render');

const logger = pino({ level: 'info' });
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Render endpoint
app.post('/render', async (req, res) => {
  const startTime = Date.now();

  try {
    const { clipId, clipTitle, audioUrl, transcript, startTime: clipStart, endTime: clipEnd, callbackUrl } = req.body;

    // Validate request
    if (!clipId || !audioUrl || !transcript || clipStart === undefined || clipEnd === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: clipId, audioUrl, transcript, startTime, endTime'
      });
    }

    logger.info({ clipId, clipTitle }, 'Received render request');

    // Start rendering (don't wait for completion in request)
    res.status(202).json({
      message: 'Render job accepted',
      clipId,
      status: 'processing'
    });

    // Process in background
    renderVideo({
      clipId,
      clipTitle,
      audioUrl,
      transcript,
      startTime: clipStart,
      endTime: clipEnd,
      callbackUrl, // Optional webhook to call when done
    }).then((videoUrl) => {
      const duration = Date.now() - startTime;
      logger.info({ clipId, videoUrl, duration }, 'Render completed');

      // Call webhook if provided
      if (callbackUrl) {
        const webhookSecret = process.env.RENDER_WEBHOOK_SECRET;
        const authHeader = webhookSecret ? `Bearer ${webhookSecret}` : '';

        logger.info({
          clipId,
          callbackUrl,
          hasSecret: !!webhookSecret,
          secretLength: webhookSecret?.length,
          secretPrefix: webhookSecret?.substring(0, 10),
          authHeaderLength: authHeader.length,
          authHeaderPrefix: authHeader.substring(0, 20),
        }, 'Sending webhook (success)');

        fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            clipId,
            videoUrl,
            status: 'completed',
            duration
          }),
        })
          .then(async (response) => {
            const responseText = await response.text();
            logger.info({
              clipId,
              status: response.status,
              statusText: response.statusText,
              responseBody: responseText.substring(0, 200),
            }, 'Webhook response received');
          })
          .catch(err => {
            logger.error({ clipId, error: err.message, stack: err.stack }, 'Webhook failed');
          });
      }
    }).catch((error) => {
      const duration = Date.now() - startTime;
      logger.error({ clipId, error: error.message, duration }, 'Render failed');

      // Call webhook with error if provided
      if (callbackUrl) {
        const webhookSecret = process.env.RENDER_WEBHOOK_SECRET;
        const authHeader = webhookSecret ? `Bearer ${webhookSecret}` : '';

        logger.info({
          clipId,
          callbackUrl,
          hasSecret: !!webhookSecret,
          secretLength: webhookSecret?.length,
          secretPrefix: webhookSecret?.substring(0, 10),
          authHeaderLength: authHeader.length,
          authHeaderPrefix: authHeader.substring(0, 20),
        }, 'Sending webhook (error)');

        fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            clipId,
            status: 'failed',
            error: error.message,
            duration
          }),
        })
          .then(async (response) => {
            const responseText = await response.text();
            logger.info({
              clipId,
              status: response.status,
              statusText: response.statusText,
              responseBody: responseText.substring(0, 200),
            }, 'Error webhook response received');
          })
          .catch(err => {
            logger.error({ clipId, error: err.message, stack: err.stack }, 'Error webhook failed');
          });
      }
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Request handling error');
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info({
    port: PORT,
    hasWebhookSecret: !!process.env.RENDER_WEBHOOK_SECRET,
    webhookSecretLength: process.env.RENDER_WEBHOOK_SECRET?.length,
    nextPublicUrl: process.env.NEXT_PUBLIC_URL,
  }, 'Render service started');
});
