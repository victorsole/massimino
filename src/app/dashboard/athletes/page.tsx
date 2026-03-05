'use client';

import { MyAthletesDashboardSection } from '@/components/coaching/my-athletes-dashboard-section';

export default function AthletesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 font-display">My Athletes</h2>
        <p className="text-sm text-gray-500 mt-1">Manage and monitor your athletes.</p>
      </div>
      <MyAthletesDashboardSection />
    </div>
  );
}
