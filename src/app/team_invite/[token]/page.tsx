// src/app/team_invite/[token]/page.tsx

/**
 * Team Invitation Landing Page
 * Public page for users to view and accept team invitations via email link
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { TeamInviteCard } from '@/components/teams/team_invite_card';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

async function getInvitation(token: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/teams/invite/${token}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('[Team Invite Page] Error fetching invitation:', error);
    return null;
  }
}

export default async function TeamInvitePage({ params }: PageProps) {
  const { token } = await params;
  const invite = await getInvitation(token);

  if (!invite) {
    redirect('/404');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-secondary via-white to-brand-secondary/30 py-12 px-4">
      <div className="container mx-auto">
        {/* Massimino Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-brand-primary mb-2">
            Massimino
          </h1>
          <p className="text-gray-600">Your Fitness Journey Starts Here</p>
        </div>

        {/* Invitation Card */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-brand-primary" size={48} />
            </div>
          }
        >
          <TeamInviteCard invite={invite} token={token} />
        </Suspense>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-600">
          <p>
            © {new Date().getFullYear()} Massimino. All rights reserved.
          </p>
          <p className="mt-2">
            Questions? Contact us at{' '}
            <a
              href="mailto:support@massimino.app"
              className="text-brand-primary hover:underline"
            >
              support@massimino.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Metadata
export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const invite = await getInvitation(token);

  if (!invite) {
    return {
      title: 'Invitation Not Found | Massimino',
    };
  }

  return {
    title: `Join ${invite.teamName} | Massimino`,
    description: `You've been invited to join ${invite.teamName} on Massimino. Accept your invitation to start training with your team!`,
  };
}
