import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { prisma } from '@/core/database'
import { generateWorkoutSuggestions } from '@/services/ai/workout-suggestions'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's fitness preferences
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        fitnessGoals: true,
        experienceLevel: true,
        preferredWorkoutTypes: true,
        availableWorkoutDays: true,
        preferredWorkoutDuration: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has set up fitness preferences
    if (!user.fitnessGoals.length && !user.preferredWorkoutTypes.length) {
      return NextResponse.json({
        suggestions: [],
        message: 'Please set up your fitness preferences in your profile to get personalized workout suggestions.'
      })
    }

    // Generate AI workout suggestions
    const suggestions = await generateWorkoutSuggestions({
      userId,
      fitnessGoals: user.fitnessGoals,
      experienceLevel: user.experienceLevel,
      preferredWorkoutTypes: user.preferredWorkoutTypes,
      availableWorkoutDays: user.availableWorkoutDays,
      preferredWorkoutDuration: user.preferredWorkoutDuration || '30-60'
    })

    return NextResponse.json({ suggestions })

  } catch (error) {
    console.error('AI workout suggestions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
