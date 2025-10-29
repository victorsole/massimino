import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { nanoid } from 'nanoid';
import { sendEmail } from '@/services/email/email_service';

// GET: Fetch messages for a specific room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await params;

    // Verify user is a participant in this room
    const participant = await prisma.chat_room_participants.findFirst({
      where: {
        roomId,
        userId: session.user.id,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch messages
    const messages = await prisma.chat_messages.findMany({
      where: {
        roomId,
        deletedAt: null,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST: Send a message to a room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    // Verify user is a participant in this room
    const participant = await prisma.chat_room_participants.findFirst({
      where: {
        roomId,
        userId: session.user.id,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get other participant for notifications
    const otherParticipant = await prisma.chat_room_participants.findFirst({
      where: {
        roomId,
        userId: { not: session.user.id },
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create message
    const now = new Date();
    const message = await prisma.chat_messages.create({
      data: {
        id: nanoid(),
        roomId,
        senderId: session.user.id,
        content: content.trim(),
        type: 'TEXT',
        createdAt: now,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    // Update room's updatedAt timestamp
    await prisma.chat_rooms.update({
      where: { id: roomId },
      data: { updatedAt: now },
    });

    // Create push notification for recipient
    if (otherParticipant) {
      await prisma.push_notifications.create({
        data: {
          id: nanoid(),
          userId: otherParticipant.userId,
          type: 'MESSAGE',
          title: 'New Message',
          body: `${session.user.name || 'Someone'}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
          status: 'PENDING',
          createdAt: now,
        },
      });

      // Send email notification
      if (otherParticipant.users.email) {
        const senderName = session.user.name || 'Your trainer/athlete';
        await sendEmail({
          to: otherParticipant.users.email,
          subject: `New message from ${senderName} on Massimino`,
          text: `You have a new message from ${senderName}:\n\n"${content}"\n\nLog in to Massimino to reply: ${process.env.NEXTAUTH_URL}/messages`,
        }).catch((err) => console.error('Failed to send message email:', err));
      }
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
