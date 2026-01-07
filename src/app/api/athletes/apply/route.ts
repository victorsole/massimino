/**
 * Athlete Application API
 * POST: Submit an application to be featured as an athlete on Massimino
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, discipline, achievements, instagram, website, message } = body;

    // Validate required fields
    if (!name || !email || !discipline || !achievements) {
      return NextResponse.json(
        { error: 'Name, email, discipline, and achievements are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if email already submitted an application
    const existingApplication = await prisma.athlete_applications.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'An application with this email already exists' },
        { status: 409 }
      );
    }

    // Create the application
    const application = await prisma.athlete_applications.create({
      data: {
        name,
        email: email.toLowerCase(),
        discipline,
        achievements,
        instagram: instagram || null,
        website: website || null,
        message: message || null,
      },
    });

    return NextResponse.json({
      success: true,
      id: application.id,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('Athlete application error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const applications = await prisma.athlete_applications.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      include: {
        users: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Athlete applications GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
