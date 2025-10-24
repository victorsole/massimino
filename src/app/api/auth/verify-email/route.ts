// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database';

// Mark this route as dynamic since it uses request.url
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', request.url));
    }

    // Find the verification token
    const verificationToken = await prisma.email_verification_tokens.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
          }
        }
      }
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', request.url));
    }

    // Check if token has expired
    if (new Date() > verificationToken.expiresAt) {
      // Delete expired token
      await prisma.email_verification_tokens.delete({
        where: { id: verificationToken.id }
      });
      return NextResponse.redirect(new URL('/login?error=token-expired', request.url));
    }

    // Check if email is already verified
    if (verificationToken.user.emailVerified) {
      // Delete token since it's already verified
      await prisma.email_verification_tokens.delete({
        where: { id: verificationToken.id }
      });
      return NextResponse.redirect(new URL('/login?success=already-verified', request.url));
    }

    // Update user's emailVerified field
    await prisma.users.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: new Date(),
        updatedAt: new Date(),
      }
    });

    // Delete the used token
    await prisma.email_verification_tokens.delete({
      where: { id: verificationToken.id }
    });

    // Redirect to login with success message
    return NextResponse.redirect(new URL('/login?success=email-verified', request.url));

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/login?error=verification-failed', request.url));
  }
}
