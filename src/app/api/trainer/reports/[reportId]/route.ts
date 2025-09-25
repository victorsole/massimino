/**
 * Individual Progress Report Management API
 * Handle specific progress report operations
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { shareProgressReport } from '@/core/database';
import { prisma } from '@/core/database';

// ============================================================================
// GET - Fetch specific progress report
// ============================================================================

export async function GET(
  _request: Request,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = params;

    const report = await prisma.progressReport.findUnique({
      where: { id: reportId },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        trainerClient: {
          select: {
            id: true,
            goals: true,
            startDate: true
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Progress report not found' }, { status: 404 });
    }

    // Check authorization
    const isTrainer = session.user.id === report.trainer.userId;
    const isClient = session.user.id === report.clientId;

    if (!isTrainer && !isClient) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Clients can only see shared reports
    if (isClient && !report.isShared) {
      return NextResponse.json({ error: 'Report not shared yet' }, { status: 403 });
    }

    // Mark as viewed by client
    if (isClient && !report.clientViewed) {
      await prisma.progressReport.update({
        where: { id: reportId },
        data: {
          clientViewed: true,
          clientViewedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Progress report fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress report' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update progress report
// ============================================================================

export async function PUT(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = params;
    const body = await request.json();

    const report = await prisma.progressReport.findUnique({
      where: { id: reportId },
      include: {
        trainer: {
          select: { userId: true }
        }
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Progress report not found' }, { status: 404 });
    }

    // Only trainer can update reports
    if (session.user.id !== report.trainer.userId) {
      return NextResponse.json({ error: 'Access denied - trainers only' }, { status: 403 });
    }

    // Handle different update types
    const { action, ...updateData } = body;

    if (action === 'share') {
      // Share the report with client
      const sharedReport = await shareProgressReport(reportId);

      console.log('Progress report shared:', {
        reportId,
        trainerId: report.trainerId,
        clientId: report.clientId
      });

      // TODO: Send notification to client about new progress report

      return NextResponse.json({
        success: true,
        data: sharedReport,
        message: 'Progress report shared with client'
      });

    } else if (action === 'update') {
      // Update report content
      const allowedFields = [
        'title',
        'summary',
        'goals',
        'achievements',
        'metrics',
        'workoutStats',
        'recommendations',
        'nextGoals'
      ];

      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      const updatedReport = await prisma.progressReport.update({
        where: { id: reportId },
        data: {
          ...filteredData,
          updatedAt: new Date()
        }
      });

      console.log('Progress report updated:', {
        reportId,
        fields: Object.keys(filteredData)
      });

      return NextResponse.json({
        success: true,
        data: updatedReport,
        message: 'Progress report updated successfully'
      });

    } else {
      return NextResponse.json({
        error: 'Invalid action. Use "share" or "update"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Progress report update error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress report' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete progress report
// ============================================================================

export async function DELETE(
  _request: Request,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = params;

    const report = await prisma.progressReport.findUnique({
      where: { id: reportId },
      include: {
        trainer: {
          select: { userId: true }
        }
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Progress report not found' }, { status: 404 });
    }

    // Only trainer can delete reports
    if (session.user.id !== report.trainer.userId) {
      return NextResponse.json({ error: 'Access denied - trainers only' }, { status: 403 });
    }

    // Check if report is already shared
    if (report.isShared) {
      return NextResponse.json({
        error: 'Cannot delete shared progress reports'
      }, { status: 400 });
    }

    await prisma.progressReport.delete({
      where: { id: reportId }
    });

    console.log('Progress report deleted:', {
      reportId,
      trainerId: report.trainerId,
      clientId: report.clientId
    });

    return NextResponse.json({
      success: true,
      message: 'Progress report deleted successfully'
    });

  } catch (error) {
    console.error('Progress report deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete progress report' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Client feedback on progress report
// ============================================================================

export async function PATCH(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = params;
    const body = await request.json();
    const { feedbackFromClient, rating } = body;

    const report = await prisma.progressReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        clientId: true,
        isShared: true
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Progress report not found' }, { status: 404 });
    }

    // Only client can provide feedback
    if (session.user.id !== report.clientId) {
      return NextResponse.json({ error: 'Access denied - clients only' }, { status: 403 });
    }

    // Report must be shared to provide feedback
    if (!report.isShared) {
      return NextResponse.json({
        error: 'Cannot provide feedback on unshared report'
      }, { status: 400 });
    }

    const updatedReport = await prisma.progressReport.update({
      where: { id: reportId },
      data: {
        feedbackFromClient,
        rating: rating ? Math.min(Math.max(rating, 1), 5) : null, // Ensure rating is 1-5
        updatedAt: new Date()
      }
    });

    console.log('Client feedback added to progress report:', {
      reportId,
      clientId: report.clientId,
      rating,
      hasFeedback: !!feedbackFromClient
    });

    return NextResponse.json({
      success: true,
      data: updatedReport,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Progress report feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
