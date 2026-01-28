/**
 * Media View Tracking API
 * POST: Increment view count for a media item
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mediaId } = await params;

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Increment view count
    const updated = await prisma.exercise_media.update({
      where: { id: mediaId },
      data: {
        viewCount: { increment: 1 },
      },
      select: {
        id: true,
        viewCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      viewCount: updated.viewCount,
    });
  } catch (error: any) {
    // If media not found, return success anyway (idempotent)
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: true, viewCount: 0 });
    }

    console.error('Media view tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
