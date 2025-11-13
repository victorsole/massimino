// Script to create Mannekes team for vsoleferioli@gmail.com
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find the user
    const user = await prisma.users.findUnique({
      where: { email: 'vsoleferioli@gmail.com' },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      console.log('❌ User not found: vsoleferioli@gmail.com');
      process.exit(1);
    }

    console.log('✅ User found:', user);

    // Check if team already exists
    const existingTeam = await prisma.teams.findFirst({
      where: {
        name: 'Mannekes',
        trainerId: user.id
      }
    });

    if (existingTeam) {
      console.log('✅ Team "Mannekes" already exists:', existingTeam.id);
      console.log('Team ID:', existingTeam.id);
      process.exit(0);
    }

    // Create the team
    const now = new Date();
    const teamId = crypto.randomUUID();
    const memberId = crypto.randomUUID();

    const team = await prisma.teams.create({
      data: {
        id: teamId,
        name: 'Mannekes',
        description: 'Colla castellera Mannekes de Brussels - Entrenament de castells i preparació física',
        type: 'CUSTOM',
        customTypeDescription: 'Castells Training',
        trainerId: user.id,
        visibility: 'INVITE_ONLY',
        maxMembers: 50,
        aestheticSettings: {
          theme: 'auto',
          fontStyle: 'modern',
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          backgroundColor: '#F9FAFB'
        },
        allowComments: true,
        allowMemberInvites: true,
        isActive: true,
        memberCount: 1,
        createdAt: now,
        updatedAt: now,
        team_members: {
          create: {
            id: memberId,
            userId: user.id,
            status: 'ACTIVE',
            canInviteOthers: true,
            canComment: true,
            canViewAllWorkouts: true,
            joinedAt: now
          }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('✅ Team "Mannekes" created successfully!');
    console.log('Team ID:', team.id);
    console.log('Trainer:', team.users.name || team.users.email);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
