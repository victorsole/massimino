// src/app/assessments/page.tsx

import { prisma } from '@/core/database'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth/config'
import AssessmentClient from './assessment_client'

export default async function AssessmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  // Check if user is a trainer or admin
  if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Get trainer's clients
  const clients = await prisma.users.findMany({
    where: {
      role: 'CLIENT',
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      email: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Athlete Assessments
        </h1>
        <p className="text-gray-600 text-lg">
          Conduct comprehensive fitness assessments for your athletes
        </p>
      </div>

      <AssessmentClient
        trainerId={session.user.id}
        clients={clients}
      />
    </div>
  )
}
