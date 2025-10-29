'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, X, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Athlete {
  id: string;
  name: string | null;
  image: string | null;
  massiminoUsername: string | null;
}

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  users: Athlete;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  team_members: TeamMember[];
}

interface TeamAssignmentProps {
  athletes: Athlete[];
}

export function TeamAssignment({ athletes }: TeamAssignmentProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [availableAthletes, setAvailableAthletes] = useState<Athlete[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/coaching/teams/assign');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAthletes = async (teamId: string) => {
    try {
      const response = await fetch(`/api/coaching/teams/assign?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableAthletes(data.athletes || []);
      }
    } catch (error) {
      console.error('Error fetching available athletes:', error);
    }
  };

  const handleAddToTeam = async (teamId: string, athleteId: string) => {
    try {
      const response = await fetch('/api/coaching/teams/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, athleteId }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to add athlete to team');
        return;
      }

      await fetchTeams();
      setShowAssignModal(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error('Error adding athlete to team:', error);
      alert('Failed to add athlete to team');
    }
  };

  const handleRemoveFromTeam = async (teamId: string, athleteId: string) => {
    if (!confirm('Remove this athlete from the team?')) return;

    try {
      const response = await fetch(`/api/coaching/teams/assign?teamId=${teamId}&athleteId=${athleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to remove athlete from team');
        return;
      }

      await fetchTeams();
    } catch (error) {
      console.error('Error removing athlete from team:', error);
      alert('Failed to remove athlete from team');
    }
  };

  const openAssignModal = (teamId: string) => {
    setSelectedTeam(teamId);
    fetchAvailableAthletes(teamId);
    setShowAssignModal(true);
  };

  if (loading) {
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

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Teams Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create teams in the Team Management section to organize your athletes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-brand-primary" />
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                </div>
                <Badge variant="secondary">
                  {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                </Badge>
              </div>
              {team.description && (
                <p className="text-sm text-gray-600 mt-2">{team.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Team members */}
                {team.team_members.length > 0 ? (
                  <div className="space-y-2">
                    {team.team_members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-2">
                          {member.users.image ? (
                            <img
                              src={member.users.image}
                              alt={member.users.name || ''}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.users.name}
                            </p>
                            {member.users.massiminoUsername && (
                              <p className="text-xs text-gray-500">
                                @{member.users.massiminoUsername}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFromTeam(team.id, member.userId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No athletes assigned yet
                  </p>
                )}

                {/* Add athlete button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openAssignModal(team.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Athlete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Athlete Modal */}
      {showAssignModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Athlete to Team</CardTitle>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTeam(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableAthletes.length > 0 ? (
                  availableAthletes.map((athlete) => (
                    <div
                      key={athlete.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAddToTeam(selectedTeam, athlete.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {athlete.image ? (
                          <img
                            src={athlete.image}
                            alt={athlete.name || ''}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-brand-primary flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{athlete.name}</p>
                          {athlete.massiminoUsername && (
                            <p className="text-sm text-gray-500">
                              @{athlete.massiminoUsername}
                            </p>
                          )}
                        </div>
                      </div>
                      <Plus className="h-5 w-5 text-brand-primary" />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    All your athletes are already in this team
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
