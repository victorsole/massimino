/**
 * Teams Discovery Page
 * Public page for discovering and joining teams
 */

import { TeamInterface } from '@/components/teams/team_interface';

export default function TeamsDiscoverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-secondary to-brand-secondary-dark py-8">
      <div className="container mx-auto px-4">
        <TeamInterface mode="discovery" />
      </div>
    </div>
  );
}