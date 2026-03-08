# Setup Guide - Podcast to Clips

## Quick Start

Follow these steps to get your development environment running:

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual credentials.

#### Required Services:

**PostgreSQL Database:**
- Local: Install PostgreSQL and create a database
- Cloud: Use services like Neon, Supabase, or Railway
- Example: `postgresql://user:password@localhost:5432/podcasttoclip`

**Deepgram API:**
1. Sign up at https://deepgram.com
2. Create an API key from your dashboard
3. Copy the key to `DEEPGRAM_API_KEY`

**Cloudflare R2:**
1. Log in to Cloudflare dashboard
2. Go to R2 Object Storage
3. Create a new bucket (e.g., "podcasttoclip")
4. Generate API tokens with "Edit" permissions
5. Configure CORS on your bucket:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"]
  }
]
```

6. Get your account ID from the R2 dashboard
7. R2 endpoint format: `https://<account-id>.r2.cloudflarestorage.com`

### 2. Install Dependencies

Already done! If you need to reinstall:

```bash
npm install
```

### 3. Setup Database

Generate Prisma client and sync schema:

```bash
npx prisma generate
npx prisma db push
```

To view your database in a GUI:

```bash
npx prisma studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing the Flow

### Test Upload & Transcription

1. Prepare a short MP3 file (1-2 minutes for quick testing)
2. Go to http://localhost:3000
3. Click "Choose File" and select your MP3
4. Click "Upload & Transcribe"
5. You'll be redirected to the job status page
6. The page will poll every 5 seconds until complete
7. View the formatted transcript

### Expected Timeline

- **Upload:** Instant (direct to R2)
- **Transcription:** ~30 seconds per minute of audio
- **Total:** 2-3 minutes for a 3-minute podcast

### Troubleshooting

**"Failed to initiate upload"**
- Check `.env.local` has all R2 variables set
- Verify R2 credentials are correct
- Check R2 bucket exists

**"Failed to start transcription"**
- Verify `DEEPGRAM_API_KEY` is set
- Check Deepgram account has credits
- View browser console for detailed errors

**"Job not found"**
- Check `DATABASE_URL` is correct
- Run `npx prisma db push` to sync schema
- View Prisma Studio to verify job exists

**Database connection errors**
- Ensure PostgreSQL is running
- Test connection string with `npx prisma studio`
- Check firewall settings if using remote database

## Development Workflow

### View Logs

The application uses Pino for logging. In development mode, logs are pretty-printed:

```bash
npm run dev
```

Watch for:
- `[INFO]` - Normal operations
- `[WARN]` - Retries and recoverable errors
- `[ERROR]` - Failures that need attention

### Database Management

**View data:**
```bash
npx prisma studio
```

**Reset database:**
```bash
npx prisma db push --force-reset
```

**Update schema:**
1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Run `npx prisma generate`

### API Testing with curl

**Upload:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.mp3","fileSize":5242880}'
```

**Transcribe:**
```bash
curl -X POST http://localhost:3000/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"jobId":"YOUR_JOB_ID"}'
```

**Job Status:**
```bash
curl http://localhost:3000/api/jobs/YOUR_JOB_ID
```

## Next Steps

Once Phase 1 is working:

1. **Test with real podcasts** (5-30 minute episodes)
2. **Verify transcript quality** (speaker detection, timestamps)
3. **Ready for Phase 2:** Clip detection with AI

## Phase 2 Preview

The next phase will add:
- OpenAI/Claude integration for clip detection
- Parse transcript to find viral moments
- Store clips in database
- UI to view detected clips

The current architecture is ready - just add:
- `src/lib/services/clip-detection.service.ts`
- Update UI to display clips
- Add clip generation controls
