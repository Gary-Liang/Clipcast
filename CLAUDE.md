I'm building a SaaS called "Clipcast" that converts audio-only podcasts into short-form video clips for TikTok/Reels/Shorts.

## Core Flow:
1. User uploads MP3 (chunked upload for files up to 150MB)
2. Transcription (Deepgram) → timestamped transcript with word-level timestamps
3. Clip detection (Claude Sonnet 4.5) → finds 3-5 viral-worthy moments
4. Video generation (Remotion) → 9:16 video with animated waveform + word-level captions
5. User downloads MP4s

## Tech Stack:
- **Frontend:** Next.js 15 with App Router + TypeScript
- **Backend:** Next.js API routes
- **Database:** PostgreSQL with Prisma ORM (migrating to Supabase for connection pooling)
- **Authentication:** Clerk
- **Transcription:** Deepgram API (with word-level timestamps)
- **Clip Detection:** Claude Sonnet 4.5 API
- **Video Generation:** Remotion (server-side rendering)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Background Jobs:** Inngest (configured but needs validation)
- **Payments:** Stripe (configured but needs validation)
- **Styling:** Tailwind CSS

## Implementation Status:

### ✅ Phase 1: Transcription Pipeline (COMPLETE)
- Chunked file upload (5MB chunks, supports 100MB+ files)
- Cloudflare R2 storage integration
- Deepgram transcription with word-level timestamps
- Job status tracking with polling
- Upload progress indicator (chunk X/Y)

### ✅ Phase 2: Clip Detection (COMPLETE)
- Claude Sonnet 4.5 API integration
- Viral clip detection (3-5 clips per podcast)
- Scoring system (1-10 viral potential)
- Category tagging (funny, insight, controversial, etc.)
- Timestamp extraction with validation

### ✅ Phase 3: Video Generation (COMPLETE)
- Remotion-based video rendering (9:16 aspect ratio)
- Animated waveform visualization
- Word-level captions with timing
- Progress tracking (0-100%)
- Automatic upload to R2
- Config file approach (fixes Windows ENAMETOOLONG error)
- Real-time progress updates (polls every 0.5s)

### ✅ Phase 4: MVP Infrastructure (IMPLEMENTED)
**Phase 4.1 - Authentication:**
- ✅ Clerk integration (ClerkProvider, middleware)
- ✅ User model with clerkId, email, name
- ✅ Sign-in/sign-up pages
- ✅ Protected dashboard routes
- ✅ User sync via Clerk webhooks

**Phase 4.2 - Background Jobs:**
- ✅ Inngest client configured
- ✅ Inngest API route (/api/inngest)
- ✅ Job functions created (transcription, clip detection, video generation)
- ⚠️ **NEEDS VALIDATION:** Currently using direct processing, not Inngest events

**Phase 4.3 - Payments:**
- ✅ Stripe client configured
- ✅ Checkout session endpoint
- ✅ Webhook handler for subscription events
- ✅ User model with stripeCustomerId, plan, clipsUsed, clipsLimit
- ✅ Free tier: 3 clips per user
- ✅ Pro plan: Unlimited clips ($29/mo)
- ⚠️ **NEEDS VALIDATION:** End-to-end payment flow not tested

**Phase 4.4 - Dashboard UI:**
- ✅ Landing page
- ✅ Job status page with polling
- ✅ Clip detail page with video player
- ✅ File upload component
- ✅ Progress indicators for all stages
- ✅ Usage counter (X/3 clips used)
- ✅ Terms of Service and Privacy Policy pages
- ✅ Footer component with legal links
- ✅ Compact navigation bar with Upload CTA
- ✅ ClipUsageIndicator component
- ✅ User usage API endpoint

## Recent Fixes:

### Mar 18, 2026 - Custom Domain & Clerk Production Setup:
- Purchased and configured clipcast.tv domain ($25/year .tv TLD)
- Set up Vercel nameservers (avoiding Cloudflare proxy conflicts)
- Updated all environment variables to use clipcast.tv
- Started Clerk production setup (DNS records, Google OAuth)
- Created comprehensive documentation (DEV_SETUP.md, SESSION_2026-03-18.md)

