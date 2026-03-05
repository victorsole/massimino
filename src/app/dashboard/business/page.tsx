'use client';

import BusinessDashboard from '@/components/trainer/business_dashboard';

export default function BusinessPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 font-display">Business</h2>
        <p className="text-sm text-gray-500 mt-1">Revenue analytics and client management.</p>
      </div>
      <BusinessDashboard />
    </div>
  );
}
