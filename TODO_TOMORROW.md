# TODO - Tomorrow's Session (March 17, 2026)

## Immediate Goal
Complete Supabase database migration and get production working.

---

## Option 1: Wait & Retry (Easiest)
Supabase project might just need time to initialize.

```bash
cd /c/Users/gary-/Documents/MyProjects/PodcastToClip
npx prisma db push --accept-data-loss
```

**If successful**:
- Test locally: `npm run dev`
- Update Vercel env var: `DATABASE_URL`
- Deploy to Vercel
- Test end-to-end in production

---

## Option 2: Supabase CLI (If Option 1 Fails)
More reliable than dashboard for initialization issues.

### Install & Setup
```bash
npm install -g supabase
supabase login
```

### Get Project ID
- Go to Supabase dashboard → Project Settings → General
- Copy "Reference ID"

### Link & Push
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Then try Prisma push again:
```bash
npx prisma db push
```

---

## Option 3: Fresh Supabase Project (Nuclear Option)
If the project has persistent initialization errors:

1. Delete current Supabase project
2. Create new one (different name, e.g. `clipcast-prod`)
3. Wait 5-10 minutes for full initialization
4. Get Transaction pooler connection string (port 6543)
5. Update `.env` and `.env.local` with new connection string
6. Run `npx prisma db push`

---

## After Schema is Pushed

### 1. Test Locally
```bash
npm run dev
```

Visit `http://localhost:3000` and verify:
- [ ] Dashboard loads (no "User table doesn't exist" error)
- [ ] Can sign in/up (Clerk still works)
- [ ] Upload a small test file
- [ ] Verify job progresses through all stages

### 2. Update Vercel Environment Variables
Go to Vercel dashboard → Your project → Settings → Environment Variables

Update `DATABASE_URL` to Supabase connection string:
```
postgresql://postgres.xgloodrnnkaksihbsqqh:qUCa5b%24Kuz37k.z@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

**Important**: Use the same URL-encoded password with `%24` for `$`

### 3. Redeploy to Vercel
Either:
- Push a commit to trigger automatic deployment
- Or use Vercel dashboard → Deployments → Redeploy

### 4. Update Railway Render Service
Railway render service needs `NEXT_PUBLIC_URL` env var to call webhook back to Vercel.

Go to Railway → Your render service → Variables

Verify this exists:
```
NEXT_PUBLIC_URL=https://clipcast-three.vercel.app
```

### 5. Test Production End-to-End
1. Go to `https://clipcast-three.vercel.app`
2. Sign in
3. Upload a test MP3 (small file, ~5-10MB)
4. Watch it progress through:
   - ✅ Upload (chunked)
   - ✅ Transcription (Deepgram)
   - ✅ Clip detection (Claude)
   - ✅ Video generation (Railway Remotion)
   - ✅ Webhook callback (Railway → Vercel)
   - ✅ Video available for download
5. Check Railway logs - should NOT see "Webhook failed" anymore
6. Upload 2-3 more files to stress test connection pooling

---

## Success Criteria

- [ ] Local dev works with Supabase
- [ ] Vercel production works with Supabase
- [ ] No more "too many clients" errors
- [ ] Multiple concurrent uploads work
- [ ] Railway webhook successfully calls Vercel
- [ ] Videos complete and are downloadable

---

## If Things Still Don't Work

### Issue: Supabase Still Showing Errors
- Try Supabase CLI instead of dashboard
- Check Supabase status page: https://status.supabase.com
- Create fresh project

### Issue: Connection Still Times Out
- Verify password is URL-encoded correctly
- Check firewall/antivirus isn't blocking port 6543
- Try direct connection (port 5432) temporarily just to test credentials

### Issue: "Too Many Clients" Still Happening
- Verify you're using port 6543 (pooled), not 5432 (direct)
- Check connection string has `pooler.supabase.com` in domain
- Look for any hardcoded Railway connection strings in codebase

### Issue: Vercel Deployment Fails
- Check build logs for Prisma errors
- Verify `DATABASE_URL` is set in Vercel env vars
- Make sure build script doesn't include `prisma db push`

---

## Files to Check

If you need to verify connection strings:

```bash
# Check what Prisma CLI uses
cat .env

# Check what Next.js uses
cat .env.local

# Should both be the same Supabase connection string
```

---

## Current Connection String (For Reference)

**Supabase Transaction Pooler:**
```
postgresql://postgres.xgloodrnnkaksihbsqqh:qUCa5b%24Kuz37k.z@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

**Supabase Project Details:**
- Username: `postgres.xgloodrnnkaksihbsqqh`
- Password: `qUCa5b$Kuz37k.z` (raw) / `qUCa5b%24Kuz37k.z` (URL-encoded)
- Host: `aws-1-us-east-1.pooler.supabase.com`
- Port: `6543` (pooled) or `5432` (direct)
- Database: `postgres`

---

## Alternative: If Supabase Doesn't Work

### Try Neon (New Account)
- Sign up with different email
- Create database
- Get connection string (automatically pooled)
- Update env vars
- Run prisma db push

### Try Turso (SQLite)
- Would require schema changes (SQLite vs PostgreSQL)
- Only if desperate

---

**Status**: Migration 80% complete, just needs Supabase to finish initializing
**Blockers**: Supabase internal error, likely needs time or CLI approach
**ETA**: 30 minutes to complete once Supabase is ready
