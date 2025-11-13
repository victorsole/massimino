// src/app/api/profile/background/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/core/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: {
        backgroundImage: true,
        customBackgroundUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      backgroundImage: user.backgroundImage,
      customBackgroundUrl: user.customBackgroundUrl,
    });
  } catch (error) {
    console.error('Failed to fetch background preference:', error);
    return NextResponse.json(
      { error: 'Failed to fetch background preference' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { backgroundImage, customBackgroundUrl } = body;

    // Validate that at least one is provided
    if (!backgroundImage && !customBackgroundUrl) {
      return NextResponse.json(
        { error: 'Either backgroundImage or customBackgroundUrl must be provided' },
        { status: 400 }
      );
    }

    const user = await prisma.users.update({
      where: { email: session.user.email },
      data: {
        backgroundImage: backgroundImage || null,
        customBackgroundUrl: customBackgroundUrl || null,
      },
    });

    return NextResponse.json({
      success: true,
      backgroundImage: user.backgroundImage,
      customBackgroundUrl: user.customBackgroundUrl,
    });
  } catch (error) {
    console.error('Failed to update background preference:', error);
    return NextResponse.json(
      { error: 'Failed to update background preference' },
      { status: 500 }
    );
  }
}
