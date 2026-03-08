# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
- PostgreSQL database URL
- Deepgram API key
- Cloudflare R2 credentials

### Step 2: Setup Database

```bash
npm run db:push
```

### Step 3: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 📋 Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Run production build

# Database
npm run db:push          # Sync schema to database
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open database GUI
npm run db:reset         # Reset database (WARNING: deletes data)

# Code Quality
npm run lint             # Run ESLint
npx tsc --noEmit         # Check TypeScript
```

---

## 🔑 Required API Keys

### Deepgram (Transcription)
1. Sign up: https://deepgram.com
2. Get API key from dashboard
3. Add to `.env.local`: `DEEPGRAM_API_KEY=...`

### Cloudflare R2 (Storage)
1. Create R2 bucket in Cloudflare dashboard
2. Generate API token with Edit permissions
3. Configure CORS for localhost:3000
4. Add to `.env.local`:
   - `R2_ENDPOINT`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`

### PostgreSQL (Database)
**Local:**
```bash
# Install PostgreSQL, then:
createdb podcasttoclip
# URL: postgresql://localhost:5432/podcasttoclip
```

**Cloud Options:**
- **Neon**: https://neon.tech (recommended, free tier)
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app

---

## 🧪 Test the Flow

1. **Prepare test file**: Short MP3 (1-2 min for quick test)
2. **Navigate**: http://localhost:3000
3. **Upload**: Select MP3 and click "Upload & Transcribe"
4. **Monitor**: Watch job status page (polls every 5s)
5. **View**: Check formatted transcript with timestamps

**Expected time**: ~30 seconds per minute of audio

---

## 🐛 Common Issues

### "Failed to initiate upload"
- ✅ Check R2 credentials in `.env.local`
- ✅ Verify bucket exists
- ✅ Configure CORS on bucket

### "Failed to start transcription"
- ✅ Verify Deepgram API key
- ✅ Check account has credits
- ✅ View browser console for details

### "Database connection error"
- ✅ Ensure PostgreSQL is running
- ✅ Test with `npm run db:studio`
- ✅ Verify `DATABASE_URL` format

---

## 📁 Project Structure

```
PodcastToClip/
├── src/
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   │   ├── upload/       # POST /api/upload
│   │   │   ├── transcribe/   # POST /api/transcribe
│   │   │   └── jobs/[id]/    # GET /api/jobs/:id
│   │   ├── dashboard/        # Job status pages
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   ├── lib/
│   │   ├── services/         # Business logic
│   │   └── db/               # Database client
│   ├── types/                # TypeScript types
│   └── utils/                # Helpers
├── prisma/
│   └── schema.prisma         # Database schema
├── .env.local                # Your config (create this!)
└── package.json
```

---

## 🎯 What Phase 1 Does

✅ Upload MP3 files to cloud storage (R2)
✅ Transcribe audio with Deepgram API
✅ Detect speakers automatically
✅ Generate timestamped transcript
✅ Track job status in real-time
✅ Display formatted results

---

## 🔮 Coming Next (Phase 2)

- AI clip detection (find viral moments)
- OpenAI/Claude integration
- Clip preview with timestamps
- Export clip segments

---

## 📚 Documentation

- **README.md**: Full API documentation
- **SETUP.md**: Detailed setup guide
- **IMPLEMENTATION_SUMMARY.md**: Technical overview
- **CLAUDE.md**: Project context

---

## 💡 Pro Tips

1. **Use short files first** - Test with 1-2 min podcasts before full episodes
2. **Watch the logs** - `npm run dev` shows detailed Pino logs
3. **Check Prisma Studio** - `npm run db:studio` to inspect database
4. **Test APIs directly** - Use curl or Postman (examples in README)

---

## ✅ Verification Checklist

Before testing, ensure:

- [ ] `.env.local` created with all variables
- [ ] Database accessible (test with `npm run db:studio`)
- [ ] Deepgram account has credits
- [ ] R2 bucket CORS configured
- [ ] `npm run db:push` completed successfully
- [ ] Dev server running on port 3000

---

## 🆘 Need Help?

1. Check browser console for frontend errors
2. Check terminal logs for backend errors
3. Use `npm run db:studio` to inspect database
4. Verify all environment variables are set
5. Test API endpoints individually with curl

---

**Ready to go? Run `npm run dev` and visit http://localhost:3000** 🎉
