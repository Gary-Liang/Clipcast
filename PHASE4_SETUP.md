# Phase 4: MVP Infrastructure - Setup Guide

## What Was Implemented

Phase 4 transformed the Podcast to Clips app into a production-ready SaaS with:

### ✅ Phase 4.1: Authentication (Clerk)
- User sign-up/sign-in with Clerk
- Protected dashboard routes
- User database sync via webhooks
- Authentication utilities

### ✅ Phase 4.2: Background Jobs (Inngest)
- Reliable job processing with retries
- Observable job execution
- Automatic job chaining (transcription → clip detection)
- Error handling and logging

### ✅ Phase 4.3: Payments (Stripe)
- Free tier (3 clips/month)
- Pro plan ($29/mo unlimited)
- Usage limit enforcement
- Automated billing and subscription management

### ✅ Phase 4.4: Dashboard UI
- Beautiful landing page with pricing
- User dashboard with job/clip management
- Billing page
- Single clip view with video player
- Usage counter component

---

## Environment Variables Setup

You need to configure the following services and add their API keys to `.env.local`:

### 1. Clerk (Authentication)

**Sign up:** https://clerk.com

1. Create a new application
2. Go to **API Keys** section
3. Copy the keys to `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

4. Set up Clerk webhook:
   - Go to **Webhooks** in Clerk dashboard
   - Click **Add Endpoint**
   - URL: `http://localhost:3000/api/webhooks/clerk` (for development)
   - For production: `https://yourdomain.com/api/webhooks/clerk`
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`
   - Copy the signing secret:

```bash
CLERK_WEBHOOK_SECRET=whsec_...
```

### 2. Stripe (Payments)

**Sign up:** https://stripe.com

1. Create a Stripe account (use test mode for development)
2. Go to **Developers → API Keys**
3. Copy the keys to `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

4. Create a product and price:
   - Go to **Products** → **Add product**
   - Name: "Podcast to Clips Pro"
   - Price: $29/month recurring
   - Copy the Price ID (starts with `price_...`):

```bash
STRIPE_PRICE_ID_PRO=price_...
```

5. Set up Stripe webhook:
   - Go to **Developers → Webhooks**
   - Click **Add endpoint**
   - URL: `http://localhost:3000/api/stripe/webhook` (for development)
   - For production: `https://yourdomain.com/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the signing secret:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Testing Stripe locally:**
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to local server
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

### 3. Inngest (Background Jobs)

**Sign up:** https://inngest.com

1. Create a free account
2. Create a new app
3. Go to **Settings → Keys**
4. Copy the keys to `.env.local`:

```bash
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key
```

**Note:** For local development, you can leave these empty and use the Inngest Dev Server instead.

---

## Running the Application

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Make sure PostgreSQL is running (via Docker):

```bash
npm run docker:up
```

Push the updated schema to the database:

```bash
npm run db:push
```

### 3. Start Development Servers

You need **two terminals**:

**Terminal 1 - Next.js app:**
```bash
npm run dev
```

**Terminal 2 - Inngest dev server:**
```bash
npx inngest-cli dev
```

The Inngest dev server will:
- Provide a local dashboard at `http://localhost:8288`
- Show all job executions in real-time
- Allow you to replay failed jobs
- Work without INNGEST_EVENT_KEY/INNGEST_SIGNING_KEY

### 4. Access the Application

- **App:** http://localhost:3000
- **Inngest Dashboard:** http://localhost:8288
- **Database Studio:** `npm run db:studio` → http://localhost:5555

---

## Testing the Full Flow

### 1. Create an Account

1. Go to http://localhost:3000
2. Click "Get Started Free"
3. Sign up with email
4. Verify that a User record was created in the database

### 2. Upload a Podcast

