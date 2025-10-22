import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function addVictorUser() {
  try {
    console.log('🚀 Adding Victor as Massimino user...');

    // Check if Victor already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: 'victor@massimino.com' }
    });

    if (existingUser) {
      console.log('✅ Victor already exists in the database');
      console.log('📧 Email: victor@massimino.com');
      console.log('👤 Role:', existingUser.role);
      console.log('🆔 User ID:', existingUser.id);
      return;
    }

    // Create Victor's account
    const hashedPassword = await bcrypt.hash('massimino123', 12);

    const victorUser = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: 'victor@massimino.com',
        name: 'Victor Sole',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(),
        reputationScore: 100,
        warningCount: 0,
        trainerVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Victor user created successfully!');
    console.log('📧 Email: victor@massimino.com');
    console.log('🔑 Password: massimino123');
    console.log('👤 Role: ADMIN');
    console.log('🆔 User ID:', victorUser.id);

  } catch (error) {
    console.error('❌ Error creating Victor user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addVictorUser();
