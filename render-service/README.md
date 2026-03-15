# Clipcast Render Service

Standalone video rendering service using Remotion. Deployed separately on Railway.

## Architecture

```
Next.js (Vercel) → POST /render → Render Service (Railway) → R2 Storage
                                        ↓
                                   Webhook callback (optional)
```

## API

### POST /render

Accepts a render job and processes it asynchronously.

**Request:**
```json
{
  "clipId": "abc123",
  "clipTitle": "Clip Title",
  "audioUrl": "https://...",
  "transcript": [{ "word": "hello", "start": 0, "end": 0.5 }],
  "startTime": 0,
  "endTime": 30,
  "callbackUrl": "https://your-app.com/api/webhooks/render-complete" // optional
}
```

**Response (202 Accepted):**
```json
{
  "message": "Render job accepted",
  "clipId": "abc123",
  "status": "processing"
}
```

### GET /health

Health check endpoint.

## Environment Variables

```bash
PORT=3001
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=xxx
R2_PUBLIC_DOMAIN=https://xxx.r2.dev
```

## Local Development

1. Copy `.env.example` to `.env` and fill in values
2. Run `npm install`
3. Run `npm start`

## Deployment to Railway

1. Create Railway project
2. Connect GitHub repo
3. Set environment variables in Railway dashboard
4. Deploy!

Railway will auto-detect Node.js and use `npm start`.

## Scaling

- Start with 1 instance (512MB RAM)
- Scale vertically (increase RAM) as needed
- Scale horizontally (add instances) for high volume
