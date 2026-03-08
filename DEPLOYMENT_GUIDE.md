# Clipcast Deployment Guide

Complete guide to deploying Clipcast to production.

## Deployment Overview

Clipcast requires:
- **Hosting:** Next.js server (Vercel recommended)
- **Database:** PostgreSQL (Neon, Supabase, or Railway)
- **Storage:** Cloudflare R2 (already configured)
- **External APIs:** Deepgram, Anthropic, Clerk, Stripe, Inngest

---

## Option 1: Vercel Deployment (Recommended) ⭐

Vercel is built for Next.js and offers the easiest deployment experience.

### Step 1: Prepare Vercel Account

1. **Sign up at Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub
   - Import your `Clipcast` repository

2. **Configure Build Settings**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

### Step 2: Set Up Production Database

**Option A: Neon (Recommended - Serverless PostgreSQL)**

1. Go to https://neon.tech
2. Create a new project: "Clipcast Production"
3. Copy connection string (starts with `postgresql://`)
4. Format: `postgresql://user:password@host/database?sslmode=require`

**Option B: Supabase**

1. Go to https://supabase.com
2. Create new project
3. Go to Project Settings → Database
4. Copy connection string (Connection pooling mode)

**Option C: Railway**

1. Go to https://railway.app
2. Create new PostgreSQL service
3. Copy connection string from service variables

### Step 3: Configure Environment Variables in Vercel

In Vercel dashboard → Project Settings → Environment Variables, add:

```bash
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Deepgram (Transcription)
DEEPGRAM_API_KEY=<your_deepgram_api_key>

# Anthropic (Claude for clip detection)
ANTHROPIC_API_KEY=<your_anthropic_api_key>

# Cloudflare R2 (Storage)
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your_r2_access_key_id>
R2_SECRET_ACCESS_KEY=<your_r2_secret_access_key>
R2_BUCKET_NAME=<your_bucket_name>
R2_PUBLIC_DOMAIN=<your-r2-public-domain.com>

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...

# Inngest (Background Jobs)
INNGEST_EVENT_KEY=<your_inngest_event_key>
INNGEST_SIGNING_KEY=<your_inngest_signing_key>

# App Configuration
NEXT_PUBLIC_URL=https://your-domain.vercel.app
NODE_ENV=production
```

**Important Notes:**
- Use **production/live** keys for Clerk and Stripe (not test keys)
- Set `NEXT_PUBLIC_URL` to your actual Vercel URL
- For each environment variable, set it for: **Production, Preview, Development**

### Step 4: Initialize Production Database

After first deployment:

```bash
# Option A: Use Vercel CLI locally
npx vercel env pull .env.production
npx prisma generate
npx prisma db push

# Option B: SSH into Vercel and run migrations
# (Vercel doesn't support SSH, so use local with production .env)
```

**Better approach - Add to package.json:**

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && prisma db push && next build"
  }
}
```

This runs Prisma migrations automatically on every deployment.

### Step 5: Configure External Services for Production

#### 5.1 Clerk Webhooks

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/clerk`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy Signing Secret → Add as `CLERK_WEBHOOK_SECRET` in Vercel

#### 5.2 Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy Signing Secret → Add as `STRIPE_WEBHOOK_SECRET` in Vercel

#### 5.3 Cloudflare R2 CORS Configuration

Update R2 bucket CORS to allow your production domain:

```json
[
  {
    "AllowedOrigins": ["https://your-domain.vercel.app"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Apply via:
```bash
wrangler r2 bucket cors put <bucket-name> --file cors.json
```

#### 5.4 Inngest Setup

1. Go to https://app.inngest.com
2. Create new app: "Clipcast Production"
3. Add sync URL: `https://your-domain.vercel.app/api/inngest`
4. Copy Event Key and Signing Key
5. Add to Vercel environment variables

### Step 6: Deploy to Vercel

**Automatic Deployment:**
```bash
# Push to main branch triggers auto-deploy
git push origin main
```

