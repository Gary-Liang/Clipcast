import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getCurrentUser } from '@/lib/auth/user';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get clip and verify ownership (check both clip.userId and job.userId for backward compatibility)
    const clip = await prisma.clip.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        videoUrl: true,
        userId: true,
        job: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    // Allow access if clip belongs to user OR if the job belongs to user (for backward compatibility)
    const hasAccess = clip.userId === user.id || clip.job.userId === user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!clip.videoUrl) {
      return NextResponse.json({ error: 'Video not available' }, { status: 404 });
    }

    // Fetch the video from R2
    const videoResponse = await fetch(clip.videoUrl);

    if (!videoResponse.ok) {
      console.error('Failed to fetch video from R2:', videoResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch video' },
        { status: 500 }
      );
    }

    // Get the video blob
    const videoBlob = await videoResponse.blob();

    // Create filename
    const filename = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;

    // Return the video with download headers
    return new NextResponse(videoBlob, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': videoBlob.size.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download video' },
      { status: 500 }
    );
  }
}
