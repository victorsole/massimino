// src/app/api/massitree/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core/auth/config';
import { prisma } from '@/core/database/client';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const username = searchParams.get('username');
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    // Track bio link visit analytics
    if (action === 'track_visit' && username) {
      const emailMappings: Record<string, string> = {
        'victorsole': 'vsoleferioli@gmail.com',
        'victor-sole': 'vsoleferioli@gmail.com',
        'victor.sole': 'vsoleferioli@gmail.com',
      };

      const email = emailMappings[username.toLowerCase()];

      if (email) {
        const user = await prisma.users.findUnique({
          where: {
            email: email,
            role: UserRole.TRAINER
          },
          select: { id: true }
        });

        if (user) {
          // Log the visit for analytics (you could create a separate model for this)
          // For now, we'll return the tracking confirmation
          const visitData = {
            trainerId: user.id,
            timestamp: new Date().toISOString(),
            utmSource: utmSource || 'direct',
            utmMedium: utmMedium || 'bio_link',
            utmCampaign: utmCampaign || 'massitree',
            userAgent: request.headers.get('user-agent') || '',
            referer: request.headers.get('referer') || ''
          };

          return NextResponse.json({
            success: true,
            message: 'Visit tracked successfully',
            data: visitData
          });
        }
      }

      return NextResponse.json({
        success: false,
        message: 'Trainer not found'
      }, { status: 404 });
    }

    // Generate trainer URL from email
    if (action === 'generate_url') {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json({
          success: false,
          message: 'Authentication required'
        }, { status: 401 });
      }

      const userEmail = session.user.email;
      let username = '';

      // Map emails to usernames
      const emailToUsernameMap: Record<string, string> = {
        'vsoleferioli@gmail.com': 'victorsole'
      };

      username = (userEmail && emailToUsernameMap[userEmail]) || '';

      if (!username) {
        return NextResponse.json({
          success: false,
          message: 'Username mapping not found for this email'
        }, { status: 404 });
      }

      const baseUrl = process.env.NEXTAUTH_URL || 'https://massimino.fitness';
      const trainerUrl = `${baseUrl}/trainer/${username}`;
      const bioUrl = `https://bio.massimino.fitness/${username}`;

      // Generate URLs with UTM parameters for different platforms
      const urlVariants = {
        primary: `${trainerUrl}?utm_source=massitree&utm_medium=bio_link&utm_campaign=trainer_profile`,
        linktree: `${trainerUrl}?utm_source=linktree&utm_medium=social&utm_campaign=bio_link`,
        instagram: `${trainerUrl}?utm_source=instagram&utm_medium=social&utm_campaign=bio_link`,
        tiktok: `${trainerUrl}?utm_source=tiktok&utm_medium=social&utm_campaign=bio_link`,
        bio_subdomain: `${bioUrl}?utm_source=massitree&utm_medium=bio_subdomain&utm_campaign=trainer_profile`
      };

      return NextResponse.json({
        success: true,
        data: {
          username,
          email: userEmail,
          urls: urlVariants,
          qrCodeUrls: {
            primary: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlVariants.primary)}`,
            bio: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlVariants.bio_subdomain)}`
          }
        }
      });
    }

    // Get analytics data for authenticated trainers
    if (action === 'analytics') {
      const session = await getServerSession(authOptions);

      if (!session?.user || session.user.role !== UserRole.TRAINER) {
        return NextResponse.json({
          success: false,
          message: 'Trainer authentication required'
        }, { status: 401 });
      }

      // This is a placeholder for future analytics implementation
      // You would typically store visit data in a separate analytics table
      const analyticsData = {
        totalVisits: 0, // Would come from analytics table
        uniqueVisitors: 0,
        topSources: [], // UTM source breakdown
        conversionRate: 0,
        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        data: analyticsData
      });
    }

    // Validate trainer profile completeness for Massitree
    if (action === 'validate_profile') {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json({
          success: false,
          message: 'Authentication required'
        }, { status: 401 });
      }

      const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: {
          role: true,
          trainerVerified: true,
          trainerBio: true,
          name: true,
          image: true,
          instagramUrl: true,
          youtubeUrl: true,
          linkedinUrl: true,
          showSocialMedia: true,
          // ownedTeams does not exist on users; compute separately
        }
      });

      if (!user || user.role !== UserRole.TRAINER) {
        return NextResponse.json({
          success: false,
          message: 'Trainer account required'
        }, { status: 403 });
      }

      // Calculate profile completeness score
      let completenessScore = 0;
      const checks = [
        { name: 'Basic Info', completed: !!user.name, weight: 20 },
        { name: 'Profile Photo', completed: !!user.image, weight: 15 },
        { name: 'NASM Verification', completed: user.trainerVerified, weight: 25 },
        { name: 'Bio Description', completed: !!user.trainerBio && user.trainerBio.length > 50, weight: 20 },
        { name: 'Social Media', completed: user.showSocialMedia && (!!user.instagramUrl || !!user.youtubeUrl || !!user.linkedinUrl), weight: 10 },
        { name: 'Team Leadership', completed: (await prisma.teams.count({ where: { trainerId: session.user.id } })) > 0, weight: 10 }
      ];

      const completedChecks = checks.filter(check => check.completed);
      completenessScore = completedChecks.reduce((total, check) => total + check.weight, 0);

      return NextResponse.json({
        success: true,
        data: {
          completenessScore,
          totalChecks: checks.length,
          completedChecks: completedChecks.length,
          checks,
          isReady: completenessScore >= 80, // 80% completion required for Massitree
          recommendations: checks
            .filter(check => !check.completed)
            .map(check => `Complete: ${check.name}`)
        }
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action parameter. Available actions: track_visit, generate_url, analytics, validate_profile'
    }, { status: 400 });

  } catch (error) {
    console.error('Massitree API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST method for future features like manual analytics logging
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.TRAINER) {
      return NextResponse.json({
        success: false,
        message: 'Trainer authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (action === 'log_conversion') {
      // Log conversion events (sign-ups, contact form submissions, etc.)
      const conversionData = {
        trainerId: session.user.id,
        type: data.type, // 'signup', 'contact', 'booking'
        source: data.source || 'massitree',
        timestamp: new Date().toISOString(),
        metadata: data.metadata || {}
      };

      // In a real implementation, you'd store this in a conversions table
      return NextResponse.json({
        success: true,
        message: 'Conversion logged successfully',
        data: conversionData
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action for POST request'
    }, { status: 400 });

  } catch (error) {
    console.error('Massitree POST API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