**Manual Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Step 7: Custom Domain (Optional)

1. In Vercel → Project Settings → Domains
2. Add your custom domain: `clipcast.com` or `app.clipcast.com`
3. Update DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_URL` environment variable
5. Redeploy

### Step 8: Post-Deployment Checklist

- [ ] Verify homepage loads: `https://your-domain.vercel.app`
- [ ] Test sign-up flow with Clerk
- [ ] Upload a test podcast (small file first)
- [ ] Verify transcription works (check Deepgram dashboard)
- [ ] Test clip detection (check Anthropic API usage)
- [ ] Generate a test video (check R2 bucket)
- [ ] Test Stripe checkout (use test card: `4242 4242 4242 4242`)
- [ ] Verify webhook deliveries in Clerk and Stripe dashboards
- [ ] Check database for created users and jobs
- [ ] Monitor Vercel logs for errors

---

## Option 2: Railway Deployment

Railway offers all-in-one hosting with integrated PostgreSQL.

### Step 1: Deploy to Railway

1. Go to https://railway.app
2. Create new project
3. Add service → "GitHub Repo" → Select `Clipcast`
4. Railway auto-detects Next.js

### Step 2: Add PostgreSQL Service

1. In same project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway auto-provisions database
4. Connection string available in Variables tab

### Step 3: Configure Environment Variables

Same as Vercel (Step 3 above), add all environment variables to Railway.

**Important:** Railway auto-injects `DATABASE_URL`, so you only need to add the other variables.

### Step 4: Configure Domain

1. In Railway → Settings → Networking
2. Generate domain or add custom domain
3. Update `NEXT_PUBLIC_URL` environment variable

### Step 5: Deploy

Railway auto-deploys on every push to `main`.

---

## Option 3: Self-Hosted (VPS/Docker)

For full control, deploy to a VPS (DigitalOcean, AWS EC2, etc.)

### Prerequisites
- Ubuntu 22.04 LTS server
- Node.js 18+
- PostgreSQL 14+
- Nginx (reverse proxy)
- PM2 (process manager)

### Steps

1. **Clone Repository**
```bash
git clone https://github.com/Gary-Liang/Clipcast.git
cd Clipcast
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment Variables**
```bash
cp .env.example .env
nano .env
# Fill in all production values
```

4. **Setup Database**
```bash
npx prisma generate
npx prisma db push
```

5. **Build Application**
```bash
npm run build
```

6. **Start with PM2**
```bash
npm install -g pm2
pm2 start npm --name "clipcast" -- start
pm2 save
pm2 startup
```

7. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name clipcast.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d clipcast.com
```

---

## Common Issues & Solutions

### Issue: Database Connection Fails

**Solution:**
- Verify `DATABASE_URL` includes `?sslmode=require`
- Check database is publicly accessible
- Whitelist Vercel IP ranges if using IP restrictions

### Issue: Webhooks Not Firing

**Solution:**
- Verify webhook URLs are correct (HTTPS)
- Check signing secrets are correct
- Review webhook delivery logs in Clerk/Stripe dashboard
- Ensure endpoints are not protected by auth middleware

### Issue: R2 Upload Fails

**Solution:**
- Verify CORS configuration includes production domain
- Check R2 credentials are correct
- Ensure bucket is public or signed URLs are used

### Issue: Video Generation Times Out

**Solution:**
- Increase Vercel function timeout (Pro plan: 300s)
- Consider moving video generation to background worker
- Use Inngest for long-running tasks

### Issue: Prisma Client Not Generated

**Solution:**
- Add `postinstall` script: `"postinstall": "prisma generate"`
- Or use custom build command: `prisma generate && next build`

---

## Monitoring & Maintenance

### Recommended Tools

1. **Vercel Analytics**
   - Enable in Vercel dashboard
   - Track page views, performance

2. **Sentry (Error Tracking)**
   ```bash
   npm install @sentry/nextjs
   ```

3. **LogTail (Log Management)**
   - Integrate with Vercel
   - Better log search/filtering

