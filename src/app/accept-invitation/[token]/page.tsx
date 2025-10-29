import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { nanoid } from 'nanoid';
import { AcceptInvitationForm } from '@/components/coaching/accept-invitation-form';
import { LoggedInAcceptance } from '@/components/coaching/logged-in-acceptance';

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

  // If already logged in, auto-accept if email matches
  if (session?.user?.id) {
    // Fetch invitation
    const invitation = await prisma.athlete_invitations.findUnique({
      where: { token },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Check if invitation is valid
    if (!invitation) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invitation Not Found</h1>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has expired.
            </p>
            <a href="/dashboard" className="text-brand-primary hover:underline">
              Go to Dashboard
            </a>
          </div>
        </div>
      );
    }

    if (invitation.status !== 'PENDING') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
            <h1 className="text-2xl font-bold text-yellow-600 mb-4">Invitation Already Processed</h1>
            <p className="text-gray-600 mb-6">
              This invitation has already been accepted or cancelled.
            </p>
            <a href="/dashboard" className="text-brand-primary hover:underline">
              Go to Dashboard
            </a>
          </div>
        </div>
      );
    }

    if (invitation.expiresAt < new Date()) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invitation Expired</h1>
            <p className="text-gray-600 mb-6">
              This invitation has expired. Please contact your trainer for a new invitation.
            </p>
            <a href="/dashboard" className="text-brand-primary hover:underline">
              Go to Dashboard
            </a>
          </div>
        </div>
      );
    }

    // Check if email matches
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });

    if (!user || user.email !== invitation.athleteEmail) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Email Mismatch</h1>
            <p className="text-gray-600 mb-6">
              This invitation was sent to <strong>{invitation.athleteEmail}</strong>, but you're logged in as <strong>{user?.email}</strong>.
            </p>
            <p className="text-gray-600 mb-6">
              Please log out and sign in with the correct account, or contact your trainer for a new invitation.
            </p>
            <div className="flex gap-4">
              <a href="/api/auth/signout" className="text-brand-primary hover:underline">
                Log Out
              </a>
              <a href="/dashboard" className="text-brand-primary hover:underline">
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Email matches - auto-accept
    return (
      <LoggedInAcceptance
        token={token}
        trainerName={invitation.trainer.name || 'Your Trainer'}
        athleteName={user.name || 'there'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center p-4">
      <AcceptInvitationForm token={token} />
    </div>
  );
}
