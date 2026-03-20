import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';

/**
 * Get the current authenticated user from the database
 * Returns null if not authenticated
 * Auto-creates user if they don't exist in DB yet
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Check if user exists in our database
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  // If user doesn't exist, create them (handles cases where webhook didn't fire)
  if (!user) {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    try {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0].emailAddress,
          name: clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.firstName || null,
          imageUrl: clerkUser.imageUrl,
        },
      });

      console.log('Auto-created user from Clerk:', userId);
    } catch (error: any) {
      // Handle race condition: user might exist with same email but different clerkId
      // Or webhook already created the user
      if (error.code === 'P2002') {
        // Try to find by email and update clerkId
        const email = clerkUser.emailAddresses[0].emailAddress;
        user = await prisma.user.findUnique({
          where: { email },
        });

        // Update clerkId if user exists but has different/missing clerkId
        if (user && user.clerkId !== userId) {
          user = await prisma.user.update({
            where: { email },
            data: { clerkId: userId },
          });
          console.log('Updated user clerkId:', userId);
        }
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  }

  return user;
}

/**
 * Get the current user's ID from Clerk
 * Throws error if not authenticated
 */
export async function requireUserId() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return userId;
}

/**
 * Get the current user from the database
 * Throws error if not authenticated or user not found
 */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Check if the user can create a new clip based on their plan
 * Free users: 3 clips max
 * Pro users: unlimited
 */
export async function canCreateClip(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return false;
  }

  // Pro users have unlimited clips
  if (user.plan === 'PRO') {
    return true;
  }

  // Free users are limited
  return user.clipsUsed < user.clipsLimit;
}

/**
 * Increment the user's clip usage counter
 * Should be called when a clip is successfully generated
 */
export async function incrementClipUsage(userId: string): Promise<void> {
  await prisma.user.update({
    where: { clerkId: userId },
    data: {
      clipsUsed: {
        increment: 1,
      },
    },
  });
}
