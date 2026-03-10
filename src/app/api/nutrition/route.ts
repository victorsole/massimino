import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { randomUUID } from 'crypto';

// GET /api/nutrition - fetch nutrition logs + active plan for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Fetch today's nutrition logs
    const logs = await prisma.nutrition_logs.findMany({
      where: {
        userId: session.user.id,
        date: new Date(dateStr),
      },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch active nutrition plan (if any)
    const activePlan = await prisma.nutrition_plans.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        meal_plans: {
          orderBy: [{ dayOfWeek: 'asc' }, { mealOrder: 'asc' }],
        },
      },
    });

    // Aggregate daily totals
    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
        fiber: acc.fiber + (log.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    // Group logs by meal type
    const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
    const groupedLogs: Record<string, typeof logs> = {};
    for (const type of mealTypes) {
      groupedLogs[type] = logs.filter((l) => l.mealType.toLowerCase() === type);
    }
    // Any other meal types
    const otherLogs = logs.filter(
      (l) => !mealTypes.includes(l.mealType.toLowerCase())
    );
    if (otherLogs.length > 0) {
      groupedLogs['other'] = otherLogs;
    }

    return NextResponse.json({
      date: dateStr,
      logs,
      groupedLogs,
      totals,
      activePlan: activePlan
        ? {
            id: activePlan.id,
            name: activePlan.name,
            description: activePlan.description,
            targetCalories: activePlan.targetCalories,
            targetProtein: activePlan.targetProtein,
            targetCarbs: activePlan.targetCarbs,
            targetFat: activePlan.targetFat,
            targetFiber: activePlan.targetFiber,
            restrictions: activePlan.restrictions,
            mealPlans: activePlan.meal_plans,
          }
        : null,
    });
  } catch (error) {
    console.error('Nutrition GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/nutrition - log a food entry
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      date,
      mealType,
      foodName,
      quantity,
      unit,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sodium,
      sugar,
      notes,
    } = body;

    if (!mealType || !foodName || calories === undefined) {
      return NextResponse.json(
        { error: 'mealType, foodName, and calories are required' },
        { status: 400 }
      );
    }

    const log = await prisma.nutrition_logs.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        date: new Date(date || new Date().toISOString().split('T')[0]),
        mealType,
        foodName,
        quantity: quantity || 1,
        unit: unit || 'serving',
        calories: Math.round(calories),
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
        fiber: fiber || null,
        sodium: sodium || null,
        sugar: sugar || null,
        notes: notes || null,
        isManual: true,
        source: 'manual',
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Nutrition POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/nutrition?id=<logId> - delete a food entry
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const logId = searchParams.get('id');
    if (!logId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.nutrition_logs.findFirst({
      where: { id: logId, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.nutrition_logs.delete({ where: { id: logId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Nutrition DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
