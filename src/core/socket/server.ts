/**
 * Socket.IO Server Configuration
 * Phase 4.2: Real-time communication server
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '../database';
import { moderateContent } from '@/services/moderation';
import { randomUUID } from 'crypto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

export class SocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? ['https://massimino.app']
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // const token = socket.handshake.auth.token; // unused
        const userId = socket.handshake.auth.userId;

        if (!userId) {
          throw new Error('User ID required');
        }

        // Verify user exists in database
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { id: true, name: true, status: true },
        });

        if (!user || user.status !== 'ACTIVE') {
          throw new Error('Invalid or inactive user');
        }

        socket.userId = user.id;
        socket.userName = user.name || 'Unknown User';

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected:`, socket.id);

      // Track connected user
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
      }

      // Chat event handlers
      this.setupChatHandlers(socket);

      // Live session event handlers
      this.setupLiveSessionHandlers(socket);

      // Workout progress event handlers
      this.setupWorkoutProgressHandlers(socket);

      // Video call event handlers
      this.setupVideoCallHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`User ${socket.userId} disconnected:`, reason);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });
    });
  }

  private setupChatHandlers(socket: AuthenticatedSocket) {
    // Join chat room
    socket.on('join_room', async ({ roomId }) => {
      try {
        // Verify user has access to this room
        const hasAccess = await this.verifyRoomAccess(socket.userId!, roomId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this room' });
          return;
        }

        socket.join(roomId);
        console.log(`User ${socket.userId} joined room ${roomId}`);

        // Notify others in the room
        socket.to(roomId).emit('user_joined', {
          userId: socket.userId,
          userName: socket.userName,
        });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave chat room
    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user_left', {
        userId: socket.userId,
        userName: socket.userName,
      });
    });

    // Send message
    socket.on('send_message', async ({ roomId, content, type = 'text', metadata }) => {
      try {
        // Moderate content
        const moderationResult = await moderateContent(content);

        if (moderationResult.flagged) {
          socket.emit('message_blocked', {
            reason: 'Content flagged by moderation system',
            flaggedReason: moderationResult.reason,
          });
          return;
        }

        // Save message to database
        const message = await prisma.chat_messages.create({
          data: {
            id: randomUUID(),
            roomId,
            senderId: socket.userId!,
            content: content,
            type,
            metadata,
          },
          include: {
            users: {
              select: { id: true, name: true },
            },
          },
        });

        // Broadcast message to room
        this.io.to(roomId).emit('message', {
          id: message.id,
          roomId,
          content: message.content,
          senderId: message.senderId,
          senderName: message.users?.name,
          timestamp: message.createdAt.getTime(),
          type: message.type,
          metadata: message.metadata,
        });

        // Send push notifications to offline users
        await this.sendMessageNotifications(roomId, message, socket.userId!);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('typing', {
        roomId,
        userId: socket.userId,
        userName: socket.userName,
        isTyping,
      });
    });
  }

  private setupLiveSessionHandlers(socket: AuthenticatedSocket) {
    // Join live workout session
    socket.on('join_session', async ({ sessionId }) => {
      try {
        // Verify user has access to this session
        const hasAccess = await this.verifySessionAccess(socket.userId!, sessionId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this session' });
          return;
        }

        socket.join(`session_${sessionId}`);

        // Get current session participants
        const room = this.io.sockets.adapter.rooms.get(`session_${sessionId}`);
        const participants = await this.getSessionParticipants(sessionId, room);

        // Broadcast participant joined
        this.io.to(`session_${sessionId}`).emit('participant_joined', {
          sessionId,
          participants,
          newParticipant: {
            userId: socket.userId,
            userName: socket.userName,
          },
        });

      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Leave live session
    socket.on('leave_session', async ({ sessionId }) => {
      socket.leave(`session_${sessionId}`);

      const room = this.io.sockets.adapter.rooms.get(`session_${sessionId}`);
      const participants = await this.getSessionParticipants(sessionId, room);

      socket.to(`session_${sessionId}`).emit('participant_left', {
        sessionId,
        participants,
        leftParticipant: {
          userId: socket.userId,
          userName: socket.userName,
        },
      });
    });

    // Update session state
    socket.on('session_update', ({ sessionId, update }) => {
      socket.to(`session_${sessionId}`).emit('session_update', {
        sessionId,
        update,
        updatedBy: {
          userId: socket.userId,
          userName: socket.userName,
        },
      });
    });
  }

  private setupWorkoutProgressHandlers(socket: AuthenticatedSocket) {
    // Real-time workout progress sharing
    socket.on('workout_progress', async ({ sessionId, progress }) => {
      try {
        // Save progress to database
        await prisma.workout_progress.upsert({
          where: {
            userId_sessionId: {
              userId: socket.userId!,
              sessionId,
            },
          },
          update: {
            progress,
            updatedAt: new Date(),
          },
          create: {
            id: randomUUID(),
            userId: socket.userId!,
            sessionId,
            progress,
            updatedAt: new Date(),
          },
        });

        // Broadcast progress update
        this.io.to(`session_${sessionId}`).emit('workout_progress', {
          sessionId,
          userId: socket.userId,
          userName: socket.userName,
          progress,
          timestamp: Date.now(),
        });

      } catch (error) {
        console.error('Error updating workout progress:', error);
        socket.emit('error', { message: 'Failed to update progress' });
      }
    });

    // Heart rate and biometric updates
    socket.on('biometric_update', ({ sessionId, data }) => {
      socket.to(`session_${sessionId}`).emit('biometric_update', {
        sessionId,
        userId: socket.userId,
        userName: socket.userName,
        data,
        timestamp: Date.now(),
      });
    });
  }

  private async verifyRoomAccess(userId: string, roomId: string): Promise<boolean> {
    try {
      const participant = await prisma.chat_room_participants.findFirst({
        where: {
          roomId,
          userId,
          isActive: true,
        },
      });
      return !!participant;
    } catch (error) {
      console.error('Error verifying room access:', error);
      return false;
    }
  }

  private async verifySessionAccess(userId: string, sessionId: string): Promise<boolean> {
    try {
      const session = await prisma.live_workout_sessions.findFirst({
        where: {
          id: sessionId,
          OR: [
            { trainerId: userId },
            { live_session_participants: { some: { userId } } },
          ],
        },
      });
      return !!session;
    } catch (error) {
      console.error('Error verifying session access:', error);
      return false;
    }
  }

  private async getSessionParticipants(sessionId: string, room?: Set<string>) {
    // Get participants from database and merge with online users
    const dbParticipants = await prisma.live_session_participants.findMany({
      where: { sessionId },
      include: { users: { select: { id: true, name: true } } },
    });

    return dbParticipants.map((p: { userId: string; users: { name: string | null } }) => ({
      userId: p.userId,
      userName: p.users?.name || 'Unknown',
      isOnline: room ? this.connectedUsers.has(p.userId) : false,
    }));
  }

  private async sendMessageNotifications(roomId: string, message: any, senderId: string) {
    try {
      // Get room participants excluding the sender
      const roomParticipants = await prisma.chat_room_participants.findMany({
        where: {
          roomId,
          userId: { not: senderId },
        },
        include: {
          users: {
            include: {
              device_tokens: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      // Send push notifications to offline users
      for (const participant of roomParticipants) {
        const isOnline = this.connectedUsers.has(participant.userId);

        if (!isOnline && participant.users.device_tokens.length > 0) {
          // Send push notification to each device
          for (const deviceToken of participant.users.device_tokens) {
            try {
              await this.sendPushNotification(deviceToken.token, {
                title: `Message from ${message.users?.name}`,
                body: message.content.length > 100
                  ? message.content.substring(0, 100) + '...'
                  : message.content,
                data: {
                  type: 'message',
                  roomId,
                  messageId: message.id,
                },
              });
            } catch (error) {
              console.error(`Failed to send push notification to ${deviceToken.token}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message notifications:', error);
    }
  }

  private async sendPushNotification(deviceToken: string, notification: {
    title: string;
    body: string;
    data?: any;
  }) {
    // For Expo push notifications
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

      console.log('Push notification sent successfully:', result);
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  }

  private setupVideoCallHandlers(socket: AuthenticatedSocket) {
    // Join video call
    socket.on('join_video_call', async ({ sessionId, isTrainer }) => {
      try {
        // Verify access to session
        const hasAccess = await this.verifySessionAccess(socket.userId!, sessionId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this session' });
          return;
        }

        const callRoom = `call_${sessionId}`;
        socket.join(callRoom);

        console.log(`User ${socket.userId} joined video call for session ${sessionId}`);

        // Notify others in the call
        socket.to(callRoom).emit('user_joined_call', {
          userId: socket.userId,
          userName: socket.userName,
          isTrainer,
        });

        // Send list of current call participants to the new user
        const room = this.io.sockets.adapter.rooms.get(callRoom);
        if (room) {
          const participants = await this.getCallParticipants(sessionId, room);
          socket.emit('call_participants', { participants });
        }

      } catch (error) {
        console.error('Error joining video call:', error);
        socket.emit('error', { message: 'Failed to join video call' });
      }
    });

    // Leave video call
    socket.on('leave_video_call', ({ sessionId }) => {
      const callRoom = `call_${sessionId}`;
      socket.leave(callRoom);

      socket.to(callRoom).emit('user_left_call', {
        userId: socket.userId,
        userName: socket.userName,
      });

      console.log(`User ${socket.userId} left video call for session ${sessionId}`);
    });

    // WebRTC signaling - offer
    socket.on('video_offer', ({ sessionId, to, offer }) => {
      socket.to(`call_${sessionId}`).emit('video_offer', {
        from: socket.userId,
        fromName: socket.userName,
        to,
        offer,
      });
    });

    // WebRTC signaling - answer
    socket.on('video_answer', ({ sessionId, to, answer }) => {
      socket.to(`call_${sessionId}`).emit('video_answer', {
        from: socket.userId,
        fromName: socket.userName,
        to,
        answer,
      });
    });

    // WebRTC signaling - ICE candidate
    socket.on('ice_candidate', ({ sessionId, to, candidate }) => {
      socket.to(`call_${sessionId}`).emit('ice_candidate', {
        from: socket.userId,
        fromName: socket.userName,
        to,
        candidate,
      });
    });

    // Media state changes (mute/unmute, video on/off)
    socket.on('media_state_change', ({ sessionId, isAudioEnabled, isVideoEnabled }) => {
      socket.to(`call_${sessionId}`).emit('user_media_state', {
        userId: socket.userId,
        userName: socket.userName,
        isAudioEnabled,
        isVideoEnabled,
      });
    });

    // Screen sharing (for trainer demonstrations)
    socket.on('start_screen_share', ({ sessionId }) => {
      socket.to(`call_${sessionId}`).emit('screen_share_started', {
        userId: socket.userId,
        userName: socket.userName,
      });
    });

    socket.on('stop_screen_share', ({ sessionId }) => {
      socket.to(`call_${sessionId}`).emit('screen_share_stopped', {
        userId: socket.userId,
        userName: socket.userName,
      });
    });
  }

  private async getCallParticipants(sessionId: string, room?: Set<string>) {
    try {
      // Get session participants who are currently in the call
      const sessionParticipants = await prisma.live_session_participants.findMany({
        where: {
          sessionId,
          // no status field in LiveSessionParticipant
        },
        include: {
          users: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      // Also include trainer
      const session = await prisma.live_workout_sessions.findUnique({
        where: { id: sessionId },
        include: {
          users: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      const allParticipants = [...sessionParticipants];
      if (session) {
        allParticipants.push({
          users: session.users,
          userId: session.trainerId,
          sessionId,
          joinedAt: new Date(),
          id: `trainer_${session.trainerId}`,
          isActive: true,
          leftAt: null,
        });
      }

      // Filter to only those currently in the call room
      return allParticipants
        .filter((p: { userId: string }) => (room ? this.connectedUsers.has(p.userId) : false))
        .map((p: { userId: string; users?: { name?: string | null; image?: string | null } }) => ({
          userId: p.userId,
          userName: p.users?.name || 'Unknown',
          image: p.users?.image,
          isTrainer: p.userId === session?.trainerId,
          isOnline: true,
        }));
    } catch (error) {
      console.error('Error getting call participants:', error);
      return [];
    }
  }

  // Public methods for external use
  public sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public sendToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data);
  }

  public getUsersInRoom(roomId: string): string[] {
    const room = this.io.sockets.adapter.rooms.get(roomId);
    return room ? Array.from(room) : [];
  }

  public getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }
}

// Export singleton instance
let socketServer: SocketServer | null = null;

export const initializeSocketServer = (httpServer: HTTPServer): SocketServer => {
  if (!socketServer) {
    socketServer = new SocketServer(httpServer);
  }
  return socketServer;
};

export const getSocketServer = (): SocketServer | null => {
  return socketServer;
};
