/**
 * Consolidated Notifications API
 * Handles device registration, notification sending, and notification history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { DevicePlatform } from '@prisma/client';
import { prisma } from '@/core/database';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schemas
const registerDeviceSchema = z.object({
  action: z.literal('register'),
  token: z.string().min(1, 'Device token is required'),
  platform: z.enum(['ios', 'android', 'web']),
  deviceInfo: z.object({
    deviceId: z.string().optional(),
    deviceName: z.string().optional(),
    osVersion: z.string().optional(),
    appVersion: z.string().optional(),
  }).optional(),
});

const sendNotificationSchema = z.object({
  action: z.literal('send'),
  userIds: z.array(z.string()).optional(),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  data: z.record(z.any()).optional(),
  type: z.enum(['workout_reminder', 'message', 'session_invite', 'progress_update', 'achievement']).optional(),
  scheduledTime: z.string().datetime().optional(),
});

const markReadSchema = z.object({
  action: z.literal('mark_read'),
  notificationId: z.string().min(1, 'Notification ID is required'),
});

const unregisterDeviceSchema = z.object({
  action: z.literal('unregister'),
  token: z.string().min(1, 'Device token is required'),
});

// ============================================================================
// GET - List user's registered devices and notification history
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'devices';

    switch (type) {
      case 'devices': {
        // Get user's registered devices
        const devices = await prisma.device_tokens.findMany({
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
      }

      case 'conversations': {
        // Get user's chat conversations
        const limit = parseInt(searchParams.get('limit') || '20');

        const chatRooms = await prisma.chat_rooms.findMany({
          where: {
            chat_room_participants: {
              some: {
                userId: session.user.id,
                isActive: true,
              },
            },
            isActive: true,
          },
          include: {
            chat_room_participants: {
              where: { isActive: true },
              include: {
                users: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
            chat_messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                users: { // sender
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
        });

        // Calculate unread counts and format response
        const conversations = await Promise.all(
          chatRooms.map(async (room) => {
            const unreadCount = await prisma.chat_messages.count({
              where: {
                roomId: room.id,
                senderId: { not: session.user.id },
                deletedAt: null,
                createdAt: {
                  gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            });

            return {
              id: room.id,
              name: room.name,
              type: room.type,
              lastMessage: room.chat_messages[0] ? {
                id: room.chat_messages[0].id,
                content: room.chat_messages[0].content,
                createdAt: room.chat_messages[0].createdAt.toISOString(),
                senderId: room.chat_messages[0].senderId,
                senderName: room.chat_messages[0].users.name,
              } : undefined,
              chat_room_participants: room.chat_room_participants.map(p => ({
                userId: p.users.id,
                userName: p.users.name,
                userImage: p.users.image,
              })),
              unreadCount,
              updatedAt: room.updatedAt.toISOString(),
            };
          })
        );

        return NextResponse.json({
          success: true,
          conversations,
        });
      }

      case 'history': {
        // Get user's notification history
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
          prisma.push_notifications.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
              id: true,
              title: true,
              body: true,
              type: true,
              status: true,
              createdAt: true,
              scheduledAt: true,
            },
          }),
          prisma.push_notifications.count({
            where: { userId: session.user.id },
          }),
        ]);

        return NextResponse.json({
          success: true,
          notifications,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use "devices" or "history"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Register device, send notifications
// ============================================================================

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
    const action = body.action;

    switch (action) {
      case 'register': {
        const { token, platform } = registerDeviceSchema.parse(body);

        const mapPlatform = (p: 'ios'|'android'|'web'): DevicePlatform =>
          p === 'ios' ? 'IOS' : p === 'android' ? 'ANDROID' : 'WEB';

        // Check if device token already exists
        const existingToken = await prisma.device_tokens.findFirst({
          where: {
            token,
            userId: session.user.id,
          },
        });

        if (existingToken) {
          // Update existing token
          const updatedToken = await prisma.device_tokens.update({
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
        const newToken = await prisma.device_tokens.create({
          data: {
            id: crypto.randomUUID(),
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
      }

      case 'send': {
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

        const notifications = [];

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
      }

      case 'mark_read': {
        const { notificationId } = markReadSchema.parse(body);

        const notification = await prisma.push_notifications.findFirst({
          where: {
            id: notificationId,
            userId: session.user.id,
          },
        });

        if (!notification) {
          return NextResponse.json(
            { error: 'Notification not found' },
            { status: 404 }
          );
        }

        if (notification.readAt) {
          return NextResponse.json({
            success: true,
            message: 'Notification already marked as read',
          });
        }

        await prisma.push_notifications.update({
          where: { id: notificationId },
          data: { readAt: new Date() },
        });

        return NextResponse.json({
          success: true,
          message: 'Notification marked as read',
        });
      }

      case 'unregister': {
        const { token } = unregisterDeviceSchema.parse(body);

        // Deactivate the device token
        await prisma.device_tokens.updateMany({
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
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "register", "send", "mark_read", or "unregister"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Notification action error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process notification request' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Unregister device (alternative to POST with action)
// ============================================================================

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
    await prisma.device_tokens.updateMany({
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

// ============================================================================
// Helper Functions
// ============================================================================

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