/**
 * Wearable Workout Sessions API
 * Phase 4.6: Handle workout session data from wearable devices
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const workoutSessionSchema = z.object({
  deviceId: z.string(),
  type: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().optional(),
  calories: z.number().optional(),
  distance: z.number().optional(),
  steps: z.number().optional(),
  averageHeartRate: z.number().optional(),
  maxHeartRate: z.number().optional(),
  heartRateZones: z.array(z.object({
    zone: z.enum(['rest', 'fat_burn', 'cardio', 'peak']),
    timeInZone: z.number(),
  })).optional(),
  gpsData: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    altitude: z.number().optional(),
    timestamp: z.string().datetime(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const sessionData = workoutSessionSchema.parse(body);

    // Create workout log entry from wearable data
    const workoutLogEntry = await prisma.workout_log_entries.create({
      data: {
        userId: session.user.id,
        exerciseId: 'wearable-workout', // Default exercise ID for wearable workouts
        date: new Date(sessionData.startTime),
        order: '1',
        setNumber: 1,
        reps: 0,
        weight: '0',
        unit: 'KG',
        restSeconds: 0,
        setType: 'STRAIGHT',
        userComments: `${sessionData.type} workout synced from wearable device: ${sessionData.deviceId}`,
        duration: sessionData.duration ? sessionData.duration.toString() : null,
        allowComments: false,
      } as Prisma.workout_log_entriesUncheckedCreateInput,
    });

    // Create health data entries for key metrics
    const healthDataEntries = [];

    if (sessionData.calories) {
      healthDataEntries.push({
        userId: session.user.id,
        dataType: 'CALORIES' as const,
        value: sessionData.calories,
        unit: 'kcal',
        source: `wearable_${sessionData.deviceId}`,
        recordedAt: new Date(sessionData.startTime),
      });
    }

    if (sessionData.steps) {
      healthDataEntries.push({
        userId: session.user.id,
        dataType: 'STEPS' as const,
        value: sessionData.steps,
        unit: 'count',
        source: `wearable_${sessionData.deviceId}`,
        recordedAt: new Date(sessionData.startTime),
      });
    }

    if (sessionData.distance) {
      healthDataEntries.push({
        userId: session.user.id,
        dataType: 'DISTANCE' as const,
        value: sessionData.distance,
        unit: 'meters',
        source: `wearable_${sessionData.deviceId}`,
        recordedAt: new Date(sessionData.startTime),
      });
    }

    if (sessionData.averageHeartRate) {
      healthDataEntries.push({
        userId: session.user.id,
        dataType: 'HEART_RATE' as const,
        value: sessionData.averageHeartRate,
        unit: 'bpm',
        source: `wearable_${sessionData.deviceId}`,
        recordedAt: new Date(sessionData.startTime),
      });
    }

    // Bulk create health data entries
    if (healthDataEntries.length > 0) {
      await prisma.health_data.createMany({
        data: healthDataEntries,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      workoutLogEntryId: workoutLogEntry.id,
      healthDataCount: healthDataEntries.length,
      message: 'Workout session synced successfully',
    });

  } catch (error) {
    console.error('Wearable workout session sync error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid workout session data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync workout session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    } else {
      const start = new Date();
      start.setDate(start.getDate() - days);
      dateFilter = {
        date: {
          gte: start,
          lte: new Date(),
        },
      };
    }

    // Build where clause
    const where: any = {
      userId: session.user.id,
      exerciseId: 'wearable-workout',
      ...dateFilter,
    };

    // Get workout sessions
    const workoutSessions = await prisma.workout_log_entries.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
      take: 100, // Limit results
    });

    return NextResponse.json({
      success: true,
      sessions: workoutSessions.map(session => ({
        id: session.id,
        date: session.date,
        duration: session.duration,
        userComments: session.userComments,
      })),
      totalSessions: workoutSessions.length,
    });

  } catch (error) {
    console.error('Get wearable workout sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to get workout sessions' },
      { status: 500 }
    );
  }
}
