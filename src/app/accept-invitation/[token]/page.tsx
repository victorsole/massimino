import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { AcceptInvitationForm } from '@/components/coaching/accept-invitation-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Accept Invitation | Massimino',
  description: 'Join your trainer on Massimino',
};

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getServerSession(authOptions);

  // If already logged in, handle differently
  if (session?.user?.id) {
    // TODO: Auto-accept invitation for logged-in users
    // For now, redirect to dashboard
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center p-4">
      <AcceptInvitationForm token={token} />
    </div>
  );
}
