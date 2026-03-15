import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import prisma from "@/lib/db/client";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow creator to reset usage
    if (user.email !== 'garyliang.cpp@gmail.com') {
      return NextResponse.json(
        { error: 'Admin only endpoint' },
        { status: 403 }
      );
    }

    // Reset clips used to 0
    await prisma.user.update({
      where: { id: user.id },
      data: { clipsUsed: 0 },
    });

    return NextResponse.json({
      message: 'Usage reset successfully',
      clipsUsed: 0,
      clipsLimit: user.clipsLimit,
    });
  } catch (error) {
    console.error('Reset usage error:', error);
    return NextResponse.json(
      { error: 'Failed to reset usage' },
      { status: 500 }
    );
  }
}
