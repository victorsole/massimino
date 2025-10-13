// src/app/assessments/actions.ts

'use server'

import { prisma } from '@/core/database'
import { revalidatePath } from 'next/cache'

interface SaveAssessmentData {
  trainerId: string
  clientId: string
  type: string
  data: Record<string, any>
  status: 'draft' | 'complete'
}

export async function saveAssessment(assessmentData: SaveAssessmentData) {
  try {
    // Validate inputs
    if (!assessmentData.trainerId || !assessmentData.clientId || !assessmentData.type) {
      return { success: false, error: 'Missing required fields' }
    }

    // Check if assessment already exists
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        trainerId: assessmentData.trainerId,
        clientId: assessmentData.clientId,
        type: assessmentData.type,
      }
    })

    let result
    if (existingAssessment) {
      // Update existing assessment
      result = await prisma.assessment.update({
        where: { id: existingAssessment.id },
        data: {
          data: assessmentData.data,
          status: assessmentData.status,
          updatedAt: new Date(),
        }
      })
    } else {
      // Create new assessment
      result = await prisma.assessment.create({
        data: {
          trainerId: assessmentData.trainerId,
          clientId: assessmentData.clientId,
          type: assessmentData.type,
          data: assessmentData.data,
          status: assessmentData.status,
        }
      })
    }

    revalidatePath('/assessments')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error saving assessment:', error)
    return { success: false, error: 'Failed to save assessment' }
  }
}

export async function loadAssessment(trainerId: string, clientId: string, type: string) {
  try {
    const assessment = await prisma.assessment.findFirst({
      where: {
        trainerId,
        clientId,
        type,
      }
    })

    return { success: true, data: assessment }
  } catch (error) {
    console.error('Error loading assessment:', error)
    return { success: false, error: 'Failed to load assessment' }
  }
}

export async function getAssessmentsList(trainerId: string) {
  try {
    const assessments = await prisma.assessment.findMany({
      where: {
        trainerId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc',
      }
    })

    return { success: true, data: assessments }
  } catch (error) {
    console.error('Error getting assessments list:', error)
    return { success: false, error: 'Failed to get assessments' }
  }
}

export async function deleteAssessment(assessmentId: string, trainerId: string) {
  try {
    // Verify ownership before deletion
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        trainerId,
      }
    })

    if (!assessment) {
      return { success: false, error: 'Assessment not found or unauthorized' }
    }

    await prisma.assessment.delete({
      where: { id: assessmentId }
    })

    revalidatePath('/assessments')
    return { success: true }
  } catch (error) {
    console.error('Error deleting assessment:', error)
    return { success: false, error: 'Failed to delete assessment' }
  }
}