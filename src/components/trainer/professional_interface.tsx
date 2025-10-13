'use client'

/**
 * Professional Interface Component
 * Comprehensive professional trainer suite for partnerships, challenges, mentoring, networking, reviews
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Users, Trophy, GraduationCap, Network, Star, Plus, Edit,
  TrendingUp
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ProfessionalDashboardData {
  partnerships: Array<{
    id: string;
    partnerName: string;
    type: string;
    status: string;
    revenueShare: number;
    totalRevenue: number;
    createdAt: Date;
  }>;
  challenges: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    participants: number;
    maxParticipants?: number;
    startDate: Date;
    endDate: Date;
    prizePool?: number;
  }>;
  mentorships: Array<{
    id: string;
    mentorName?: string;
    menteeName?: string;
    type: 'mentor' | 'mentee';
    status: string;
    startDate: Date;
    sessionsCompleted: number;
  }>;
  connections: Array<{
    id: string;
    name: string;
    specializations: string[];
    location?: string;
    rating: number;
    connectedAt: Date;
  }>;
  reviews: Array<{
    id: string;
    reviewerName: string;
    rating: number;
    category: string;
    review: string;
    skills: string[];
    createdAt: Date;
  }>;
  analytics: {
    partnerships: {
      totalPartnerships: number;
      activePartnerships: number;
      totalRevenue: number;
      partnerRevenue: number;
    };
    challenges: {
      totalChallenges: number;
      activeChallenges: number;
      totalParticipants: number;
      completionRate: number;
    };
    networking: {
      totalConnections: number;
      pendingRequests: number;
      networkReach: number;
      connectionGrowth: number;
    };
    reviews: {
      overallRating: number;
      totalReviews: number;
      recommendationRate: number;
    };
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProfessionalInterface() {
  const [dashboardData, setDashboardData] = useState<ProfessionalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('month');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trainer/professional?action=dashboard&period=${period}`);
      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      } else {
        console.error('Failed to fetch professional data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching professional data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // OVERVIEW COMPONENT
  // ============================================================================

  const ProfessionalOverview = () => {
    if (!dashboardData) return <div>Loading professional data...</div>;

    const { analytics } = dashboardData;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Partnerships</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.partnerships.activePartnerships}</div>
              <p className="text-xs text-muted-foreground">
                €{(analytics.partnerships.totalRevenue / 100).toFixed(2)} total revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.challenges.activeChallenges}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.challenges.totalParticipants} total participants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professional Network</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.networking.totalConnections}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.networking.pendingRequests} pending requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professional Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.reviews.overallRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.reviews.totalReviews} reviews • {(analytics.reviews.recommendationRate * 100).toFixed(0)}% recommend
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Partnerships</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.partnerships.slice(0, 3).map((partnership) => (
                  <div key={partnership.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{partnership.partnerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {partnership.type} • {partnership.revenueShare}% share
                      </p>
                    </div>
                    <Badge variant={partnership.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {partnership.status}
                    </Badge>
                  </div>
                ))}
                {dashboardData.partnerships.length === 0 && (
                  <p className="text-muted-foreground">No partnerships yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Challenges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.challenges.slice(0, 3).map((challenge) => (
                  <div key={challenge.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{challenge.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {challenge.participants} participants • Ends {new Date(challenge.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {challenge.status}
                    </Badge>
                  </div>
                ))}
                {dashboardData.challenges.length === 0 && (
                  <p className="text-muted-foreground">No active challenges</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveTab('partnerships')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Partnership
                </Button>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('challenges')}>
                  <Trophy className="h-4 w-4 mr-2" />
                  Create Challenge
                </Button>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('networking')}>
                  <Users className="h-4 w-4 mr-2" />
                  Find Connections
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.reviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{review.reviewerName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {review.review}
                    </p>
                  </div>
                ))}
                {dashboardData.reviews.length === 0 && (
                  <p className="text-muted-foreground text-sm">No reviews yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.connections.slice(0, 2).map((connection) => (
                  <div key={connection.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{connection.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {connection.specializations.slice(0, 2).join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
                {dashboardData.connections.length === 0 && (
                  <p className="text-muted-foreground text-sm">No connections yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ============================================================================
  // PARTNERSHIPS COMPONENT
  // ============================================================================

  const PartnershipsSection = () => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newPartnership, setNewPartnership] = useState({
      partnerEmail: '',
      type: '',
      revenueShare: '50',
      description: '',
      terms: ''
    });

    const handleCreatePartnership = async () => {
      try {
        const response = await fetch('/api/trainer/professional', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-partnership',
            partnerEmail: newPartnership.partnerEmail,
            type: newPartnership.type,
            revenueShare: parseInt(newPartnership.revenueShare),
            description: newPartnership.description,
            terms: newPartnership.terms
          })
        });

        const result = await response.json();
        if (result.success) {
          setShowCreateDialog(false);
          setNewPartnership({ partnerEmail: '', type: '', revenueShare: '50', description: '', terms: '' });
          fetchDashboardData();
        }
      } catch (error) {
        console.error('Error creating partnership:', error);
      }
    };

    if (!dashboardData) return <div>Loading partnerships...</div>;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Professional Partnerships</h3>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Partnership
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Professional Partnership</DialogTitle>
                <DialogDescription>
                  Partner with other trainers for collaborative training programs
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partner-email" className="text-right">Partner Email</Label>
                  <Input
                    id="partner-email"
                    className="col-span-3"
                    value={newPartnership.partnerEmail}
                    onChange={(e) => setNewPartnership(prev => ({ ...prev, partnerEmail: e.target.value }))}
                    placeholder="trainer@example.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partnership-type" className="text-right">Type</Label>
                  <Select value={newPartnership.type} onValueChange={(value) => setNewPartnership(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select partnership type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JOINT_TRAINING">Joint Training Programs</SelectItem>
                      <SelectItem value="REVENUE_SHARING">Revenue Sharing</SelectItem>
                      <SelectItem value="REFERRAL">Referral Partnership</SelectItem>
                      <SelectItem value="MENTORSHIP">Mentorship Exchange</SelectItem>
                      <SelectItem value="CONTENT">Content Collaboration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="revenue-share" className="text-right">Revenue Share (%)</Label>
                  <Input
                    id="revenue-share"
                    type="number"
                    min="0"
                    max="100"
                    className="col-span-3"
                    value={newPartnership.revenueShare}
                    onChange={(e) => setNewPartnership(prev => ({ ...prev, revenueShare: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partnership-desc" className="text-right">Description</Label>
                  <Textarea
                    id="partnership-desc"
                    className="col-span-3"
                    value={newPartnership.description}
                    onChange={(e) => setNewPartnership(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the partnership goals and benefits"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePartnership}>
                  Create Partnership
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {dashboardData.partnerships.map((partnership) => (
            <Card key={partnership.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{partnership.partnerName}</CardTitle>
                    <CardDescription>
                      {partnership.type} • {partnership.revenueShare}% revenue share
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={partnership.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {partnership.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Revenue</p>
                    <p className="font-medium">€{(partnership.totalRevenue / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Started</p>
                    <p className="font-medium">{new Date(partnership.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">{partnership.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {dashboardData.partnerships.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No partnerships yet</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  Create Your First Partnership
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // CHALLENGES SECTION
  // ============================================================================

  const ChallengesSection = () => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newChallenge, setNewChallenge] = useState({
      title: '',
      description: '',
      type: '',
      startDate: '',
      endDate: '',
      maxParticipants: '',
      entryFee: '',
      prizePool: '',
      rules: ''
    });

    const handleCreateChallenge = async () => {
      try {
        const response = await fetch('/api/trainer/professional', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-challenge',
            title: newChallenge.title,
            description: newChallenge.description,
            type: newChallenge.type,
            startDate: newChallenge.startDate,
            endDate: newChallenge.endDate,
            maxParticipants: newChallenge.maxParticipants ? parseInt(newChallenge.maxParticipants) : undefined,
            entryFee: newChallenge.entryFee ? parseFloat(newChallenge.entryFee) * 100 : 0,
            prizePool: newChallenge.prizePool ? parseFloat(newChallenge.prizePool) * 100 : 0,
            rules: newChallenge.rules
          })
        });

        const result = await response.json();
        if (result.success) {
          setShowCreateDialog(false);
          setNewChallenge({ title: '', description: '', type: '', startDate: '', endDate: '', maxParticipants: '', entryFee: '', prizePool: '', rules: '' });
          fetchDashboardData();
        }
      } catch (error) {
        console.error('Error creating challenge:', error);
      }
    };

    if (!dashboardData) return <div>Loading challenges...</div>;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Fitness Challenges</h3>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Fitness Challenge</DialogTitle>
                <DialogDescription>
                  Create engaging fitness challenges for your clients and the community
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="challenge-title" className="text-right">Title</Label>
                  <Input
                    id="challenge-title"
                    className="col-span-3"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="30-Day Strength Challenge"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="challenge-type" className="text-right">Type</Label>
                  <Select value={newChallenge.type} onValueChange={(value) => setNewChallenge(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select challenge type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WORKOUT_GOAL">Workout Goal</SelectItem>
                      <SelectItem value="WEIGHT_LOSS">Weight Loss</SelectItem>
                      <SelectItem value="STRENGTH_GAIN">Strength Gain</SelectItem>
                      <SelectItem value="ENDURANCE">Endurance</SelectItem>
                      <SelectItem value="CONSISTENCY">Consistency</SelectItem>
                      <SelectItem value="STEPS">Steps Challenge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="challenge-desc" className="text-right">Description</Label>
                  <Textarea
                    id="challenge-desc"
                    className="col-span-3"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Challenge description and goals"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start-date" className="text-right">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    className="col-span-3"
                    value={newChallenge.startDate}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="end-date" className="text-right">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    className="col-span-3"
                    value={newChallenge.endDate}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="max-participants" className="text-right">Max Participants</Label>
                  <Input
                    id="max-participants"
                    type="number"
                    className="col-span-3"
                    value={newChallenge.maxParticipants}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, maxParticipants: e.target.value }))}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="entry-fee" className="text-right">Entry Fee (€)</Label>
                  <Input
                    id="entry-fee"
                    type="number"
                    step="0.01"
                    className="col-span-3"
                    value={newChallenge.entryFee}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, entryFee: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prize-pool" className="text-right">Prize Pool (€)</Label>
                  <Input
                    id="prize-pool"
                    type="number"
                    step="0.01"
                    className="col-span-3"
                    value={newChallenge.prizePool}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, prizePool: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="challenge-rules" className="text-right">Rules</Label>
                  <Textarea
                    id="challenge-rules"
                    className="col-span-3"
                    value={newChallenge.rules}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, rules: e.target.value }))}
                    placeholder="Challenge rules and requirements"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateChallenge}>
                  Create Challenge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {dashboardData.challenges.map((challenge) => (
            <Card key={challenge.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    <CardDescription>
                      {challenge.type} • {challenge.participants} participants
                    </CardDescription>
                  </div>
                  <Badge variant={challenge.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {challenge.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Duration</span>
                    <span>{new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}</span>
                  </div>
                  {challenge.prizePool && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Prize Pool</span>
                      <span>€{(challenge.prizePool / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Participants
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {dashboardData.challenges.length === 0 && (
            <Card className="md:col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No challenges yet</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  Create Your First Challenge
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // PLACEHOLDER SECTIONS (simplified for brevity)
  // ============================================================================

  const MentoringSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Mentoring Program
          </CardTitle>
          <CardDescription>
            Connect with experienced trainers or guide newcomers in their fitness journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Mentoring features will be available after database migration.</p>
        </CardContent>
      </Card>
    </div>
  );

  const NetworkingSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Professional Network
          </CardTitle>
          <CardDescription>
            Connect with other fitness professionals, share knowledge, and grow together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Networking features will be available after database migration.</p>
        </CardContent>
      </Card>
    </div>
  );


  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Professional Suite</h2>
          <p className="text-muted-foreground">
            Advanced tools for professional trainers: partnerships, challenges, mentoring, and networking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchDashboardData}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="mentoring">Mentoring</TabsTrigger>
          <TabsTrigger value="networking">Networking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProfessionalOverview />
        </TabsContent>

        <TabsContent value="partnerships">
          <PartnershipsSection />
        </TabsContent>

        <TabsContent value="challenges">
          <ChallengesSection />
        </TabsContent>

        <TabsContent value="mentoring">
          <MentoringSection />
        </TabsContent>

        <TabsContent value="networking">
          <NetworkingSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}