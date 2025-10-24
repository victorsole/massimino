// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in database
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.toLowerCase(),
        password: passwordHash,
        role: 'CLIENT',
        status: 'ACTIVE',
        emailVerified: null, // Will be set after email verification
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Store verification token in database
    await prisma.email_verification_tokens.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        token: verificationToken,
        expiresAt: expiresAt,
        createdAt: new Date(),
      }
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`;
    console.log('🔗 Verification link:', verificationUrl);

    // Import and use the email service
    const { sendVerificationEmail } = await import('@/services/email/email_service');

    try {
      const emailResult = await sendVerificationEmail({
        to: email,
        name: name,
        verificationToken: verificationToken,
      });

      if (!emailResult.success) {
        console.warn('Failed to send verification email:', emailResult.error);
        // Don't fail registration if email fails - user can request resend
      } else {
        console.log('✅ Verification email sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! Please check your email to verify your account.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