4. **Uptime Monitoring**
   - UptimeRobot (free)
   - Better Uptime
   - Pingdom

### Database Backups

**Neon:**
- Automatic daily backups (Pro plan)
- Point-in-time recovery

**Supabase:**
- Daily backups included
- Manual backup via dashboard

**Railway:**
- Automated daily backups
- One-click restore

---

## Cost Estimates

### Monthly Costs (Estimated)

| Service | Plan | Cost |
|---------|------|------|
| **Vercel** | Pro | $20/mo |
| **Neon** | Scale | $19/mo |
| **Cloudflare R2** | Pay-as-you-go | ~$5-20/mo |
| **Deepgram** | Pay-as-you-go | ~$50-200/mo* |
| **Anthropic API** | Pay-as-you-go | ~$20-100/mo* |
| **Clerk** | Pro | $25/mo (up to 10k users) |
| **Stripe** | Pay-as-you-go | 2.9% + $0.30 per transaction |
| **Inngest** | Free | $0 (up to 50k events/mo) |
| **Total** | | **~$150-400/mo** |

*Depends on usage volume

### Free Tier Options (Beta Testing)

- **Vercel:** Hobby (free, limitations on bandwidth)
- **Neon:** Free tier (1 GB storage)
- **Clerk:** Free (up to 10k MAU)
- **Inngest:** Free (up to 50k events/mo)
- **R2/Deepgram/Anthropic:** Pay-as-you-go (low cost for beta)

**Beta monthly cost: ~$10-50/mo**

---

## Production Checklist

Before going live:

### Code & Configuration
- [ ] All environment variables set correctly
- [ ] Using production/live API keys (not test)
- [ ] `NODE_ENV=production`
- [ ] Database migrations applied
- [ ] CORS configured for production domain

### External Services
- [ ] Clerk webhooks configured
- [ ] Stripe webhooks configured
- [ ] Stripe test mode disabled (use live keys)
- [ ] Deepgram production API key
- [ ] Anthropic production API key
- [ ] R2 bucket configured and accessible

### Security
- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables secured (not in code)
- [ ] Database connection uses SSL
- [ ] API rate limiting configured
- [ ] CORS properly restricted

### Monitoring
- [ ] Error tracking setup (Sentry)
- [ ] Log management configured
- [ ] Uptime monitoring enabled
- [ ] Database backup strategy in place

### Testing
- [ ] End-to-end user flow tested
- [ ] Payment flow tested (test mode first)
- [ ] Webhook delivery verified
- [ ] Video generation tested
- [ ] Mobile responsiveness checked

### Legal & Compliance
- [ ] Terms of Service live
- [ ] Privacy Policy live
- [ ] Cookie consent (if using analytics)
- [ ] GDPR compliance (if EU users)

---

## Quick Start: Deploy to Vercel (5 Minutes)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Follow prompts to:
#    - Link to Clipcast repo
#    - Set project name
#    - Configure build settings

# 5. Add environment variables in Vercel dashboard

# 6. Redeploy
vercel --prod
```

---

## Support & Troubleshooting

### Vercel Deployment Logs
```bash
vercel logs <deployment-url>
```

### Check Database Connection
```bash
# Locally with production env
npx prisma studio
```

### Test Webhooks Locally
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Install Clerk CLI (if available)
# Or use ngrok for webhook testing
ngrok http 3000
```

---

## Next Steps After Deployment

1. **Beta Testing**
   - Invite 5-10 beta users
   - Collect feedback
   - Monitor for errors

2. **Performance Optimization**
   - Review Vercel analytics
   - Optimize slow pages
   - Add caching where appropriate

3. **Feature Iteration**
   - Implement user feedback
   - Add analytics tracking
   - Improve UX based on usage patterns

4. **Marketing**
   - Launch on Product Hunt
   - Share on Twitter/LinkedIn
   - Create demo video
   - Write blog post

Good luck with your deployment! 🚀
