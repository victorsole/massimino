import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { nanoid } from 'nanoid';

// GET: Fetch chat rooms for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all chat rooms where user is a participant
    const rooms = await prisma.chat_room_participants.findMany({
      where: {
        userId: userId,
      },
      include: {
        chat_rooms: {
          include: {
            chat_room_participants: {
              where: {
                userId: { not: userId }, // Get other participant
              },
              include: {
                users: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    image: true,
                  },
                },
              },
            },
            chat_messages: {
              orderBy: { createdAt: 'desc' },
              take: 1, // Get last message
              select: {
                content: true,
                createdAt: true,
                senderId: true,
              },
            },
          },
        },
      },
      orderBy: {
        chat_rooms: {
          updatedAt: 'desc',
        },
      },
    });

    // Format the response
    const formattedRooms = rooms.map((room) => ({
      roomId: room.chat_rooms.id,
      otherUser: room.chat_rooms.chat_room_participants[0]?.users || null,
      lastMessage: room.chat_rooms.chat_messages[0] || null,
      updatedAt: room.chat_rooms.updatedAt,
    }));

    return NextResponse.json({ rooms: formattedRooms }, { status: 200 });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch chat rooms' }, { status: 500 });
  }
}

// POST: Create or get existing chat room with a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { otherUserId } = await request.json();

    if (!otherUserId) {
      return NextResponse.json({ error: 'Other user ID required' }, { status: 400 });
    }

    // Check if a direct chat room already exists between these two users
    const existingRoom = await prisma.chat_rooms.findFirst({
      where: {
        type: 'DIRECT',
        chat_room_participants: {
          every: {
            OR: [
              { userId: session.user.id },
              { userId: otherUserId },
            ],
          },
        },
      },
      include: {
        chat_room_participants: {
          where: {
            userId: { in: [session.user.id, otherUserId] },
          },
        },
      },
    });

    // Verify both users are participants if room exists
    if (existingRoom && existingRoom.chat_room_participants.length === 2) {
      return NextResponse.json({ roomId: existingRoom.id }, { status: 200 });
    }

    // Create new room
    const roomId = nanoid();
    const now = new Date();

    await prisma.chat_rooms.create({
      data: {
        id: roomId,
        type: 'DIRECT',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        chat_room_participants: {
          create: [
            {
              id: nanoid(),
              userId: session.user.id,
              role: 'MEMBER',
            },
            {
              id: nanoid(),
              userId: otherUserId,
              role: 'MEMBER',
            },
          ],
        },
      },
    });

    return NextResponse.json({ roomId }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat room:', error);
    return NextResponse.json({ error: 'Failed to create chat room' }, { status: 500 });
  }
}
