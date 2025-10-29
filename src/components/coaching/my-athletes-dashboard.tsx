'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, MessageSquare, Plus, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AthletesList } from './athletes-list';
import { PreProfileList } from './pre-profile-list';
import { PendingRequests } from './pending-requests';
import { InviteAthleteModal } from './invite-athlete-modal';
import { TeamAssignment } from './team-assignment';

interface MyAthletesDashboardProps {
  userId: string;
}

export function MyAthletesDashboard({ userId }: MyAthletesDashboardProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'invited' | 'requests'>('active');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/coaching/athletes');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching athletes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInviteAthlete = async (email: string, name?: string, message?: string) => {
    const response = await fetch('/api/coaching/athletes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, message }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send invitation');
    }

    await fetchData();
  };

  const handleResendInvitation = async (invitationId: string) => {
    const response = await fetch('/api/coaching/athletes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error || 'Failed to resend invitation');
      return;
    }

    await fetchData();
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    const response = await fetch(`/api/coaching/athletes?id=${invitationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error || 'Failed to cancel invitation');
      return;
    }

    await fetchData();
  };

  const handleAcceptRequest = async (requestId: string) => {
    const response = await fetch(`/api/coaching/requests/${requestId}/accept`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error || 'Failed to accept request');
      return;
    }

    await fetchData();
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to decline this request?')) return;

    const response = await fetch(`/api/coaching/requests/${requestId}/decline`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error || 'Failed to decline request');
      return;
    }

    await fetchData();
  };

  const handleViewProgress = (athleteId: string) => {
    // TODO: Open progress modal or navigate to progress page
    console.log('View progress for:', athleteId);
  };

  const handleCreateSession = (athleteId: string) => {
    // TODO: Open create session modal
    console.log('Create session for:', athleteId);
  };

  const handleMessage = (athleteId: string) => {
    // TODO: Open messaging
    console.log('Message athlete:', athleteId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const stats = {
    activeAthletes: data?.withProfile?.filter((a: any) => a.status === 'ACTIVE').length || 0,
    pendingInvitations: data?.withoutProfile?.length || 0,
    pendingRequests: data?.pendingRequests?.length || 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary mb-2">
            My Athletes
          </h1>
          <p className="text-gray-600">
            Manage your athletes, track their progress, and create workouts
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite Athlete
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Athletes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeAthletes}</p>
                <p className="text-xs text-gray-500">Currently training</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Invitations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingInvitations}</p>
                <p className="text-xs text-gray-500">Waiting to join</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Coaching Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                <p className="text-xs text-gray-500">Awaiting response</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex space-x-2 border-b">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-3 px-6 font-medium text-sm transition-colors ${
                activeTab === 'active'
                  ? 'border-b-2 border-brand-primary text-brand-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Active Athletes ({stats.activeAthletes})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('invited')}
              className={`py-3 px-6 font-medium text-sm transition-colors ${
                activeTab === 'invited'
                  ? 'border-b-2 border-brand-primary text-brand-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Invited ({stats.pendingInvitations})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-3 px-6 font-medium text-sm transition-colors ${
                activeTab === 'requests'
                  ? 'border-b-2 border-brand-primary text-brand-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Requests ({stats.pendingRequests})
              </div>
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {activeTab === 'active' && (
            <AthletesList
              athletes={data?.withProfile || []}
              onViewProgress={handleViewProgress}
              onCreateSession={handleCreateSession}
              onMessage={handleMessage}
            />
          )}
          {activeTab === 'invited' && (
            <PreProfileList
              invitations={data?.withoutProfile || []}
              onResend={handleResendInvitation}
              onCancel={handleCancelInvitation}
            />
          )}
          {activeTab === 'requests' && (
            <PendingRequests
              requests={data?.pendingRequests || []}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          )}
        </CardContent>
      </Card>

      {/* Team Assignment Section */}
      {stats.activeAthletes > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-brand-primary mb-4">
            Team Management
          </h2>
          <p className="text-gray-600 mb-6">
            Organize your athletes into teams for group workouts and challenges
          </p>
          <TeamAssignment athletes={data?.withProfile || []} />
        </div>
      )}

      <InviteAthleteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteAthlete}
      />
    </div>
  );
}
