import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/user';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      clipsUsed: user.clipsUsed,
      clipsLimit: user.clipsLimit,
      plan: user.plan,
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
