import prisma from "@/lib/db/client";
import { Plan } from "@prisma/client";

// Rate limit configurations (requests per hour)
const RATE_LIMITS = {
  upload: {
    FREE: 10,
    PRO: 100,
  },
  transcribe: {
    FREE: 10, // Increased from 5 for better UX
    PRO: 50,
  },
  detectClips: {
    FREE: 10, // Increased from 5 for better UX
    PRO: 50,
  },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

/**
 * Check if a user is within their rate limit for a specific action
 * Uses a simple sliding window approach stored in database
 */
export async function checkRateLimit(
  userId: string,
  action: RateLimitAction
): Promise<RateLimitResult> {
  // Get user's plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const limit = RATE_LIMITS[action][user.plan];
  const windowMs = 60 * 60 * 1000; // 1 hour
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Count actions in the last hour
  // We'll use the Job and Clip tables to track usage
  let count = 0;

  if (action === "upload" || action === "transcribe") {
    // Count jobs created in the last hour
    count = await prisma.job.count({
      where: {
        userId,
        createdAt: { gte: windowStart },
      },
    });
  } else if (action === "detectClips") {
    // Count jobs that reached clip detection stage in the last hour
    count = await prisma.job.count({
      where: {
        userId,
        createdAt: { gte: windowStart },
        status: {
          in: ["DETECTING_CLIPS", "CLIPS_DETECTED"],
        },
      },
    });
  }

  const remaining = Math.max(0, limit - count);
  const allowed = count < limit;
  const resetAt = new Date(now.getTime() + windowMs);

  return {
    allowed,
    remaining,
    limit,
    resetAt,
  };
}

/**
 * Middleware helper to enforce rate limits
 * Returns null if allowed, or a NextResponse with 429 if rate limited
 */
export async function enforceRateLimit(
  userId: string,
  action: RateLimitAction
): Promise<{ allowed: true } | { allowed: false; response: Response }> {
  const result = await checkRateLimit(userId, action);

  if (!result.allowed) {
    const minutesUntilReset = Math.ceil(
      (result.resetAt.getTime() - Date.now()) / 60000
    );

    // User-friendly action names
    const actionNames: Record<RateLimitAction, string> = {
      upload: "file uploads",
      transcribe: "transcriptions",
      detectClips: "clip detections",
    };

    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `You've reached your limit of ${result.limit} ${actionNames[action]} per hour. Try again in ${minutesUntilReset} minute${minutesUntilReset === 1 ? '' : 's'}, or upgrade to Pro for ${result.limit === 5 ? '10x' : '10x'} higher limits!`,
          limit: result.limit,
          remaining: 0,
          resetAt: result.resetAt.toISOString(),
          resetIn: `${minutesUntilReset} minutes`,
          upgradeUrl: "/pricing", // TODO: Add pricing page
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(
              (result.resetAt.getTime() - Date.now()) / 1000
            ).toString(),
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": result.resetAt.toISOString(),
          },
        }
      ),
    };
  }

  return { allowed: true };
}
