# Clipcast

Convert audio-only podcasts into short-form video clips for TikTok/Reels/Shorts.

## Overview

**Clipcast** is a full-stack SaaS application that automatically converts long-form podcast audio into viral-ready short-form video clips optimized for TikTok, Instagram Reels, and YouTube Shorts.

### Key Features
- 🎙️ **Upload podcasts** up to 150MB (chunked upload)
- 📝 **AI-powered transcription** with word-level timestamps (Deepgram)
- 🎯 **Intelligent clip detection** finds 3-5 viral moments per podcast (Claude AI)
- 🎬 **Automated video generation** with animated waveforms & captions (Remotion)
- 📊 **Real-time progress tracking** for all processing stages
- 🔐 **User authentication** and protected routes (Clerk)
- 💳 **Freemium model** with Stripe integration (3 free clips, Pro plan unlimited)
- 📈 **Usage tracking** and plan management

## Current Status

### ✅ Phase 1-4: IMPLEMENTED

**Phase 1:** Transcription Pipeline ✅
- Chunked file upload (5MB chunks, 100MB+ support)
- Cloudflare R2 storage
- Deepgram transcription with word-level timestamps
- Job status tracking with real-time polling

**Phase 2:** AI Clip Detection ✅
- Claude Sonnet 4.5 integration
- Viral moment identification
- Scoring & categorization
- Timestamp validation

**Phase 3:** Video Generation ✅
- Remotion-based rendering (9:16 aspect ratio)
- Animated waveforms
- Word-level captions
- Progress tracking (0-100%)

