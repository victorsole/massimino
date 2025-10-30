// src/lib/notifications/training-notifications.ts
import { prisma } from '@/core/database';

type NotificationData = {
  title: string;
  body: string;
  type: 'session_invite' | 'progress_update' | 'message' | 'workout_reminder';
  data?: Record<string, any>;
};

/**
 * Send a notification to a user
 */
async function sendNotificationToUser(userId: string, notification: NotificationData) {
  try {
    // Map request type to Prisma enum value
    const mapType = (t: string) => {
      switch (t) {
        case 'message': return 'MESSAGE';
        case 'workout_reminder': return 'WORKOUT_REMINDER';
        case 'session_invite': return 'SESSION_INVITE';
        case 'progress_update': return 'PROGRESS_UPDATE';
        default: return 'GENERAL';
      }
    };

    // Get user's active device tokens
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        device_tokens: {
          where: { isActive: true },
        },
      },
    });

    if (!user || user.device_tokens.length === 0) {
      console.log(`No active devices found for user ${userId}`);
      return;
    }

    // Create notification record
    const createData: any = {
      userId: user.id,
      title: notification.title,
      body: notification.body,
      type: mapType(notification.type) as any,
      scheduledAt: null,
    };
    if (notification.data !== undefined) createData.data = notification.data;
    const notificationRecord = await prisma.push_notifications.create({ data: createData });

    // Send to each device
    for (const deviceToken of user.device_tokens) {
      try {
        await sendPushNotification(deviceToken.token, {
          title: notification.title,
          body: notification.body,
          data: { ...notification.data, notificationId: notificationRecord.id },
        });

        // Update notification status
        await prisma.push_notifications.update({
          where: { id: notificationRecord.id },
          data: { status: 'SENT' },
        });
      } catch (error) {
        console.error(`Failed to send notification to device ${deviceToken.token}:`, error);

        // Update notification status to failed
        await prisma.push_notifications.update({
          where: { id: notificationRecord.id },
          data: { status: 'FAILED' },
        });
      }
    }

    return notificationRecord;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
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

/**
 * Notify athlete when trainer creates a new session
 */
export async function notifySessionCreated(sessionId: string, athleteId: string, trainerId: string) {
  try {
    const [session, trainer] = await Promise.all([
      prisma.workout_sessions.findUnique({
        where: { id: sessionId },
        select: { title: true },
      }),
      prisma.users.findUnique({
        where: { id: trainerId },
        select: { name: true },
      }),
    ]);

    if (!session || !trainer) return;

    await sendNotificationToUser(athleteId, {
      title: 'New Workout Session',
      body: `${trainer.name} created a new session: ${session.title}`,
      type: 'session_invite',
      data: {
        sessionId,
        trainerId,
        action: 'session_created',
      },
    });
  } catch (error) {
    console.error('Error notifying session created:', error);
  }
}

/**
 * Notify athlete when trainer updates a session
 */
export async function notifySessionUpdated(sessionId: string, athleteId: string, trainerId: string, updateType: string) {
  try {
    const [session, trainer] = await Promise.all([
      prisma.workout_sessions.findUnique({
        where: { id: sessionId },
        select: { title: true },
      }),
      prisma.users.findUnique({
        where: { id: trainerId },
        select: { name: true },
      }),
    ]);

    if (!session || !trainer) return;

    const updateMessages: Record<string, string> = {
      exercise_added: 'added exercises to',
      exercise_removed: 'removed exercises from',
      goal_added: 'added goals to',
      media_added: 'added media to',
      general: 'updated',
    };

    const message = updateMessages[updateType] || updateMessages.general;

    await sendNotificationToUser(athleteId, {
      title: 'Session Updated',
      body: `${trainer.name} ${message} ${session.title}`,
      type: 'session_invite',
      data: {
        sessionId,
        trainerId,
        action: 'session_updated',
        updateType,
      },
    });
  } catch (error) {
    console.error('Error notifying session updated:', error);
  }
}

/**
 * Notify trainer when athlete completes a session
 */
export async function notifySessionCompleted(sessionId: string, athleteId: string, trainerId: string) {
  try {
    const [session, athlete] = await Promise.all([
      prisma.workout_sessions.findUnique({
        where: { id: sessionId },
        select: { title: true },
      }),
      prisma.users.findUnique({
        where: { id: athleteId },
        select: { name: true },
      }),
    ]);

    if (!session || !athlete) return;

    await sendNotificationToUser(trainerId, {
      title: 'Session Completed',
      body: `${athlete.name} completed ${session.title}`,
      type: 'progress_update',
      data: {
        sessionId,
        athleteId,
        action: 'session_completed',
      },
    });
  } catch (error) {
    console.error('Error notifying session completed:', error);
  }
}

/**
 * Notify when a new comment is added to a session
 */
export async function notifyCommentAdded(sessionId: string, commentAuthorId: string, recipientId: string) {
  try {
    const [session, author] = await Promise.all([
      prisma.workout_sessions.findUnique({
        where: { id: sessionId },
        select: { title: true },
      }),
      prisma.users.findUnique({
        where: { id: commentAuthorId },
        select: { name: true, role: true },
      }),
    ]);

    if (!session || !author) return;

    const authorRole = author.role === 'TRAINER' ? 'Your trainer' : 'Your athlete';

    await sendNotificationToUser(recipientId, {
      title: 'New Comment',
      body: `${authorRole} ${author.name} commented on ${session.title}`,
      type: 'message',
      data: {
        sessionId,
        commentAuthorId,
        action: 'comment_added',
      },
    });
  } catch (error) {
    console.error('Error notifying comment added:', error);
  }
}

/**
 * Notify athlete when exercises are modified in their session
 */
export async function notifyExercisesModified(sessionId: string, athleteId: string, trainerId: string, action: 'added' | 'removed') {
  try {
    await notifySessionUpdated(
      sessionId,
      athleteId,
      trainerId,
      action === 'added' ? 'exercise_added' : 'exercise_removed'
    );
  } catch (error) {
    console.error('Error notifying exercises modified:', error);
  }
}
