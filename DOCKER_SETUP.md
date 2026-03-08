# Docker PostgreSQL Setup Guide

This guide will help you set up PostgreSQL using Docker Desktop for local development.

## Prerequisites

- Docker Desktop installed and running
- Windows: Make sure Docker Desktop is running (check system tray)

## Quick Start

### 1. Start PostgreSQL Container

```bash
docker-compose up -d
```

This will:
- Download PostgreSQL 16 Alpine image (if not already downloaded)
- Create a container named `podcasttoclip-db`
- Start PostgreSQL on port 5432
- Create database `podcasttoclip` with user `podcastuser`
- Persist data in a Docker volume

### 2. Verify Container is Running

```bash
docker-compose ps
```

You should see:
```
NAME                   STATUS    PORTS
podcasttoclip-db      Up        0.0.0.0:5432->5432/tcp
```

### 3. Check Container Logs

```bash
npm run docker:logs
# or
docker-compose logs -f postgres
```

Look for: `database system is ready to accept connections`

### 4. Update .env.local

Your `.env.local` should have:

```bash
DATABASE_URL=postgresql://podcastuser:podcastpass123@localhost:5432/podcasttoclip
```

### 5. Initialize Database

```bash
npm run db:push
```

This creates all tables from your Prisma schema.

## Useful Commands

```bash
# Start PostgreSQL
npm run docker:up
# or
docker-compose up -d

# Stop PostgreSQL
npm run docker:down
# or
docker-compose down

# View logs
npm run docker:logs
# or
docker-compose logs -f postgres

# Stop and remove everything (including data)
docker-compose down -v

# Restart PostgreSQL
docker-compose restart

# Check if PostgreSQL is healthy
docker-compose ps
```

## Connect to PostgreSQL

### Using Prisma Studio (Recommended)

```bash
npm run db:studio
```

Opens a web UI at http://localhost:5555

### Using psql (Command Line)

```bash
docker exec -it podcasttoclip-db psql -U podcastuser -d podcasttoclip
```

Useful psql commands:
- `\dt` - List all tables
- `\d Job` - Describe Job table
- `SELECT * FROM "Job";` - Query jobs
- `\q` - Quit

### Using GUI Tools

**DBeaver / pgAdmin / TablePlus:**
- Host: `localhost`
- Port: `5432`
- Database: `podcasttoclip`
- Username: `podcastuser`
- Password: `podcastpass123`

## Troubleshooting

### Port 5432 Already in Use

If you have another PostgreSQL instance running:

**Option 1: Stop other PostgreSQL**
```bash
# Windows
# Stop PostgreSQL service from Services app
```

**Option 2: Change port**
Edit `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Use port 5433 instead
```

Then update `.env.local`:
```bash
DATABASE_URL=postgresql://podcastuser:podcastpass123@localhost:5433/podcasttoclip
```

### Container Won't Start

Check logs:
```bash
docker-compose logs postgres
```

Common issues:
- Docker Desktop not running
- Port conflict (see above)
- Corrupted volume (run `docker-compose down -v` and try again)

### Can't Connect to Database

1. **Check container is running:**
   ```bash
   docker-compose ps
   ```

2. **Check health status:**
   ```bash
   docker-compose ps
   ```
   Status should be "healthy" (Up) not "unhealthy"

3. **Test connection:**
   ```bash
   docker exec -it podcasttoclip-db pg_isready -U podcastuser
   ```
   Should return: "accepting connections"

4. **Verify DATABASE_URL:**
   Make sure it exactly matches the credentials in docker-compose.yml

### Reset Database

To start fresh:

```bash
# Stop and remove container + data
docker-compose down -v

# Start fresh
docker-compose up -d

# Recreate tables
npm run db:push
```

## Data Persistence

Data is stored in a Docker volume named `podcasttoclip_db_data`.

**To backup:**
```bash
docker exec podcasttoclip-db pg_dump -U podcastuser podcasttoclip > backup.sql
```

**To restore:**
```bash
cat backup.sql | docker exec -i podcasttoclip-db psql -U podcastuser -d podcasttoclip
```

**To view volume:**
```bash
docker volume ls
docker volume inspect podcasttoclip_db_data
```

## Production Note

This Docker setup is for **local development only**.

For production, use:
- Managed PostgreSQL (Neon, Supabase, AWS RDS, etc.)
- Proper backups and monitoring
- Strong passwords
- SSL connections

## Next Steps

After PostgreSQL is running:

1. ✅ Container running: `docker-compose ps`
2. ✅ Database initialized: `npm run db:push`
3. ✅ Test connection: `npm run db:studio`
4. ✅ Validate config: `npm run validate`
5. ✅ Start app: `npm run dev`

## Quick Reference

| Task | Command |
|------|---------|
| Start DB | `npm run docker:up` |
| Stop DB | `npm run docker:down` |
| View logs | `npm run docker:logs` |
| DB GUI | `npm run db:studio` |
| Validate env | `npm run validate` |
| Init schema | `npm run db:push` |
| Reset DB | `docker-compose down -v && docker-compose up -d` |

---

**Your PostgreSQL is now ready!** 🐘
