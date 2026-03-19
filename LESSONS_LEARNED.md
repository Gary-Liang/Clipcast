# Lessons Learned - Database & Serverless Architecture

## Key Takeaway: PostgreSQL + Serverless = Bad Match

### The Problem
Standard PostgreSQL (Railway, AWS RDS, etc.) is **fundamentally incompatible** with serverless architectures like Vercel, Netlify, AWS Lambda.

**Why?**
- PostgreSQL connections are **separate OS processes** with high overhead
- Designed for **long-lived connections** (traditional servers)
- Serverless creates **thousands of short-lived connections** per day
- Result: **"too many clients already"** error → app crashes

### The Solution
Use databases with **built-in connection pooling** for serverless:

#### Option 1: Supabase (Best for PostgreSQL)
- ✅ PostgreSQL with pgBouncer connection pooling
- ✅ Free tier: 500MB storage, 2GB bandwidth
- ✅ Port 6543 = pooled, Port 5432 = direct (use 6543!)
- ⚠️ Projects can take hours to initialize
- **Use case**: When you need PostgreSQL features

#### Option 2: Neon
- ✅ PostgreSQL with built-in pooling
- ✅ Free tier: 3GB storage, 500 hours compute/month
- ✅ Fast initialization
- ⚠️ Free tier per account (can be exhausted)
- **Use case**: When Supabase has issues

#### Option 3: Turso (SQLite-based)
- ✅ Ultra-low latency, designed for edge
- ✅ Free tier: 9GB storage, 1 billion reads
- ✅ No connection limit issues
- ⚠️ Different from PostgreSQL (SQLite)
- **Use case**: When you need global edge deployment

#### ❌ Avoid for Serverless:
- Railway PostgreSQL (even with paid plan)
- AWS RDS PostgreSQL (without RDS Proxy)
- Self-hosted PostgreSQL
- Any database without connection pooling

---

## Production Deployment Gotchas

### 1. Vercel Request Body Limit: 4.5MB
**Problem**: File upload chunks were 5MB → 413 error

**Solution**: Reduce to 4MB chunks
```typescript
const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB (under Vercel's 4.5MB limit)
```

### 2. URL-Encode Special Characters in Passwords
**Problem**: Password `qUCa5b$Kuz37k.z` caused connection hangs

**Solution**: Encode special chars in connection strings
```
$ → %24
@ → %40
: → %3A
# → %23
```

Example:
```
postgresql://user:qUCa5b%24Kuz37k.z@host.com:5432/db
```

### 3. Race Conditions in Serverless File Creation
**Problem**: `existsSync()` + async `mkdir()` caused ENOENT errors

**Bad**:
```typescript
if (!existsSync(dir)) {
  await mkdir(dir); // Race condition!
}
```

**Good**:
```typescript
await mkdir(dir, { recursive: true }); // Idempotent, no race
```

### 4. CORS for Server-to-Server Webhooks
**Problem**: Railway render service → Vercel webhook returned 405

**Solution**: Add CORS headers + OPTIONS handler
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
```

### 5. Don't Push Schema on Every Build
**Problem**: `prisma db push` in build script exhausted connections

**Bad**:
```json
"build": "prisma db push && next build"
```

**Good**:
```json
"build": "next build"
```

Run schema migrations manually or via CI/CD separately.

---

## Prisma + Environment Files

### File Priority
1. `.env` - Used by Prisma CLI (db push, migrate, studio)
2. `.env.local` - Used by Next.js at runtime
3. If both exist, Prisma reads `.env`, Next.js reads `.env.local`

### Best Practice
**Keep them in sync** or delete `.env` and only use `.env.local`:
```bash
# .env.local (used by both Prisma and Next.js)
DATABASE_URL=postgresql://...
```

Then in `package.json`:
```json
"scripts": {
  "db:push": "dotenv -e .env.local -- prisma db push",
  "db:studio": "dotenv -e .env.local -- prisma studio"
}
```

---

## Architecture Patterns for SaaS

### Separation of Concerns
```
┌─────────────┐
│   Vercel    │ ← Next.js app (serverless)
│  (Next.js)  │ ← API routes, auth, dashboard
└──────┬──────┘
       │
       ├──→ Supabase (Database with pooling)
       ├──→ Cloudflare R2 (File storage)
       ├──→ Clerk (Authentication)
       └──→ Railway (Long-running tasks)
                │
                └──→ Express + Remotion (Video rendering)
```

**Why separate render service?**
- Vercel serverless: 10-300s max execution time
- Video rendering: 30-60+ seconds per clip
- Railway: Can run indefinitely, has Chrome/ffmpeg

---

## Database Migration Checklist

When switching databases:

- [ ] Export data from old DB (if needed)
- [ ] Create new DB project
- [ ] Get **pooled connection string** (not direct!)
- [ ] Update `.env` and `.env.local`
- [ ] URL-encode password special characters
- [ ] Run `npx prisma db push`
- [ ] Test locally first
- [ ] Update Vercel environment variables
- [ ] Update Railway environment variables (if applicable)
- [ ] Deploy to production
- [ ] Monitor for connection errors
- [ ] Import data to new DB (if needed)

---

## Quick Reference: Connection Strings

**Supabase (Transaction Pooler - CORRECT)**
```
postgresql://postgres.xxx:password@aws-0-us.pooler.supabase.com:6543/postgres
                                    ^^^^^^ pooler domain    ^^^^ port 6543
```

**Supabase (Direct - DON'T USE)**
```
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
                                                  ^^^^ port 5432 = direct
```

**Railway PostgreSQL**
```
postgresql://postgres:password@proxy.rlwy.net:12991/railway?connection_limit=2
```

**Neon (With Pooling)**
```
postgresql://user:password@ep-xxx.pooler.neon.tech:5432/dbname?sslmode=require
                           ^^^^^^ pooler subdomain
```

---

## Tools & Commands

### Test Database Connection
```bash
npx prisma db push --accept-data-loss
```

### View Database in GUI
```bash
npx prisma studio
```

### Check Supabase Project Status
```bash
supabase status
```

### Supabase CLI (Alternative to Dashboard)
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

---

## Future-Proofing

### What We'd Do Differently Next Time

1. **Start with Supabase/Neon from Day 1**
   - Don't use standard PostgreSQL for serverless
   - Saves migration headaches later

2. **Test Production Environment Early**
   - Don't wait until feature-complete to deploy
   - Catch serverless-specific issues early

3. **Use Supabase CLI from Start**
   - More reliable than dashboard for initialization
   - Better for CI/CD automation

4. **Monitor Connection Usage**
   - Add logging for Prisma connections
   - Alert when approaching limits

5. **Load Test Before Launch**
   - Simulate 10+ concurrent users uploading
   - Verify connection pooling works under load

---

**Created**: March 16, 2026
**Project**: Clipcast (Podcast to Clips SaaS)
**Context**: Migration from Railway PostgreSQL to Supabase due to connection limit issues
