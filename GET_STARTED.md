# Get Started - Complete Setup Checklist

Follow these steps in order to get your Podcast to Clips app running.

## ✅ Step 1: Start PostgreSQL with Docker

```bash
# Start PostgreSQL container
npm run docker:up

# Verify it's running
docker-compose ps
```

**Expected output:**
```
NAME                   STATUS    PORTS
podcasttoclip-db      Up        0.0.0.0:5432->5432/tcp
```

---

## ✅ Step 2: Create .env.local

```bash
# Copy the example file
cp .env.local.example .env.local
```

**Edit `.env.local` with your credentials:**

### Database (Already configured for Docker!)
```bash
DATABASE_URL=postgresql://podcastuser:podcastpass123@localhost:5432/podcasttoclip
```
✅ This works with the Docker setup - no changes needed!

### Deepgram API
1. Sign up at https://deepgram.com
2. Go to API Keys section
3. Create a new API key
4. Copy and paste into `.env.local`:

```bash
DEEPGRAM_API_KEY=your_actual_key_here
```

### Cloudflare R2
1. Log into Cloudflare Dashboard
2. Go to **R2 Object Storage**
3. Create a bucket (name: `podcasttoclip`)
4. Click **Manage R2 API Tokens**
5. Create token with "Edit" permissions
6. Copy the credentials:

```bash
R2_ENDPOINT=https://xxxxxxxxxxxxxxxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=podcasttoclip
```

7. **Configure CORS on your bucket:**
   - Go to your bucket settings
   - Add CORS policy:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

### Optional: R2 Public Domain
If you want public URLs for transcripts, configure a custom domain in R2 settings and add:
```bash
R2_PUBLIC_DOMAIN=your-domain.com
```

**If you don't have this, just leave it commented out or omit it - the app will work fine!**

---

## ✅ Step 3: Validate Your Configuration

```bash
npm run validate
```

This script will:
- ✅ Check if all required env vars are set
- ✅ Test database connection
- ✅ Validate Deepgram API key format
- ✅ Check R2 configuration
- ✅ Give you helpful tips if anything is wrong

**Fix any errors before continuing!**

---

## ✅ Step 4: Initialize Database

```bash
npm run db:push
```

This creates all the tables (Job, Clip) in your database.

**Verify it worked:**
```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555 - you should see empty Job and Clip tables.

---

## ✅ Step 5: Start the App

```bash
npm run dev
```

Open http://localhost:3000

---

## ✅ Step 6: Test Upload & Transcription

1. **Prepare a test file:**
   - Use a short MP3 (1-2 minutes for quick testing)
   - Max 100MB file size

2. **Upload:**
   - Go to http://localhost:3000
   - Click "Choose File"
   - Select your MP3
   - Click "Upload & Transcribe"

3. **Monitor progress:**
   - You'll be redirected to the job status page
   - Status will update every 5 seconds
   - Watch the terminal logs for details

4. **View results:**
   - When status shows "Transcription Complete"
   - You'll see the formatted transcript with timestamps
   - Format: `[00:01:23] Speaker 1: "text"`

---

## 🎯 What to Expect

### Upload Timeline
- **Small file (5MB):** ~10 seconds
- **Medium file (25MB):** ~30 seconds
- **Large file (100MB):** ~2 minutes

### Transcription Timeline
- **Per minute of audio:** ~30 seconds
- **3-minute podcast:** ~1.5 minutes total
- **30-minute podcast:** ~15 minutes total

### Terminal Logs
Watch for:
```
[INFO] Creating upload job
[INFO] Generated upload URL
[INFO] Starting transcription with Deepgram
[INFO] Transcription completed
[INFO] Saved transcript to storage
```

---

## 🔧 Troubleshooting

### "Failed to initiate upload"
```bash
# Check R2 config
npm run validate

# Verify bucket exists in Cloudflare dashboard
# Check CORS is configured
```

### "Database connection failed"
```bash
# Check Docker is running
docker-compose ps

# Restart database
npm run docker:down
npm run docker:up

# Check logs
npm run docker:logs
```

### "Failed to start transcription"
```bash
# Verify Deepgram key
npm run validate

# Check account has credits at deepgram.com
# View detailed error in browser console
```

### Port 5432 already in use
```bash
# Stop other PostgreSQL instance
# Or change port in docker-compose.yml to 5433
# Then update DATABASE_URL in .env.local
```

---

## 📋 Quick Command Reference

| Task | Command |
|------|---------|
| Start database | `npm run docker:up` |
| Stop database | `npm run docker:down` |
| Validate config | `npm run validate` |
| Init database | `npm run db:push` |
| View database | `npm run db:studio` |
| Start app | `npm run dev` |
| View DB logs | `npm run docker:logs` |

---

## ✨ You're Ready!

Once all steps pass:
1. ✅ Docker PostgreSQL running
2. ✅ `.env.local` configured
3. ✅ Validation passes
4. ✅ Database initialized
5. ✅ App running at localhost:3000

**Try uploading your first podcast!** 🎙️

---

## 🚀 Next Phase

After Phase 1 works:
- **Phase 2:** AI clip detection (find viral moments)
- **Phase 3:** Video generation with waveforms + captions
- **Phase 4:** User auth + Stripe payments
