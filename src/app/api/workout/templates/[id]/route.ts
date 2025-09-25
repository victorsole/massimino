/**
 * Individual Workout Template API Route
 * Handles operations for specific workout templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { UserRole } from '@prisma/client';
import {
  getWorkoutTemplateById,
  updateWorkoutTemplate,
  deleteWorkoutTemplate,
  purchaseTemplate,
  rateTemplate
} from '@/core/database';
import { updateWorkoutTemplateSchema, rateTemplateSchema } from '@/core/utils/workout-validation';

// ============================================================================
// GET /api/workout/templates/[id]
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await getWorkoutTemplateById(params.id);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching workout template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/workout/templates/[id]
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Check for special actions
    if (body.action === 'purchase') {
      const purchase = await purchaseTemplate(params.id, session.user.id);
      return NextResponse.json({
        success: true,
        purchase,
        message: 'Template purchased successfully'
      });
    }

    if (body.action === 'rate') {
      const validatedData = rateTemplateSchema.parse(body);
      const rating = await rateTemplate(params.id, session.user.id, validatedData);
      return NextResponse.json({
        success: true,
        rating,
        message: 'Template rated successfully'
      });
    }

    // Regular update - check ownership
    const template = await getWorkoutTemplateById(params.id);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.createdBy !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'You can only edit your own templates' },
        { status: 403 }
      );
    }

    // Validate update data
    const validatedData = updateWorkoutTemplateSchema.parse(body);

    // Update template
    const updatedTemplate = await updateWorkoutTemplate(params.id, validatedData);

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating workout template:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/workout/templates/[id]
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const template = await getWorkoutTemplateById(params.id);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.createdBy !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'You can only delete your own templates' },
        { status: 403 }
      );
    }

    await deleteWorkoutTemplate(params.id);

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workout template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}