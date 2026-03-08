# Quick Fix: Clerk "Publishable key not valid" Error

## The Problem
The app needs real Clerk API keys, but placeholder values are currently in `.env.local`.

## Solution: Get Clerk Keys (5 minutes)

### Step 1: Create Clerk Account
1. Open: https://dashboard.clerk.com/sign-up
2. Sign up with GitHub (fastest) or email
3. Click "Create application"

### Step 2: Configure Application
- **Application name:** Podcast to Clips
- **Authentication:** Select "Email" and "Google" (recommended)
- Click "Create application"

### Step 3: Copy Your Keys
You'll see a screen with your keys. Copy them:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

### Step 4: Update .env.local
Open: `C:\Users\gary-\Documents\MyProjects\PodcastToClip\.env.local`

Find these lines:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Replace with your real keys:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
CLERK_SECRET_KEY=sk_test_your_actual_key_here
```

### Step 5: Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 6: Test
1. Go to http://localhost:3000
2. Click "Get Started Free"
3. You should see the Clerk sign-up form!

---

## Alternative: Test Without Auth (Temporary)

If you want to test other features first, you can temporarily disable auth:

1. Rename current layout:
```bash
mv src/app/layout.tsx src/app/layout.tsx.with-auth
```

2. Use no-auth layout:
```bash
mv src/app/layout-temp-no-auth.tsx src/app/layout.tsx
```

3. Restart dev server

**⚠️ Remember to re-enable auth before production!**

To re-enable auth later:
```bash
mv src/app/layout.tsx src/app/layout-temp-no-auth.tsx
mv src/app/layout.tsx.with-auth src/app/layout.tsx
```

---

## Need Help?

If you run into issues:
1. Check that you copied the FULL key (they're long!)
2. Make sure there are no extra spaces
3. Restart the dev server after changing .env.local
4. Clear browser cache (Ctrl+Shift+R)

Clerk support: https://clerk.com/support
