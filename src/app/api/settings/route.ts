// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core/auth/config';
import { prisma } from '@/core/database/client';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.safety_settings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      // Return default settings if none exist - profile is PUBLIC by default
      return NextResponse.json({
        settings: {
          profileVisibility: 'PUBLIC',
          allowDirectMessages: false,
          allowTrainerMessages: true,
          allowGroupMessages: true,
          showOnlineStatus: false,
          showLastSeen: false,
          autoBlockFlaggedUsers: true,
          requireVerifiedTrainers: false,
          contentFilterStrength: 'MEDIUM',
          safetyAlerts: true,
          moderationNotifications: true,
        },
      });
    }

    return NextResponse.json({
      settings: {
        profileVisibility: settings.profileVisibility,
        allowDirectMessages: settings.allowDirectMessages,
        allowTrainerMessages: settings.allowTrainerMessages,
        allowGroupMessages: settings.allowGroupMessages,
        showOnlineStatus: settings.showOnlineStatus,
        showLastSeen: settings.showLastSeen,
        autoBlockFlaggedUsers: settings.autoBlockFlaggedUsers,
        requireVerifiedTrainers: settings.requireVerifiedTrainers,
        contentFilterStrength: settings.contentFilterStrength,
        safetyAlerts: settings.safetyAlerts,
        moderationNotifications: settings.moderationNotifications,
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      allowDirectMessages,
      allowTrainerMessages,
      allowGroupMessages,
      profileVisibility,
      showOnlineStatus,
      showLastSeen,
      autoBlockFlaggedUsers,
      requireVerifiedTrainers,
      contentFilterStrength,
      safetyAlerts,
      moderationNotifications,
    } = body;

    // Validate profileVisibility
    const validVisibilities = ['PUBLIC', 'PRIVATE', 'TRAINERS_ONLY'];
    if (profileVisibility && !validVisibilities.includes(profileVisibility)) {
      return NextResponse.json({ error: 'Invalid profile visibility' }, { status: 400 });
    }

    // Validate contentFilterStrength
    const validFilters = ['LOW', 'MEDIUM', 'HIGH'];
    if (contentFilterStrength && !validFilters.includes(contentFilterStrength)) {
      return NextResponse.json({ error: 'Invalid content filter strength' }, { status: 400 });
    }

    const settings = await prisma.safety_settings.upsert({
      where: { userId: session.user.id },
      update: {
        ...(typeof allowDirectMessages === 'boolean' && { allowDirectMessages }),
        ...(typeof allowTrainerMessages === 'boolean' && { allowTrainerMessages }),
        ...(typeof allowGroupMessages === 'boolean' && { allowGroupMessages }),
        ...(profileVisibility && { profileVisibility }),
        ...(typeof showOnlineStatus === 'boolean' && { showOnlineStatus }),
        ...(typeof showLastSeen === 'boolean' && { showLastSeen }),
        ...(typeof autoBlockFlaggedUsers === 'boolean' && { autoBlockFlaggedUsers }),
        ...(typeof requireVerifiedTrainers === 'boolean' && { requireVerifiedTrainers }),
        ...(contentFilterStrength && { contentFilterStrength }),
        ...(typeof safetyAlerts === 'boolean' && { safetyAlerts }),
        ...(typeof moderationNotifications === 'boolean' && { moderationNotifications }),
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        userId: session.user.id,
        allowDirectMessages: allowDirectMessages ?? false,
        allowTrainerMessages: allowTrainerMessages ?? true,
        allowGroupMessages: allowGroupMessages ?? true,
        profileVisibility: profileVisibility ?? 'PUBLIC',
        showOnlineStatus: showOnlineStatus ?? false,
        showLastSeen: showLastSeen ?? false,
        autoBlockFlaggedUsers: autoBlockFlaggedUsers ?? true,
        requireVerifiedTrainers: requireVerifiedTrainers ?? false,
        contentFilterStrength: contentFilterStrength ?? 'MEDIUM',
        safetyAlerts: safetyAlerts ?? true,
        moderationNotifications: moderationNotifications ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        allowDirectMessages: settings.allowDirectMessages,
        allowTrainerMessages: settings.allowTrainerMessages,
        allowGroupMessages: settings.allowGroupMessages,
        profileVisibility: settings.profileVisibility,
        showOnlineStatus: settings.showOnlineStatus,
        showLastSeen: settings.showLastSeen,
        autoBlockFlaggedUsers: settings.autoBlockFlaggedUsers,
        requireVerifiedTrainers: settings.requireVerifiedTrainers,
        contentFilterStrength: settings.contentFilterStrength,
        safetyAlerts: settings.safetyAlerts,
        moderationNotifications: settings.moderationNotifications,
      },
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
