'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Mail, MessageSquare, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function MyAthletesDashboardSection() {
  const [stats, setStats] = useState({
    activeAthletes: 0,
    pendingInvitations: 0,
    pendingRequests: 0,
    loading: true,
  });

  // Force cache invalidation

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/coaching/athletes');
      if (response.ok) {
        const data = await response.json();
        setStats({
          activeAthletes: data.withProfile?.filter((a: any) => a.status === 'ACTIVE').length || 0,
          pendingInvitations: data.withoutProfile?.length || 0,
          pendingRequests: data.pendingRequests?.length || 0,
          loading: false,
        });
      } else {
        setStats(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching athlete stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  if (stats.loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-primary" />
          My Athletes
        </CardTitle>
        <CardDescription>
          Manage your athletes, track progress, and create workouts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeAthletes}</p>
            <p className="text-xs text-gray-600">Active Athletes</p>
          </div>

          <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center justify-center mb-2">
              <Mail className="h-6 w-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingInvitations}</p>
            <p className="text-xs text-gray-600">Pending Invites</p>
          </div>

          <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
            <p className="text-xs text-gray-600">Requests</p>
          </div>
        </div>

        <Link href="/my-athletes">
          <Button className="w-full">
            <ArrowRight className="h-4 w-4 mr-2" />
            Manage My Athletes
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
