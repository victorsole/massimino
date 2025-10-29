// src/app/dashboard/page.tsx

'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Dumbbell,
  Calendar,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
  Target,
  Zap,
  Users,
  DollarSign,
  Star,
  Clock,
  FileText,
  Gift,
  Trophy,
  UserPlus,
  TrendingUp as TrendingUpIcon,
  // Settings
} from 'lucide-react';
import Link from 'next/link';

// Team components
import { TeamManagement } from '@/components/teams/team_management';
import { TeamInterface } from '@/components/teams/team_interface';
import { MassichatInterface } from '@/components/massichat/chat_interface';

// Business components
import BusinessDashboard from '@/components/trainer/business_dashboard';

// Professional components
import ProfessionalInterface from '@/components/trainer/professional_interface';

// My Athletes components
import { MyAthletesDashboardSection } from '@/components/coaching/my-athletes-dashboard-section';

interface DashboardStats {
  workoutsThisWeek: number;
  totalSessions: number;
  favoriteExercise: { name: string; count: number } | null;
  totalVolume: number;
  currentStreak: number;
  weeklyStats: { week: string; count: number }[];
}

// Unused interface - keeping for future reference
// interface ThirtyDayStats {
//   totalSessions: number;
//   sessionsTrend: number;
//   totalVolume: number;
//   volumeTrend: number;
//   avgSessionDuration: number;
//   durationTrend: number;
// }

interface TrainerStats {
  totalClients: number;
  activeClients: number;
  totalEarnings: number;
  monthlyEarnings: number;
  averageRating: number;
  totalReviews: number;
  upcomingAppointments: number;
  newClientsThisMonth: number;
  pendingReports: number;
}

interface TrainerPointsStats {
  currentBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  successRate: number;
  achievements: {
    type: string;
    title: string;
    unlockedAt: string;
    pointsAwarded: number;
  }[];
  recentTransactions: {
    id: string;
    pointType: string;
    points: number;
    description: string;
    createdAt: string;
  }[];
  availableRewards: {
    id: string;
    type: string;
    title: string;
    description: string;
    pointsCost: number;
    category: string;
    icon: string;
    available: boolean;
  }[];
  redemptionHistory: {
    id: string;
    rewardType: string;
    rewardTitle: string;
    pointsCost: number;
    status: string;
    redeemedAt: string;
    fulfilledAt?: string;
    description: string;
  }[];
  canRedeem: boolean;
  pendingRedemptions: number;
}

interface RecentWorkout {
  id: string;
  date: string;
  exercise: string;
  category: string;
  sets: number;
  reps: number;
  weight: string;
  userComments?: string;
}

