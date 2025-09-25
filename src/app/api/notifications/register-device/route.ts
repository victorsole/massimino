/**
 * Device Registration API
 * Phase 4.1: Register push notification device tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/core';
import { DevicePlatform } from '@prisma/client';
import { prisma } from '@/core/database';
import { z } from 'zod';

const registerDeviceSchema = z.object({
  token: z.string().min(1, 'Device token is required'),
  platform: z.enum(['ios', 'android', 'web']),
  deviceInfo: z.object({
    deviceId: z.string().optional(),
    deviceName: z.string().optional(),
    osVersion: z.string().optional(),
    appVersion: z.string().optional(),
  }).optional(),
});

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await _request.json();
    const { token, platform } = registerDeviceSchema.parse(body);

    const mapPlatform = (p: 'ios'|'android'|'web'): DevicePlatform =>
      p === 'ios' ? 'IOS' : p === 'android' ? 'ANDROID' : 'WEB';

    // Check if device token already exists
    const existingToken = await prisma.deviceToken.findFirst({
      where: {
        token,
        userId: session.user.id,
      },
    });

    if (existingToken) {
      // Update existing token
      const updatedToken = await prisma.deviceToken.update({
        where: { id: existingToken.id },
        data: {
          platform: mapPlatform(platform),
          isActive: true,
          lastUsed: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Device token updated',
        tokenId: updatedToken.id,
      });
    }

    // Create new device token
    const newToken = await prisma.deviceToken.create({
      data: {
        userId: session.user.id,
        token,
        platform: mapPlatform(platform),
        isActive: true,
        lastUsed: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Device registered successfully',
      tokenId: newToken.id,
    });

  } catch (error) {
    console.error('Device registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to register device' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Device token is required' },
        { status: 400 }
      );
    }

    // Deactivate the device token
    await prisma.deviceToken.updateMany({
      where: {
        token,
        userId: session.user.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Device unregistered successfully',
    });

  } catch (error) {
    console.error('Device unregistration error:', error);
    return NextResponse.json(
      { error: 'Failed to unregister device' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's registered devices
    const devices = await prisma.deviceToken.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        id: true,
        platform: true,
        createdAt: true,
        lastUsed: true,
      },
      orderBy: {
        lastUsed: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      devices,
    });

  } catch (error) {
    console.error('Get devices error:', error);
    return NextResponse.json(
      { error: 'Failed to get registered devices' },
      { status: 500 }
    );
  }
}
