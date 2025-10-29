/**
 * Send Push Notification API
 * Phase 4.1: Send push notifications to users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { z } from 'zod';

const sendNotificationSchema = z.object({
  userIds: z.array(z.string()).optional(),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  data: z.record(z.any()).optional(),
  type: z.enum(['workout_reminder', 'message', 'session_invite', 'progress_update', 'achievement']).optional(),
  scheduledTime: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userIds, title, body: messageBody, data, type, scheduledTime } = sendNotificationSchema.parse(body);

    // Map request type to Prisma enum value
    const mapType = (t?: string) => {
      switch (t) {
        case 'message': return 'MESSAGE';
        case 'workout_reminder': return 'WORKOUT_REMINDER';
        case 'session_invite': return 'SESSION_INVITE';
        case 'progress_update': return 'PROGRESS_UPDATE';
        case 'achievement': return 'ACHIEVEMENT';
        default: return 'GENERAL';
      }
    };

    // Get target users' device tokens
    if (!userIds || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds is required' },
        { status: 400 }
      );
    }

    const targetUsers = await prisma.users.findMany({
      where: {
        id: { in: userIds },
        status: 'ACTIVE',
      },
      include: {
        device_tokens: {
          where: { isActive: true },
        },
      },
    });

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: 'No target users found' },
        { status: 400 }
      );
    }

    const notifications: any[] = [];

    // Send notifications to all target users
    for (const user of targetUsers) {
      if (user.device_tokens.length === 0) continue;

      // Create notification record
      const createData: any = {
        userId: user.id,
        title,
        body: messageBody,
        type: mapType(type) as any,
        scheduledAt: scheduledTime ? new Date(scheduledTime) : null,
      };
      if (data !== undefined) createData.data = data;
      const notification = await prisma.push_notifications.create({ data: createData });

      notifications.push(notification);

      // Send to each device
      for (const deviceToken of user.device_tokens) {
        try {
          if (scheduledTime) {
            // Schedule notification for later
            await scheduleNotification(deviceToken.token, {
              title,
              body: messageBody,
              data: { ...data, notificationId: notification.id },
              scheduledTime: new Date(scheduledTime),
            });
          } else {
            // Send immediately
            await sendPushNotification(deviceToken.token, {
              title,
              body: messageBody,
              data: { ...data, notificationId: notification.id },
            });
          }

          // Update notification status
          await prisma.push_notifications.update({
            where: { id: notification.id },
            data: { status: 'SENT' },
          });

        } catch (error) {
          console.error(`Failed to send notification to ${deviceToken.token}:`, error);

          // Update notification status to failed
          await prisma.push_notifications.update({
            where: { id: notification.id },
            data: {
              status: 'FAILED',
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notifications sent to ${targetUsers.length} users`,
      notificationIds: notifications.map(n => n.id),
    });

  } catch (error) {
    console.error('Send notification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}

async function sendPushNotification(deviceToken: string, notification: {
  title: string;
  body: string;
  data?: any;
}) {
  const message = {
    to: deviceToken,
    sound: 'default',
    title: notification.title,
    body: notification.body,
    data: notification.data,
    badge: 1,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (!response.ok || result.errors) {
      throw new Error(`Push notification failed: ${JSON.stringify(result)}`);
    }

    return result;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    throw error;
  }
}

async function scheduleNotification(deviceToken: string, notification: {
  title: string;
  body: string;
  data?: any;
  scheduledTime: Date;
}) {
  // For now, we'll store scheduled notifications in the database
  // and use a cron job or background task to send them later
  // This is a simplified implementation - in production you'd use
  // a proper job queue like Bull/BullMQ or AWS SQS

  console.log(`Scheduled notification for ${notification.scheduledTime.toISOString()}:`, {
    deviceToken,
    notification,
  });

  // TODO: Implement proper scheduling mechanism
  return { scheduled: true };
}