### Mar 17, 2026 - Supabase Migration Complete:
- Installed Supabase CLI via Scoop
- Successfully migrated database from Railway PostgreSQL to Supabase
- Fixed pgBouncer prepared statements issue with `?pgbouncer=true` parameter
- Tested and verified production working without "too many clients" errors
- See MIGRATION_LOG.md for complete details

### Mar 16, 2026 - Production Deployment Fixes:
- Fixed 413 Request Too Large: Reduced chunk size from 5MB to 4MB (Vercel limit)
- Fixed ENOENT directory errors: Removed race condition in upload-chunk route
- Added CORS headers to webhook endpoint for Railway → Vercel communication
- Removed `prisma db push` from build script (was exhausting connections)
- Identified PostgreSQL connection limit as fundamental serverless incompatibility
- Started migration to Supabase (PostgreSQL with pgBouncer pooling)

### Feb 22, 2026 - UI Polish & Legal Pages:
- Added Terms of Service and Privacy Policy pages with @tailwindcss/typography
- Created Footer component with legal links (appears on all pages)
- Updated sign-up page with ToS acceptance text
- Removed personal information from legal documents (generic business contact)
- Improved Navigation component:
  - Replaced "Dashboard" link with prominent "Upload" button (teal gradient)
  - Added ClipUsageIndicator showing "X/3 clips" quota
  - Switched to SVG logo for crisp rendering
  - Made logo clickable (links to / when signed out, /dashboard when signed in)
  - Compact design: 56px logo height, single-row horizontal layout
  - Total topbar height: ~70-80px (compact but readable)
- Created /api/user/usage endpoint for fetching clip usage data
- Logo size iterations for optimal visibility (final: h-14 / 56px)

### Feb 21, 2026 - Core Pipeline Fixes:
- Fixed chunked upload for large files (100MB+)
- Fixed transcription to save word-level timestamps
- Fixed video generation ENAMETOOLONG error (config file approach)
- Added real-time progress indicators:
  - Upload: Shows "Chunk X/Y" progress
  - Transcription: Shows spinner with time estimate
  - Video generation: Shows 0-100% progress bar
- Increased polling frequency to 0.5s for video generation (was 3s)

## Known Issues / TODO:
- ✅ **DATABASE MIGRATION COMPLETE** (Mar 17, 2026) - Migrated to Supabase
  - Using connection pooling (pgBouncer) to prevent "too many clients" errors
  - Connection string includes `?pgbouncer=true` parameter
  - See MIGRATION_LOG.md for full details
- 🎨 **UX: Logout feels laggy** (Mar 17, 2026)
  - Dashboard briefly visible after logout before redirect
  - Affects both dev and production (Clerk middleware timing)
  - Fix: Add loading spinner on logout button click
  - Priority: Low (UX polish, not breaking)
- ⚠️ Inngest jobs not actively used (still fire-and-forget)
- ⚠️ Stripe checkout flow needs end-to-end testing
- ⚠️ Usage limit enforcement not tested
- 📝 ToS acceptance tracking not implemented (plan exists in TOS_ACCEPTANCE_PLAN.md)
- 📧 Email notifications not configured

## Environment Variables Required:
```bash
# Database
DATABASE_URL=postgresql://...

# Deepgram
DEEPGRAM_API_KEY=...

# Anthropic (Claude)
ANTHROPIC_API_KEY=...

# Cloudflare R2
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_DOMAIN=...

# Clerk (Auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...

# Stripe (Payments)
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID_PRO=...

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# App
NEXT_PUBLIC_URL=http://localhost:3000
```

## Next Steps:
1. **Deployment planning** (prepare for production)
2. Validate Stripe payment flow end-to-end
3. Implement ToS acceptance tracking (optional for beta)
4. Migrate to Inngest for background jobs
5. Add email notifications (Resend)
6. Beta user testing and feedback collection