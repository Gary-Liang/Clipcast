# Neon PostgreSQL Setup (5 minutes)

Neon is a serverless PostgreSQL database with a generous free tier - perfect for development!

## Steps:

1. **Sign up**: Go to https://neon.tech
   - Sign up with GitHub or email
   - Free tier includes 512MB storage, 0.5GB RAM

2. **Create a project**:
   - Click "Create Project"
   - Name: `podcasttoclip`
   - Region: Choose closest to you
   - PostgreSQL version: 16 (default)

3. **Get connection string**:
   - After creation, you'll see the connection string
   - It looks like: `postgresql://username:password@hostname.neon.tech/dbname?sslmode=require`

4. **Update .env.local**:
   ```bash
   DATABASE_URL=postgresql://your-username:your-password@your-project.neon.tech/podcasttoclip?sslmode=require
   ```

5. **Initialize database**:
   ```bash
   npm run db:push
   ```

6. **Verify**:
   ```bash
   npm run db:studio
   ```

## Benefits:
- ✅ No Docker needed
- ✅ Works from anywhere
- ✅ Automatic backups
- ✅ Free SSL connections
- ✅ Web UI to view data
- ✅ No authentication issues

## Free Tier Limits:
- 512 MB storage (plenty for development)
- 1 project
- Unlimited compute hours

This will get you running immediately!