**Phase 4:** MVP Infrastructure ✅
- Clerk authentication
- Stripe payments (configured)
- Inngest background jobs (configured)
- User dashboard with usage limits

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Clerk
- **Transcription:** Deepgram API (word-level timestamps)
- **AI:** Claude Sonnet 4.5 (clip detection)
- **Video:** Remotion (server-side rendering)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Payments:** Stripe (Checkout + Webhooks)
- **Jobs:** Inngest (configured, needs validation)
- **Styling:** Tailwind CSS
- **Logging:** Pino

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or hosted)
- Deepgram API key (sign up at https://deepgram.com)
- Cloudflare R2 bucket configured

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your credentials:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/podcasttoclip

# Deepgram (Transcription)
DEEPGRAM_API_KEY=your_deepgram_api_key

# Anthropic (Claude for clip detection)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Cloudflare R2 (Storage)
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=podcasttoclip
R2_PUBLIC_DOMAIN=your-r2-public-domain.com

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...

# Inngest (Background Jobs)
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# App Configuration
NEXT_PUBLIC_URL=http://localhost:3000
```

### 3. Setup Database

Initialize Prisma and create database tables:

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Complete User Flow

1. **Sign Up / Sign In**
   - Users create an account via Clerk
   - Free tier: 3 clips included
   - Pro tier: Unlimited clips ($29/mo)

2. **Upload Podcast**
   - Navigate to dashboard
   - Select MP3 file (up to 150MB)
   - File uploads in 5MB chunks with progress indicator
   - Job created automatically on upload completion

3. **Transcription**
   - Automatic transcription starts after upload
   - Deepgram processes audio with word-level timestamps
   - Progress indicator shows "Transcribing... 3-5 minutes"
   - Page polls every 5 seconds for status updates

4. **Detect Viral Clips**
   - Click "Detect Viral Clips" button
   - Claude AI analyzes transcript for viral moments
   - Returns 3-5 clips with:
     - Title and description
     - Viral score (1-10)
     - Category (funny, insight, controversial, etc.)
     - Precise timestamps
   - Progress indicator during detection

5. **Generate Videos**
   - Click "Generate Video" on any detected clip
   - Remotion renders 9:16 vertical video with:
     - Animated waveform visualization
     - Word-level captions with timing
     - Professional branding
   - Real-time progress bar (0-100%)
   - Updates every 0.5 seconds

6. **Download & Share**
   - Video preview in browser
   - Download MP4 file
   - Optimized for TikTok, Reels, Shorts

### Usage Limits

- **Free Tier:** 3 video clips per account
- **Pro Tier:** Unlimited clips
- Usage counter visible in dashboard
- Upgrade prompt when limit reached

### API Endpoints

#### POST /api/upload-chunk
Upload file in chunks (5MB each).

**Request (FormData):**
```
chunk: Blob
chunkIndex: number
totalChunks: number
filename: string
fileSize: number
jobId: string (optional, only after first chunk)
```

**Response:**
```json
{
  "jobId": "abc123",
  "complete": false,
  "success": true
}
```

#### POST /api/transcribe
Start transcription for an uploaded file.

**Request:**
```json
{
  "jobId": "abc123"
}
```

**Response:**
```json
{
  "jobId": "abc123",
  "status": "TRANSCRIBING"
}
```

#### POST /api/detect-clips
Detect viral clips from transcribed podcast.

**Request:**
```json
{
  "jobId": "abc123"
}
```

**Response:**
```json
{
  "jobId": "abc123",
  "status": "DETECTING_CLIPS",
  "clipsDetected": 5
}
```

#### POST /api/generate-videos
Generate video for a specific clip.

**Request:**
```json
{
  "clipId": "clip_123"
}
```

**Response:**
```json
{
  "clipId": "clip_123",
  "status": "GENERATING"
}
```

#### GET /api/jobs/:jobId
Get job status, transcript, and detected clips.

**Response:**
```json
{
  "id": "abc123",
  "filename": "podcast-episode.mp3",
  "fileSize": 52428800,
  "status": "CLIPS_DETECTED",
  "transcript": "Full transcript...",
  "duration": 3600.5,
  "clips": [
    {
      "id": "clip_1",
      "title": "Viral Moment Title",
      "description": "Why this will go viral...",
      "startTime": 120.5,
      "endTime": 150.0,
      "status": "PENDING",
      "progress": 0,
      "videoUrl": null
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:05:00Z"
}
```

#### GET /api/clips/:clipId
Get individual clip with video URL.

**Response:**
```json
{
  "id": "clip_1",
  "title": "Viral Moment Title",
  "startTime": 120.5,
  "endTime": 150.0,
  "status": "COMPLETE",
  "progress": 100,
  "videoUrl": "https://r2-domain.com/videos/clip_1.mp4"
}
```

## Transcript Format

The transcription service formats output for AI clip detection:

```
[00:00:12] Speaker 1: "Welcome to the podcast today."

[00:00:18] Speaker 2: "Thanks for having me."

[00:00:25] Speaker 1: "Let's dive into the topic..."
```

This format includes:
- **Timestamps:** [HH:MM:SS]
- **Speaker labels:** Speaker 1, Speaker 2, etc.
- **Quoted text:** Full utterance with punctuation

## Project Structure

```
PodcastToClip/
├── prisma/
│   └── schema.prisma           # Database schema
├── src/
│   ├── app/
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Job status pages
│   │   ├── layout.tsx
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── FileUpload.tsx
│   │   └── JobStatus.tsx
│   ├── lib/
│   │   ├── services/           # Business logic
│   │   └── db/                 # Database client
│   ├── types/                  # TypeScript types
│   └── utils/                  # Utilities
├── .env.example
├── package.json
└── README.md
```

## Database Schema

### Job Model
- `id`: Unique job identifier
- `filename`: Original MP3 filename
- `fileSize`: File size in bytes
- `status`: Job status (PENDING_UPLOAD, TRANSCRIBING, etc.)
- `audioUrl`: Presigned URL to audio file
- `transcript`: Formatted transcript text
- `transcriptUrl`: Public URL to transcript (optional)
- `duration`: Audio duration in seconds
- `error`: Error message if failed

### Clip Model (for Phase 2)
- `id`: Unique clip identifier
- `jobId`: Reference to parent job
- `title`: Clip title
- `description`: Clip description
- `startTime`: Start time in seconds
- `endTime`: End time in seconds
- `videoUrl`: Generated video URL
- `status`: Clip generation status

## Error Handling

All errors return a consistent format:

```json
{
  "error": "Human-readable error message",
  "details": "ERROR_CODE"
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid input
- `NOT_FOUND`: Resource not found
- `TRANSCRIPTION_ERROR`: Deepgram API failure
- `STORAGE_ERROR`: R2 storage failure

## Retry Logic

The transcription service implements exponential backoff retry:
- **Attempt 1:** Immediate
- **Attempt 2:** Wait 2 seconds
- **Attempt 3:** Wait 4 seconds
- **Attempt 4:** Wait 8 seconds (if maxRetries=4)

## Known Issues & Validation Needed

### ⚠️ Needs Testing/Validation:
- **Inngest Jobs:** Code exists but currently using fire-and-forget processing
- **Stripe Flow:** End-to-end payment/subscription flow not validated
- **Usage Limits:** Free tier limit enforcement (3 clips) not fully tested
- **Clerk Webhooks:** User sync webhook needs production testing

### 🎨 UX/UI Improvements Needed:
- Landing page polish
- Better error messaging
- Loading states consistency
- Mobile responsiveness
- Clip preview thumbnails

## Next Steps (Phase 5+)

- [ ] Migrate to Inngest for reliable background job processing
- [ ] Test and validate Stripe integration end-to-end
- [ ] Add email notifications (Resend)
- [ ] Implement clip editing capabilities
- [ ] Add social sharing features
- [ ] Team workspaces and collaboration
- [ ] Analytics dashboard
- [ ] Custom branding options

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Generate Prisma client
npx prisma generate

# Push database schema changes
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Recent Improvements (Feb 2026)

### Performance & Reliability
- ✅ Chunked upload system (fixes 100MB+ file handling)
- ✅ Config file approach for video rendering (fixes Windows ENAMETOOLONG)
- ✅ Optimized polling intervals (0.5s for video, 5s for transcription)
- ✅ Proper cleanup of temporary files

### User Experience
- ✅ Real-time progress indicators for all stages
- ✅ Upload: "Chunk X/Y" progress
- ✅ Transcription: Estimated time remaining
- ✅ Video generation: 0-100% progress bar with smooth updates
- ✅ Automatic page refresh when complete

### Bug Fixes
- ✅ Word-level timestamps now saved from Deepgram
- ✅ Video generation parameter passing fixed
- ✅ Database progress updates working correctly
- ✅ Polling stops after completion/failure

## Troubleshooting

### Upload Fails
- **Large files (100MB+):** Chunked upload should handle automatically
- **CORS errors:** Check R2 bucket CORS configuration
- **Timeout:** Verify `maxDuration` set to 300s in route.ts

### Transcription Issues
- **Authentication error:** Verify `DEEPGRAM_API_KEY` is correct
- **No word-level timestamps:** Check Deepgram response format
- **Credits exhausted:** Top up Deepgram account

### Video Generation Fails
- **ENAMETOOLONG error:** Should be fixed with config file approach
- **Progress stuck at 0%:** Check Remotion render logs
- **Failed to upload:** Verify R2 credentials and bucket permissions

### Database Errors
- **Connection refused:** Verify PostgreSQL is running
- **Schema out of sync:** Run `npx prisma db push`
- **Migration issues:** Run `npx prisma generate` then `npx prisma db push`

### Authentication Issues
- **Webhook not firing:** Check Clerk webhook URL and secret
- **User not syncing:** Verify Clerk webhook endpoint is accessible
- **Protected routes not working:** Check middleware.ts configuration

## License

Private project - All rights reserved.
