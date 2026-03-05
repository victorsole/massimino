// Script to create "Newby Mummies" team for vsoleferioli@gmail.com
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

async function fetchCoverImage(): Promise<string | null> {
  if (!PEXELS_API_KEY) {
    console.log('⚠️  No PEXELS_API_KEY set — skipping cover image');
    return null;
  }
  try {
    const res = await fetch(
      'https://api.pexels.com/v1/search?query=mother+baby+fitness+yoga&per_page=5&orientation=landscape',
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) return null;
    console.log(`✅ Pexels cover image by ${photo.photographer}: ${photo.src.large2x}`);
    return photo.src.large2x || photo.src.large;
  } catch {
    console.log('⚠️  Failed to fetch Pexels image');
    return null;
  }
}

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
        name: 'Newby Mummies',
        trainerId: user.id
      }
    });

    if (existingTeam) {
      console.log('✅ Team "Newby Mummies" already exists:', existingTeam.id);
      process.exit(0);
    }

    // Fetch a Pexels cover image
    const coverImage = await fetchCoverImage();

    // Create the team
    const now = new Date();
    const teamId = crypto.randomUUID();
    const memberId = crypto.randomUUID();

    const team = await prisma.teams.create({
      data: {
        id: teamId,
        name: 'Newby Mummies',
        description: 'A supportive fitness community for new mothers. Postpartum recovery, pelvic floor rehab, and gentle strength building — all at your own pace.',
        type: 'CUSTOM',
        customTypeDescription: 'Postpartum Fitness',
        trainerId: user.id,
        visibility: 'PUBLIC',
        maxMembers: 30,
        aestheticSettings: {
          theme: 'auto',
          fontStyle: 'modern',
          primaryColor: '#D4577A',
          secondaryColor: '#F4A261',
          backgroundColor: '#FFF7F0',
          coverImage: coverImage,
          programId: 'i-just-became-a-mum',
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

    console.log('');
    console.log('✅ Team "Newby Mummies" created successfully!');
    console.log('   Team ID:', team.id);
    console.log('   Trainer:', team.users.name || team.users.email);
    console.log('   Visibility: PUBLIC');
    console.log('   Program: i-just-became-a-mum');
    console.log('   Cover image:', coverImage ? 'Yes (Pexels)' : 'None');
    console.log('');
    console.log('   URL: /teams/' + team.id);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
