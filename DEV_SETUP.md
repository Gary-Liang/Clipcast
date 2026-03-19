# Local Development Setup

## Running the App Locally

**IMPORTANT**: You need **TWO servers** running simultaneously for full functionality:

### Server 1: Next.js App (Port 3000)
```bash
cd /path/to/PodcastToClip
npm run dev
```
- Runs on http://localhost:3000
- Handles: UI, API routes, auth, uploads, transcription, clip detection

### Server 2: Render Service (Port 3001)
```bash
cd /path/to/PodcastToClip/render-service
npm start
```
- Runs on http://localhost:3001
- Handles: Video generation with Remotion + Chrome

### Quick Start Script (Future Enhancement)
Consider adding to `package.json`:
```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run dev\" \"npm --prefix render-service start\""
  }
}
```

Requires: `npm install -g concurrently`

---

## Environment Variables Required

### Root `.env.local` (Next.js App)
```bash
# Database (Supabase with connection pooling)
DATABASE_URL=postgresql://postgres.PROJECT_ID:PASSWORD@aws-region.pooler.supabase.com:6543/postgres?pgbouncer=true

# Deepgram
DEEPGRAM_API_KEY=...

# Anthropic (Claude)
ANTHROPIC_API_KEY=...

# Cloudflare R2
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...

# Clerk (Auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...

# Stripe (Payments)
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID_PRO=...

# Inngest (Background Jobs)
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# App URLs
NEXT_PUBLIC_URL=http://localhost:3000
RENDER_SERVICE_URL=http://localhost:3001  # Points to local render service
```

### Render Service `.env` (Express + Remotion)
```bash
PORT=3001
NEXT_PUBLIC_URL=http://localhost:3000  # Points back to Next.js app
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
```

---

## Common Issues

### Video Generation Fails with "fetch failed"
**Cause**: Render service not running on port 3001

**Fix**:
```bash
cd render-service && npm start
```

### "Too many clients already" Database Error
**Cause**: Missing `?pgbouncer=true` parameter in DATABASE_URL

**Fix**: Add `?pgbouncer=true` to the end of your Supabase connection string

### Server Action Not Found Error
**Cause**: Next.js hot reload cache issue

**Fix**:
```bash
rm -rf .next
npm run dev
```
Then hard refresh browser (Ctrl+Shift+R)

---

## Testing Checklist

Before considering local setup complete:

- [ ] Next.js app starts on port 3000
- [ ] Render service starts on port 3001
- [ ] Can sign in/sign up (Clerk works)
- [ ] Dashboard loads without database errors
- [ ] Can upload an MP3 file
- [ ] File uploads to R2 successfully
- [ ] Transcription completes (Deepgram)
- [ ] Clips are detected (Claude)
- [ ] Video generation works (Remotion)
- [ ] Can download generated video
- [ ] Sign out works (redirects to home)

---

## Known UX Issues (To Fix Later)

### Logout Feels Laggy
**Issue**: After clicking logout, dashboard briefly visible before redirect to home page

**Temporary Workaround**: This is expected behavior with Clerk middleware

**Proper Fix** (future):
1. Add loading spinner on logout button click
2. Disable page interaction during logout
3. Or use Clerk's `afterSignOutUrl` with immediate client-side redirect

**Priority**: Low (doesn't affect functionality)

---

**Last Updated**: March 18, 2026
