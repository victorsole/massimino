/**
 * Workout Analytics API Route
 * Handles analytics and progress tracking data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import {
  getWorkoutAnalytics,
  getProgressMetrics,
  getPersonalRecords,
  addProgressMetric,
  addPersonalRecord,
  generateWorkoutAnalytics
} from '@/core/database';
import {
  addProgressMetricSchema,
  addPersonalRecordSchema
} from '@/core/utils/workout-validation';

// ============================================================================
// GET /api/workout/analytics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const metricType = searchParams.get('metricType');
    const exerciseId = searchParams.get('exerciseId');

    switch (type) {
      case 'workout-analytics':
        const waParams: any = {};
        if (startDate) waParams.startDate = new Date(startDate);
        if (endDate) waParams.endDate = new Date(endDate);
        const analytics = await getWorkoutAnalytics(session.user.id, waParams);
        return NextResponse.json(analytics);

      case 'progress-metrics':
        const pmParams: any = {};
        if (metricType) pmParams.metricType = metricType;
        if (startDate) pmParams.startDate = new Date(startDate);
        if (endDate) pmParams.endDate = new Date(endDate);
        const metrics = await getProgressMetrics(session.user.id, pmParams);
        return NextResponse.json(metrics);

      case 'personal-records':
        const recordParams: any = {};
        if (exerciseId) recordParams.exerciseId = exerciseId;
        const records = await getPersonalRecords(session.user.id, recordParams);
        return NextResponse.json(records);

      default:
        // Return comprehensive analytics overview
        const defaultWA: any = {};
        if (startDate) defaultWA.startDate = new Date(startDate);
        if (endDate) defaultWA.endDate = new Date(endDate);
        const [workoutAnalytics, progressMetrics, personalRecords] = await Promise.all([
          getWorkoutAnalytics(session.user.id, defaultWA),
          getProgressMetrics(session.user.id, defaultWA),
          getPersonalRecords(session.user.id)
        ]);

        return NextResponse.json({
          workoutAnalytics,
          progressMetrics,
          personalRecords
        });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/workout/analytics
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type } = body;

    switch (type) {
      case 'progress-metric':
        const validatedMetric = addProgressMetricSchema.parse(body);
        const metric = await addProgressMetric({
          userId: session.user.id,
          metricType: validatedMetric.metricType,
          value: validatedMetric.value,
          ...(validatedMetric.unit ? { unit: validatedMetric.unit } : {}),
          ...(validatedMetric.bodyPart ? { bodyPart: validatedMetric.bodyPart } : {}),
          ...(validatedMetric.notes ? { notes: validatedMetric.notes } : {}),
          ...(validatedMetric.imageUrl ? { imageUrl: validatedMetric.imageUrl } : {}),
          ...(validatedMetric.recordedAt ? { recordedAt: validatedMetric.recordedAt } : {}),
        });

        return NextResponse.json({
          success: true,
          metric,
          message: 'Progress metric added successfully'
        });

      case 'personal-record':
        const validatedRecord = addPersonalRecordSchema.parse(body);
        const record = await addPersonalRecord({
          userId: session.user.id,
          exerciseId: validatedRecord.exerciseId,
          recordType: validatedRecord.recordType,
          value: validatedRecord.value,
          unit: validatedRecord.unit,
          ...(validatedRecord.reps !== undefined ? { reps: validatedRecord.reps } : {}),
          ...(validatedRecord.notes ? { notes: validatedRecord.notes } : {}),
          ...(validatedRecord.achievedAt ? { achievedAt: validatedRecord.achievedAt } : {}),
        });

        return NextResponse.json({
          success: true,
          record,
          message: 'Personal record added successfully'
        });

      case 'generate-analytics':
        // Generate/update analytics for the user
        const analytics = await generateWorkoutAnalytics(session.user.id);

        return NextResponse.json({
          success: true,
          analytics,
          message: 'Analytics generated successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid request type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing analytics request:', error);

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
