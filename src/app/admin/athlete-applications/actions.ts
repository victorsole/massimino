'use server';

import { prisma } from '@/core/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { revalidatePath } from 'next/cache';

export async function approveApplication(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const id = formData.get('id') as string;
  if (!id) throw new Error('Application ID required');

  await prisma.athlete_applications.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
  });

  revalidatePath('/admin/athlete-applications');
}

export async function rejectApplication(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const id = formData.get('id') as string;
  if (!id) throw new Error('Application ID required');

  await prisma.athlete_applications.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
  });

  revalidatePath('/admin/athlete-applications');
}

export async function addAdminNotes(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const id = formData.get('id') as string;
  const notes = formData.get('notes') as string;
  if (!id) throw new Error('Application ID required');

  await prisma.athlete_applications.update({
    where: { id },
    data: {
      adminNotes: notes,
    },
  });

  revalidatePath('/admin/athlete-applications');
}
