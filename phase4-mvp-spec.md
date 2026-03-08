# Phase 4: MVP Infrastructure (Auth + Dashboard + Payments)

We have a working video generation pipeline. Now we need the user-facing app.

## Tech Stack

- Framework: Next.js (App Router)
- Auth: Clerk or NextAuth
- Database: Prisma + Postgres (Supabase or Railway)
- Payments: Stripe
- Storage: Cloudflare R2 (already set up for audio/video)

---

## 4.1 Database Schema

```prisma
model User {
  id               String   @id @default(cuid())
  email            String   @unique
  name             String?
  createdAt        DateTime @default(now())
  stripeCustomerId String?
  plan             String   @default("free") // "free" | "pro"
  clipsUsed        Int      @default(0)
  clips            Clip[]
}

model Clip {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  title          String
  sourceAudioUrl String
  status         String   @default("processing") // "processing" | "ready" | "failed"
  videoUrl       String?
  transcript     Json?
  clipData       Json?    // detected clips metadata
  createdAt      DateTime @default(now())
}
```

---

## 4.2 Auth (Clerk recommended)

### Setup

- Install @clerk/nextjs
- Wrap app in ClerkProvider
- Protect dashboard routes with auth middleware

### Routes

- `/sign-in` — login
- `/sign-up` — register
- `/dashboard` — protected, requires auth

### On first login

- Create User record in database
- Link Clerk userId to our User table

---

## 4.3 Core Pages

### `/` — Landing page (public)

- Hero: headline + subheadline
- How it works (3 steps)
- Pricing
- CTA → sign up

### `/dashboard` — Main app (protected)

- Upload audio form
- List of user's clips (status, download link)
- Usage counter (X/3 free clips used)

### `/dashboard/clips/[id]` — Single clip view

- Preview video
- Download button
- Clip metadata (title, duration)

---

## 4.4 Upload Flow

1. User selects MP3 file
2. Frontend uploads to R2 (presigned URL)
3. Create Clip record in DB (status: "processing")
4. Trigger background job:
   - Transcribe audio
   - Detect clips
   - Generate video(s)
   - Update Clip record (status: "ready", videoUrl)
5. User sees clip in dashboard when ready

### API Routes

- `POST /api/upload` — get presigned URL, create Clip record
- `POST /api/clips/process` — trigger transcription + video generation
- `GET /api/clips` — list user's clips
- `GET /api/clips/[id]` — single clip details

---

## 4.5 Stripe Integration

### Flow

1. User hits 3 free clips
2. Dashboard shows "Upgrade to Pro"
3. User clicks → Stripe Checkout
4. On success → webhook updates user.plan = "pro"

### Implementation

- `POST /api/stripe/checkout` — create Checkout session
- `POST /api/stripe/webhook` — handle checkout.session.completed
- Check `user.plan` and `user.clipsUsed` before processing new clips

### Pricing

- Free: 3 clips total
- Pro: $29/mo, unlimited clips

---

## 4.6 Background Jobs

Use Inngest or BullMQ for async processing:

```ts
// jobs/processClip.ts

async function processClip(clipId: string) {
  // 1. Fetch audio from R2
  // 2. Transcribe (Whisper API)
  // 3. Detect clips (Claude API)
  // 4. For each detected clip:
  //    - Extract audio segment
  //    - Generate video (Remotion)
  //    - Upload to R2
  // 5. Update Clip record in DB
}
```

---

## 4.7 File Structure

```
/app
  /page.tsx                 # landing
  /sign-in/page.tsx         # Clerk sign in
  /sign-up/page.tsx         # Clerk sign up
  /dashboard
    /page.tsx               # main dashboard
    /clips/[id]/page.tsx    # single clip view

/api
  /upload/route.ts
  /clips/route.ts
  /clips/[id]/route.ts
  /stripe/checkout/route.ts
  /stripe/webhook/route.ts

/lib
  /db.ts                    # Prisma client
  /stripe.ts                # Stripe helpers
  /r2.ts                    # R2 upload helpers

/jobs
  /processClip.ts           # background job

/components
  /UploadForm.tsx
  /ClipCard.tsx
  /UsageCounter.tsx
```

---

## Build Order

1. Database + Prisma setup
2. Clerk auth + protected routes
3. Dashboard UI (upload form, clip list)
4. Upload flow (presigned URL, create record)
5. Wire up background job (already have processing logic)
6. Stripe checkout + webhook
7. Usage limits (check before processing)

---

## Definition of Done

- [ ] User can sign up / log in
- [ ] User can upload MP3
- [ ] Clip processes in background
- [ ] User can view + download finished clips
- [ ] Free users limited to 3 clips
- [ ] Stripe upgrade flow works
- [ ] Pro users can process unlimited clips
