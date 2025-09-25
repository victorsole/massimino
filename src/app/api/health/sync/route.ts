/**
 * Health Data Sync API
 * Phase 4.3: Sync health platform data with backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { z } from 'zod';

const healthMetricSchema = z.object({
  type: z.enum(['STEPS', 'HEART_RATE', 'CALORIES_BURNED', 'DISTANCE', 'SLEEP', 'WEIGHT', 'BODY_FAT', 'BLOOD_PRESSURE']),
  value: z.number(),
  unit: z.string(),
  timestamp: z.string().datetime(),
  source: z.string().optional(),
});

const syncHealthDataSchema = z.object({
  metrics: z.array(healthMetricSchema),
  timestamp: z.string().datetime(),
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
    const { metrics, timestamp } = syncHealthDataSchema.parse(body);

    const createdMetrics = [];

    // Process each health metric
    for (const metric of metrics) {
      try {
        // Check if metric already exists (prevent duplicates)
        const existingMetric = await prisma.healthData.findFirst({
          where: {
            userId: session.user.id,
            dataType: metric.type as any,
            recordedAt: new Date(metric.timestamp),
            source: metric.source || 'MANUAL',
          },
        });

        if (!existingMetric) {
          // Create new health data entry
          const healthData = await prisma.healthData.create({
            data: {
              userId: session.user.id,
              dataType: metric.type as any,
              value: metric.value,
              unit: metric.unit,
              recordedAt: new Date(metric.timestamp),
              source: metric.source || 'MANUAL',
              syncedAt: new Date(timestamp),
            },
          });

          createdMetrics.push(healthData);

        }
      } catch (error) {
        console.error(`Error processing metric ${metric.type}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${createdMetrics.length} health metrics`,
      syncedCount: createdMetrics.length,
      totalReceived: metrics.length,
    });

  } catch (error) {
    console.error('Health data sync error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid health data format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync health data' },
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
    const type = searchParams.get('type');
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date range
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        recordedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    } else {
      const start = new Date();
      start.setDate(start.getDate() - days);
      dateFilter = {
        recordedAt: {
          gte: start,
          lte: new Date(),
        },
      };
    }

    // Build query filter
    const where: any = {
      userId: session.user.id,
      ...dateFilter,
    };

    if (type) {
      where.dataType = type;
    }

    // Get health data
    const healthData = await prisma.healthData.findMany({
      where,
      orderBy: {
        recordedAt: 'desc',
      },
      take: 1000, // Limit to prevent large responses
    });

    // Group by type for easier consumption
    const groupedData: Record<string, any[]> = {};
    healthData.forEach(item => {
      const key = String(item.dataType);
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push({
        value: item.value,
        unit: item.unit,
        timestamp: item.recordedAt,
        source: item.source,
      });
    });

    return NextResponse.json({
      success: true,
      data: groupedData,
      totalRecords: healthData.length,
    });

  } catch (error) {
    console.error('Get health data error:', error);
    return NextResponse.json(
      { error: 'Failed to get health data' },
      { status: 500 }
    );
  }
}