1. Go to the dashboard
2. Upload an MP3 file
3. Start transcription
4. Watch the job progress in Inngest dashboard (http://localhost:8288)

### 3. Generate Clips

1. After transcription completes, clips will be auto-detected
2. Click "Generate Video" on a clip
3. Watch the video generation job in Inngest
4. Download the completed MP4

### 4. Test Usage Limits (Free Plan)

1. Generate 3 clips (your free tier limit)
2. Try to generate a 4th clip
3. You should see an error: "Usage limit exceeded"
4. Upgrade prompt should appear

### 5. Test Upgrade Flow

**Option A: Real Stripe Test Mode**
1. Click "Upgrade to Pro"
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date, any CVC
4. Complete checkout
5. Verify plan upgraded to PRO in database
6. Try generating unlimited clips

**Option B: Stripe CLI (for webhook testing)**
```bash
# In a separate terminal
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Trigger a test checkout.session.completed event
stripe trigger checkout.session.completed
```

---

## Troubleshooting

### Clerk Webhook Not Working

Make sure the webhook URL is publicly accessible. For local development:

1. Use ngrok: `ngrok http 3000`
2. Update Clerk webhook URL to: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`

### Stripe Webhook Not Working

Same as Clerk - use ngrok or Stripe CLI:

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret from the CLI output.

### Inngest Jobs Not Running

1. Make sure Inngest dev server is running: `npx inngest-cli dev`
2. Check that the Inngest endpoint is accessible: http://localhost:3000/api/inngest
3. View errors in the Inngest dashboard: http://localhost:8288

### Database Connection Issues

```bash
# Check if PostgreSQL is running
npm run docker:logs

# Restart containers
npm run docker:down
npm run docker:up
```

### Prisma Client Out of Sync

```bash
npm run db:push
npm run db:generate
```

---

## Production Deployment

### Environment Variables (Production)

Update your production `.env` with:

1. **Clerk:** Production keys from Clerk dashboard
2. **Stripe:** Production keys (remove `_test_` from keys)
3. **Inngest:** Production keys from Inngest dashboard
4. **Webhooks:** Update all webhook URLs to production domain

### Webhook URLs (Production)

Update in respective dashboards:
- Clerk: `https://yourdomain.com/api/webhooks/clerk`
- Stripe: `https://yourdomain.com/api/stripe/webhook`

### Database Migration

```bash
# On production
npx prisma db push
```

---

## File Structure Summary

```
src/
├── app/
│   ├── api/
│   │   ├── inngest/route.ts          # Inngest serve endpoint
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts     # Create checkout session
│   │   │   └── webhook/route.ts      # Handle Stripe webhooks
│   │   ├── webhooks/
│   │   │   └── clerk/route.ts        # Sync users from Clerk
│   │   ├── transcribe/route.ts       # (Modified) Send Inngest event
│   │   ├── generate-videos/route.ts  # (Modified) Send Inngest event
│   │   └── upload/route.ts           # (Modified) Link to user
│   ├── dashboard/
│   │   ├── page.tsx                  # Main dashboard
│   │   ├── billing/page.tsx          # Billing management
│   │   └── clips/[id]/page.tsx       # Single clip view
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── layout.tsx                    # (Modified) Added ClerkProvider
│   └── page.tsx                      # (Modified) New landing page
├── components/
│   ├── Navigation.tsx                # Header with auth
│   ├── UsageCounter.tsx              # Usage tracking UI
│   └── UpgradeButton.tsx             # Stripe checkout button
├── inngest/
│   ├── client.ts                     # Inngest instance
│   └── functions/
│       ├── transcription.ts          # Transcription job
│       ├── clip-detection.ts         # Clip detection job
│       └── video-generation.ts       # Video generation job (with limits)
├── lib/
│   ├── auth/
│   │   └── user.ts                   # Auth utilities
│   ├── stripe/
│   │   ├── client.ts                 # Stripe client
│   │   └── config.ts                 # Pricing config
│   └── db/
│       └── client.ts                 # Prisma client
└── middleware.ts                     # Route protection

prisma/
└── schema.prisma                     # (Modified) Added User, Plan
```

---

## Success Criteria Checklist

- [ ] Users can sign up/login with Clerk
- [ ] Dashboard requires authentication
- [ ] User record created in database on sign-up
- [ ] Upload links Job to authenticated user
- [ ] Transcription runs via Inngest (visible in dashboard)
- [ ] Clip detection auto-triggers after transcription
- [ ] Video generation enforces usage limits
- [ ] Free users limited to 3 clips
- [ ] Upgrade button redirects to Stripe Checkout
- [ ] Payment success upgrades user to PRO
- [ ] PRO users can generate unlimited clips
- [ ] Dashboard shows user's clips only
- [ ] Usage counter displays correctly
- [ ] Clip page shows video player for completed clips

---

## Next Steps

Phase 4 is complete! The app is now a functional MVP ready for:

1. **Beta Testing:** Invite users to test the full flow
2. **Production Deployment:** Deploy to Vercel/Railway/etc.
3. **Marketing:** Launch landing page and start acquiring users

Future enhancements (Phase 5+):
- Email notifications (Resend)
- Social sharing
- Clip editing features
- Team workspaces
- Analytics dashboard
