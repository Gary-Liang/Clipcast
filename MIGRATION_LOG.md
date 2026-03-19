# Database Migration Log - March 16, 2026

## Problem
Railway PostgreSQL was causing "too many clients" errors in production (Vercel). This is a fundamental incompatibility between PostgreSQL's connection architecture and serverless platforms like Vercel.

## Root Cause
- PostgreSQL connections are separate processes with high overhead
- Designed for long-lived connections (traditional servers)
- Serverless creates many short-lived connections → exhausts connection limit
- Railway Postgres has ~22 max connections (even on $5/month Hobby plan)
- Connection pooling parameters (`?connection_limit=2&pool_timeout=0`) help but don't solve the root issue

## Solution: Migrate to Supabase
Supabase offers PostgreSQL with **built-in connection pooling** (pgBouncer) designed for serverless.

### Why Supabase?
- Free tier: 500MB database, 2GB bandwidth/month
- Built-in connection pooling via pgBouncer (Transaction pooler)
- PostgreSQL compatible - no code changes needed
- Port 6543 for pooled connections, port 5432 for direct

### Migration Steps Completed Today

#### 1. Created Supabase Project
- Project name: `clipcast` (or similar)
- Region: US East
- Database password: `qUCa5b$Kuz37k.z` (contains special char `$`)

#### 2. Got Connection String
- **Type**: Transaction pooler (port 6543) - NOT direct connection (5432)
- **Format**: `postgresql://postgres.xgloodrnnkaksihbsqqh:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres`
- **Important**: Password has `$` which must be URL-encoded as `%24`
- **Final**: `postgresql://postgres.xgloodrnnkaksihbsqqh:qUCa5b%24Kuz37k.z@aws-1-us-east-1.pooler.supabase.com:6543/postgres`

#### 3. Updated Local Environment
- Updated both `.env` and `.env.local` with Supabase connection string
- `.env` takes precedence for Prisma CLI commands
- Schema is already PostgreSQL compatible (no changes needed)

#### 4. Attempted Schema Push
- Ran `npx prisma db push --accept-data-loss`
- Command kept timing out (120+ seconds)
- Supabase dashboard showed error: `relation "supabase_migrations.schema_migrations" does not exist`
- This is a Supabase internal initialization error, not our schema

### Current Status: BLOCKED
- Supabase project may need time to fully initialize (try again tomorrow)
- Alternative: Use Supabase CLI to manually set up database
- Alternative: Create fresh Supabase project (sometimes they have init issues)

### Next Steps (Tomorrow)

1. **Option A: Wait and Retry**
   - Supabase project might just need 12-24 hours to fully initialize
   - Try `npx prisma db push` again

2. **Option B: Supabase CLI**
   ```bash
   npm install -g supabase
   supabase login
   supabase db push
   ```

3. **Option C: Fresh Supabase Project**
   - Delete current project, create new one
   - Sometimes helps with initialization errors

4. **Once Schema is Pushed:**
   - Test locally: `npm run dev`
   - Update Vercel environment variable: `DATABASE_URL`
   - Deploy to Vercel
   - Verify production works without "too many clients" error

### Architecture After Migration
- **Vercel**: Next.js app (serverless)
- **Railway**: Render service (Express + Remotion) - KEEP THIS
- **Supabase**: Database (replacing Railway Postgres)
- **Cloudflare R2**: Storage

### Important Files Modified Today
- `.env` - Updated DATABASE_URL for local Prisma CLI
- `.env.local` - Updated DATABASE_URL for Next.js app
- `prisma/schema.prisma` - No changes (already PostgreSQL)

### Lessons Learned

#### For Future SaaS Projects:

1. **Database Choice Matters for Serverless**
   - ❌ Standard PostgreSQL (Railway, raw RDS) = connection hell
   - ✅ Supabase, Neon, PlanetScale (before they killed free tier) = built-in pooling
   - ✅ Vercel Postgres (discontinued) was powered by Neon

2. **URL Encoding Password Special Characters**
   - Special chars in passwords MUST be URL-encoded in connection strings
   - Common ones: `$` → `%24`, `@` → `%40`, `:` → `%3A`, `#` → `%23`
   - Symptoms: Connection hangs/timeouts without clear error

3. **Prisma Environment File Priority**
   - `.env` takes precedence over `.env.local` for Prisma CLI
   - Next.js reads `.env.local` in development
   - Can cause confusion if they have different values
   - Best practice: Keep them in sync or delete `.env`

4. **Connection Pooling is Not Optional**
   - For serverless: ALWAYS use pooled connections (pgBouncer, etc.)
   - Port 6543 (Supabase pooler) vs 5432 (direct) is critical
   - Direct connections in serverless = same problem as Railway

5. **Supabase Initialization Can Be Slow**
   - New projects may take hours to fully initialize
   - Error `relation "supabase_migrations.schema_migrations" does not exist` = not ready
   - Alternative: Use Supabase CLI to force initialization

6. **PostgreSQL vs MySQL Trade-offs**
   - PostgreSQL: More features, JSON support, better for complex queries
   - MySQL (PlanetScale): Better serverless support (but no free tier anymore)
   - SQLite (Turso): Ultra-low latency, generous free tier, but different feature set

### Connection String Reference

**Supabase Transaction Pooler (Correct for Serverless):**
```
postgresql://postgres.PROJECT_ID:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres
```

**Supabase Direct Connection (DON'T use for serverless):**
```
postgresql://postgres.PROJECT_ID:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres
```

**Railway PostgreSQL (Original - caused issues):**
```
postgresql://postgres:PASSWORD@turntable.proxy.rlwy.net:12991/railway?connection_limit=2&pool_timeout=0
```

### Testing Checklist (Once Migration Complete)

- [ ] Local dev works: `npm run dev`
- [ ] Can upload file and create job
- [ ] Transcription completes
- [ ] Clip detection works
- [ ] Video generation succeeds
- [ ] Webhook from Railway to Vercel succeeds
- [ ] Vercel production works without "too many clients" error
- [ ] Multiple concurrent uploads work (stress test)
- [ ] User authentication still works
- [ ] Clerk webhooks still create users in new DB

### Contact Info / Resources
- Supabase Dashboard: https://supabase.com/dashboard
- Supabase Docs: https://supabase.com/docs
- Prisma Connection Pooling: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
- pgBouncer Info: https://www.pgbouncer.org/

---

**Date**: March 16, 2026
**Status**: Migration in progress, blocked on Supabase initialization
**Next Session**: Try schema push again, use CLI if needed, or create fresh project
