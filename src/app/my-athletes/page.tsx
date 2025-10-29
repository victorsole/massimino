import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { MyAthletesDashboard } from '@/components/coaching/my-athletes-dashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Athletes | Massimino',
  description: 'Manage your athletes, track progress, and create workouts',
};

export default async function MyAthletesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <MyAthletesDashboard userId={session.user.id} />;
}