interface WorkoutSuggestion {
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    restTime: string;
    notes?: string;
  }[];
  tips: string[];
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMassichatSession = searchParams?.get('massichatSession') || undefined;
  const generatedFlag = searchParams?.get('generated') || undefined;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trainerStats, setTrainerStats] = useState<TrainerStats | null>(null);
  const [trainerPointsStats, setTrainerPointsStats] = useState<TrainerPointsStats | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentWorkouts(data.recentWorkouts);
        setUserRole(data.userRole);

        // Set trainer stats if available
        if (data.trainerStats) {
          setTrainerStats(data.trainerStats);
        }

        // Set trainer points stats if available
        if (data.trainerPointsStats) {
          setTrainerPointsStats(data.trainerPointsStats);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAISuggestions = async () => {
    try {
      setAiLoading(true);
      const response = await fetch('/api/ai/workout-suggestions');
      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // Redirect to login if not authenticated
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-primary mb-2">
          Welcome back, {session.user.name || 'Victor'}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Ready to continue your fitness journey with Massimino?
        </p>
      </div>

      {/* User Info Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <Badge variant="outline" className="mt-1">
                {session.user.role}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Active
                </Badge>
                {/* Trainer Achievement Badges */}
                {userRole === 'TRAINER' && trainerPointsStats?.achievements && trainerPointsStats.achievements.length > 0 && (
                  <div className="flex gap-1">
                    {trainerPointsStats.achievements.slice(0, 2).map((achievement, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-yellow-100 text-yellow-800 text-xs"
                        title={`${achievement.title} - ${achievement.pointsAwarded} points`}
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        {achievement.type.replace('_', ' ')}
                      </Badge>
                    ))}
                    {trainerPointsStats.achievements.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{trainerPointsStats.achievements.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mr-2"></div>
          Loading your stats...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.workoutsThisWeek || 0}</p>
                  <p className="text-xs text-gray-500">Workouts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalSessions || 0}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Favorite Exercise</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats?.favoriteExercise ? stats.favoriteExercise.name.substring(0, 15) + '...' : 'None yet'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats?.favoriteExercise ? `${stats.favoriteExercise.count} times` : 'Start working out!'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.currentStreak || 0}</p>
                  <p className="text-xs text-gray-500">Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trainer Business Stats */}
      {userRole === 'TRAINER' && trainerStats && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-brand-primary mb-4">Trainer Business Overview</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Athletes</p>
                    <p className="text-2xl font-bold text-gray-900">{trainerStats?.activeClients || 0}</p>
                    <p className="text-xs text-gray-500">of {trainerStats?.totalClients || 0} total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">${(trainerStats?.monthlyEarnings || 0).toFixed(0)}</p>
                    <p className="text-xs text-gray-500">${(trainerStats?.totalEarnings || 0).toFixed(0)} total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{(trainerStats?.averageRating || 0).toFixed(1)}</p>
                    <p className="text-xs text-gray-500">{trainerStats?.totalReviews || 0} reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900">{trainerStats?.upcomingAppointments || 0}</p>
                    <p className="text-xs text-gray-500">appointments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trainer Points Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Gift className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Points Balance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {trainerPointsStats?.currentBalance || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      {trainerPointsStats?.totalEarned || 0} total earned
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trainer Invitation Stats - Additional Row */}
          {trainerPointsStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <UserPlus className="h-8 w-8 text-emerald-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Invitations Sent</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {trainerPointsStats.acceptedInvitations + trainerPointsStats.pendingInvitations}
                      </p>
                      <p className="text-xs text-gray-500">
                        {trainerPointsStats.acceptedInvitations} accepted
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUpIcon className="h-8 w-8 text-teal-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {trainerPointsStats.successRate}%
                      </p>
                      <p className="text-xs text-gray-500">invitation acceptance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Trophy className="h-8 w-8 text-amber-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Achievements</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {trainerPointsStats.achievements.length}
                      </p>
                      <p className="text-xs text-gray-500">
                        {trainerPointsStats.achievements.reduce((sum, a) => sum + a.pointsAwarded, 0)} points
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Trainer Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-brand-primary" />
                  Athlete Management
                </CardTitle>
                <CardDescription>
                  Manage your athletes and track their progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/trainer/clients">
                  <Button className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    View Athletes
                  </Button>
                </Link>
                {(trainerStats?.newClientsThisMonth || 0) > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    +{trainerStats?.newClientsThisMonth} new this month
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-brand-primary" />
                  Schedule & Appointments
                </CardTitle>
                <CardDescription>
                  Manage your calendar and upcoming sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/trainer/schedule">
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </Button>
                </Link>
                {(trainerStats?.upcomingAppointments || 0) > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    {trainerStats?.upcomingAppointments} upcoming appointments
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-brand-primary" />
                  Progress Reports
                </CardTitle>
                <CardDescription>
                  Create and manage athlete progress reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/trainer/reports">
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </Link>
                {(trainerStats?.pendingReports || 0) > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    {trainerStats?.pendingReports} pending reports
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Invitation Management Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2 text-brand-primary" />
                  Invitation System
                </CardTitle>
                <CardDescription>
                  Grow your network and earn points through invitations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/users">
                  <Button className="w-full mb-3">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invitations
                  </Button>
                </Link>
                {trainerPointsStats && (
                  <div className="space-y-1">
                    <p className="text-sm text-green-600">
                      {trainerPointsStats.acceptedInvitations} invitations accepted
                    </p>
                    <p className="text-sm text-blue-600">
                      {trainerPointsStats.pendingInvitations} pending invitations
                    </p>
                    <p className="text-sm text-purple-600">
                      {trainerPointsStats.currentBalance} points earned
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rewards Catalog for Trainers */}
          {trainerPointsStats && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Gift className="h-6 w-6 mr-2 text-emerald-600" />
                Rewards Catalog
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {trainerPointsStats.availableRewards?.slice(0, 6).map((reward) => (
                  <Card key={reward.id} className={`hover:shadow-lg transition-shadow ${
                    trainerPointsStats.currentBalance >= reward.pointsCost ? 'border-emerald-200' : 'border-gray-200 opacity-75'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-2xl">{reward.icon}</span>
                        <Badge variant={trainerPointsStats.currentBalance >= reward.pointsCost ? "default" : "secondary"}>
                          {reward.pointsCost} pts
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{reward.title}</h4>
                      <p className="text-xs text-gray-600 mb-3">{reward.description}</p>
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={trainerPointsStats.currentBalance < reward.pointsCost}
                        variant={trainerPointsStats.currentBalance >= reward.pointsCost ? "default" : "outline"}
                      >
                        {trainerPointsStats.currentBalance >= reward.pointsCost ? "Redeem" : "Not enough points"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Redemption History */}
              {trainerPointsStats.redemptionHistory && trainerPointsStats.redemptionHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-amber-600" />
                      Redemption History
                    </CardTitle>
                    <CardDescription>
                      Your recent reward redemptions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trainerPointsStats.redemptionHistory.slice(0, 5).map((redemption) => (
                        <div key={redemption.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                          <div>
                            <p className="font-medium text-sm">{redemption.rewardTitle}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(redemption.redeemedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">
                              -{redemption.pointsCost} pts
                            </span>
                            <Badge
                              variant={
                                redemption.status === 'FULFILLED' ? 'default' :
                                redemption.status === 'PROCESSING' ? 'secondary' :
                                redemption.status === 'PENDING' ? 'outline' : 'destructive'
                              }
                              className="text-xs"
                            >
                              {redemption.status.toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Dumbbell className="h-5 w-5 mr-2 text-brand-primary" />
              Workout Log
            </CardTitle>
            <CardDescription>
              Track your workouts and see your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/workout-log">
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Workout
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-brand-primary" />
              Exercise Database
            </CardTitle>
            <CardDescription>
              Browse our comprehensive exercise library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/exercises">
              <Button variant="outline" className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Browse Exercises
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-brand-primary" />
              Progress Tracking
            </CardTitle>
            <CardDescription>
              View your fitness progress and statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Total Volume</div>
              <div className="text-2xl font-bold text-brand-primary">
                {stats?.totalVolume ? `${stats.totalVolume} kg` : '0 kg'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest workouts{userRole === 'TRAINER' ? ', achievements, and points activity' : ' and achievements'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mr-2"></div>
              Loading recent workouts...
            </div>
          ) : recentWorkouts.length > 0 || (userRole === 'TRAINER' && trainerPointsStats?.recentTransactions.length) ? (
            <div className="space-y-4">
              {/* Recent Workouts */}
              {recentWorkouts.slice(0, 3).map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Dumbbell className="h-8 w-8 text-brand-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{workout.exercise}</h4>
                        <Badge variant="outline" className="text-xs">
                          {workout.category}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {workout.sets} sets × {workout.reps} reps @ {workout.weight}
                      </div>
                      {workout.userComments && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          "{workout.userComments}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {new Date(workout.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}

              {/* Trainer Points Transactions */}
              {userRole === 'TRAINER' && trainerPointsStats?.recentTransactions && trainerPointsStats.recentTransactions.length > 0 && (
                <>
                  {trainerPointsStats.recentTransactions.slice(0, 2).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Gift className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                            <Badge variant="outline" className="text-xs bg-indigo-100 text-indigo-800">
                              {transaction.pointType.replace('_', ' ').toLowerCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Points {transaction.points > 0 ? 'earned' : 'spent'}: {Math.abs(transaction.points)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div className="text-center pt-4">
                <Link href="/workout-log">
                  <Button variant="outline">
                    View All Workouts
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts yet</h3>
              <p className="text-gray-600 mb-6">
                Start logging your workouts to see your progress here
              </p>
              <Link href="/workout-log">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Your First Workout
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Dashboard for Trainers */}
      {userRole === 'TRAINER' && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign size={20} />
              Business Dashboard
            </CardTitle>
            <CardDescription>
              Manage your training business, revenue, and athlete payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BusinessDashboard />
          </CardContent>
        </Card>
      )}

      {/* Professional Features for Trainers */}
      {userRole === 'TRAINER' && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Professional Suite
            </CardTitle>
            <CardDescription>
              Advanced professional tools: partnerships, challenges, mentoring, and networking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfessionalInterface />
          </CardContent>
        </Card>
      )}

      {/* My Athletes Section for Verified Trainers */}
      {userRole === 'TRAINER' && session?.user?.trainerVerified && (
        <div className="mt-8">
          <MyAthletesDashboardSection />
        </div>
      )}

      {/* Team Management Section for Trainers and Admins */}
      {(userRole === 'TRAINER' || userRole === 'ADMIN') && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />

            </CardTitle>
            <CardDescription>

            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamManagement className="max-w-none" />
          </CardContent>
        </Card>
      )}

      {/* Team Discovery for Clients */}
      {userRole === 'CLIENT' && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Discover Teams
            </CardTitle>
            <CardDescription>
              Find and join fitness teams that match your goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamInterface mode="discovery" className="max-w-none" />
          </CardContent>
        </Card>
      )}

      {/* Massichat - AI Workout Coach */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Massichat
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">Powered by AI</Badge>
              </CardTitle>
              <CardDescription>
                Chat with your AI coach for personalized workouts and tips
              </CardDescription>
            </div>
            <Button
              onClick={fetchAISuggestions}
              disabled={aiLoading}
              variant="outline"
              size="sm"
            >
              {aiLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                  Thinking...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Ask Massichat
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MassichatInterface
            {...(initialMassichatSession ? { initialSessionId: initialMassichatSession } as const : {})}
            {...(generatedFlag ? { flashMessage: 'Generated workout from assessment' } as const : {})}
          />
          {aiSuggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-6 bg-gradient-to-br from-purple-50 to-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{suggestion.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.difficulty}
                    </Badge>
                  </div>

                  <p className="text-gray-600 mb-4">{suggestion.description}</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Duration: {suggestion.duration}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Exercises:</h4>
                      <div className="space-y-1">
                        {suggestion.exercises.slice(0, 3).map((exercise, exerciseIndex) => (
                          <div key={exerciseIndex} className="text-sm text-gray-600 pl-4">
                            • {exercise.name}: {exercise.sets} sets × {exercise.reps}
                          </div>
                        ))}
                        {suggestion.exercises.length > 3 && (
                          <div className="text-sm text-gray-500 pl-4">
                            +{suggestion.exercises.length - 3} more exercises
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Tips:</h4>
                    <ul className="space-y-1">
                      {suggestion.tips.slice(0, 2).map((tip, tipIndex) => (
                        <li key={tipIndex} className="text-sm text-gray-600 flex items-start">
                          <span className="text-purple-600 mr-2">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Get AI-Powered Workout Suggestions</h3>
              <p className="text-gray-600 mb-6">
                Click "Get Suggestions" to receive personalized workout recommendations based on your fitness goals and preferences.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Make sure you've set up your fitness preferences in your profile for the best recommendations.
              </p>
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
