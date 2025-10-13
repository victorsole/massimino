import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/core/database'
import { getMigrationStatus, migrateTeamWorkoutsToUnified } from '@/services/teams/team_service'
import { revalidatePath } from 'next/cache'

async function runTeamWorkoutMigration() {
  'use server'
  await migrateTeamWorkoutsToUnified()
  revalidatePath('/admin')
}

export default async function AdminHomePage() {
  // Get comprehensive dashboard statistics
  const [
    // User & Auth Stats
    totalUsers,
    activeUsers,
    totalTrainers,
    pendingCredentials,
    recentSubmissions,

    // Community & Content Stats
    totalCommunities,
    totalPosts,
    totalComments,
    totalTeams,
    activeChallenges,

    // Workout & Fitness Stats
    totalWorkouts,
    totalExercises,
    totalTemplates,
    totalPrograms,
    totalLiveSessions,

    // Business & Revenue Stats
    totalPayments,
    totalSubscriptions,
    totalPackages,
    totalEarnings,

    // Safety & Moderation Stats
    pendingReports,
    totalViolations,
    unreviewedModeration,
    flaggedContent,

    // Migration Stats
    migrationStatus
  ] = await Promise.all([
    // User & Auth Stats
    prisma.users.count(),
    prisma.users.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    prisma.users.count({ where: { trainerVerified: true } }),
    prisma.users.count({ where: { trainerCredentials: { not: null }, trainerVerified: false } }),
    prisma.users.findMany({
      where: { trainerCredentials: { not: null }, trainerVerified: false },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, updatedAt: true }
    }),

    // Community & Content Stats
    prisma.communities.count({ where: { isActive: true } }),
    prisma.posts.count(),
    prisma.comments.count(),
    prisma.teams.count({ where: { isActive: true } }),
    prisma.challenges.count({ where: { status: 'ACTIVE' } }),

    // Workout & Fitness Stats
    prisma.workout_log_entries.count(),
    prisma.exercises.count(),
    prisma.workout_templates.count(),
    prisma.program_templates.count(),
    prisma.live_workout_sessions.count(),

    // Business & Revenue Stats
    prisma.payments.count(),
    prisma.subscriptions.count(),
    prisma.trainer_packages.count(),
    prisma.trainer_earnings.aggregate({ _sum: { amount: true } }),

    // Safety & Moderation Stats
    prisma.safety_reports.count({ where: { status: 'PENDING' } }),
    prisma.user_violations.count({ where: { resolved: false } }),
    prisma.moderation_logs.count({ where: { reviewedAt: null } }),
    prisma.moderation_logs.count({ where: { action: 'FLAGGED' } }),

    // Migration Stats
    getMigrationStatus()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your platform</p>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-brand-primary/20">
          <CardHeader className="pb-2 bg-brand-secondary/30">
            <CardTitle className="text-sm font-medium text-brand-primary">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-brand-primary">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">{activeUsers} active (30d)</p>
          </CardContent>
        </Card>
        <Card className="border-brand-primary/20">
          <CardHeader className="pb-2 bg-brand-secondary/30">
            <CardTitle className="text-sm font-medium text-brand-primary">Verified Trainers</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">{totalTrainers.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">{totalUsers > 0 ? Math.round((totalTrainers / totalUsers) * 100) : 0}% of users</p>
          </CardContent>
        </Card>
        <Card className="border-brand-primary/20">
          <CardHeader className="pb-2 bg-brand-secondary/30">
            <CardTitle className="text-sm font-medium text-brand-primary">Platform Revenue</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">€{(totalEarnings._sum.amount || 0).toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">{totalPayments} transactions</p>
          </CardContent>
        </Card>
        <Card className="border-brand-primary/20">
          <CardHeader className="pb-2 bg-brand-secondary/30">
            <CardTitle className="text-sm font-medium text-brand-primary">Safety Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{pendingReports + totalViolations}</div>
            <p className="text-xs text-gray-600 mt-1">pending moderation</p>
          </CardContent>
        </Card>
      </div>

      {/* Core Metrics Dashboard */}
      <div className="space-y-6">
        {/* Community & Content Metrics */}
        <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
          <h3 className="text-lg font-semibold text-brand-primary mb-4">Community & Content</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-brand-primary">{totalCommunities.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Communities</p>
              </CardContent>
            </Card>
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-brand-primary">{totalPosts.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Posts</p>
              </CardContent>
            </Card>
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-brand-primary">{totalComments.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Comments</p>
              </CardContent>
            </Card>
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-brand-primary">{totalTeams.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Teams</p>
              </CardContent>
            </Card>
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-brand-primary">{activeChallenges.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Active Challenges</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fitness & Training Metrics */}
        <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
          <h3 className="text-lg font-semibold text-brand-primary mb-4">Fitness & Training</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-brand-primary">{totalWorkouts.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Workout Logs</p>
              </CardContent>
            </Card>
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-brand-primary">{totalExercises.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Exercises</p>
              </CardContent>
            </Card>
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-brand-primary">{totalTemplates.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Templates</p>
              </CardContent>
            </Card>
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-brand-primary">{totalPrograms.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Programs</p>
              </CardContent>
            </Card>
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-brand-primary">{totalLiveSessions.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Live Sessions</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Business Intelligence */}
        <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
          <h3 className="text-lg font-semibold text-brand-primary mb-4">Business Intelligence</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-green-600">{totalSubscriptions.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Subscriptions</p>
              </CardContent>
            </Card>
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-green-600">{totalPackages.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Trainer Packages</p>
              </CardContent>
            </Card>
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-green-600">{totalPayments.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Total Payments</p>
              </CardContent>
            </Card>
            <Card className="border-brand-primary/10">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-green-600">€{((totalEarnings._sum.amount || 0) / totalUsers).toFixed(2)}</div>
                <p className="text-xs text-gray-600">Revenue per User</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Critical Alerts Section */}
      <div className="space-y-4">
        {/* Pending Credentials Alert */}
        {pendingCredentials > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-primary">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {pendingCredentials} Credentials Awaiting Review
              </CardTitle>
              <CardDescription>
                Recent trainer credential submissions need your attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentSubmissions.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium text-brand-primary">{user.name || 'No Name'}</span>
                    <span className="text-sm text-gray-600 ml-2">{user.email}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              <Button asChild className="w-full mt-3 bg-brand-primary hover:bg-brand-primary/90">
                <a href="/admin/credentials">Review All Credentials</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Safety & Moderation Alerts */}
        {(pendingReports > 0 || totalViolations > 0 || unreviewedModeration > 0) && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-primary">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Safety & Moderation Alerts
              </CardTitle>
              <CardDescription>
                Platform safety issues require immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {pendingReports > 0 && (
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-lg font-bold text-red-600">{pendingReports}</div>
                    <p className="text-xs text-gray-600">Pending Reports</p>
                  </div>
                )}
                {totalViolations > 0 && (
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-lg font-bold text-red-600">{totalViolations}</div>
                    <p className="text-xs text-gray-600">Unresolved Violations</p>
                  </div>
                )}
                {unreviewedModeration > 0 && (
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-lg font-bold text-red-600">{unreviewedModeration}</div>
                    <p className="text-xs text-gray-600">Unreviewed Content</p>
                  </div>
                )}
                {flaggedContent > 0 && (
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-lg font-bold text-red-600">{flaggedContent}</div>
                    <p className="text-xs text-gray-600">Flagged Content</p>
                  </div>
                )}
              </div>
              <Button asChild className="w-full bg-red-600 hover:bg-red-700">
                <a href="/admin/moderation">Review Safety Issues</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comprehensive Management Sections */}
      <div className="space-y-8">
        {/* Core Platform Management */}
        <div>
          <h2 className="text-xl font-semibold text-brand-primary mb-4">Core Platform Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-brand-primary text-white">Users</Badge>
                </CardTitle>
                <CardDescription>Manage user accounts & profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white" asChild>
                  <a href="/admin/users">Manage Users</a>
                </Button>
                <p className="text-xs text-gray-500 mt-2">{totalUsers.toLocaleString()} total users</p>
              </CardContent>
            </Card>

            <Card className="border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-brand-primary text-white">Trainers</Badge>
                </CardTitle>
                <CardDescription>Review trainer credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white" asChild>
                  <a href="/admin/credentials">Review Credentials</a>
                </Button>
                {pendingCredentials > 0 && (
                  <Badge className="w-full justify-center bg-orange-100 text-orange-800 mt-2">
                    {pendingCredentials} Pending
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className="border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-brand-primary text-white">Content</Badge>
                </CardTitle>
                <CardDescription>Exercise database & templates</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white" asChild>
                  <a href="/admin/exercises">Manage Content</a>
                </Button>
                <p className="text-xs text-gray-500 mt-2">{totalExercises.toLocaleString()} exercises</p>
              </CardContent>
            </Card>

            <Card className="border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-red-600 text-white">Safety</Badge>
                </CardTitle>
                <CardDescription>Moderation & safety controls</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white" asChild>
                  <a href="/admin/moderation">Safety Center</a>
                </Button>
                {(pendingReports + totalViolations) > 0 && (
                  <Badge className="w-full justify-center bg-red-100 text-red-800 mt-2">
                    {pendingReports + totalViolations} Issues
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Data Migration */}
        <div>
          <h2 className="text-xl font-semibold text-brand-primary mb-4">Data Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-indigo-200 hover:border-indigo-400 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white">Migration</Badge>
                </CardTitle>
                <CardDescription>Team workout unified system migration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-indigo-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Old Team Workouts:</span>
                      <span className="font-semibold text-indigo-900">{migrationStatus.oldTeamWorkoutsCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Migrated Workouts:</span>
                      <span className="font-semibold text-green-700">{migrationStatus.migratedCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Entries Created:</span>
                      <span className="font-semibold text-indigo-900">{migrationStatus.totalEntriesCreated}</span>
                    </div>
                  </div>
                  <form action={runTeamWorkoutMigration}>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                    >
                      Run Migration
                    </Button>
                  </form>
                  <p className="text-xs text-gray-500 text-center">
                    Migrates team workouts to unified workout_log_entries system
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Business & Analytics */}
        <div>
          <h2 className="text-xl font-semibold text-brand-primary mb-4">Business Intelligence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-green-200 hover:border-green-400 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-green-600 text-white">Revenue</Badge>
                </CardTitle>
                <CardDescription>Financial dashboard & payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white" asChild>
                  <a href="/admin/revenue">Revenue Analytics</a>
                </Button>
                <p className="text-xs text-gray-500 mt-2">€{(totalEarnings._sum.amount || 0).toLocaleString()} total</p>
              </CardContent>
            </Card>

            <Card className="border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-brand-primary text-white">Analytics</Badge>
                </CardTitle>
                <CardDescription>Platform metrics & insights</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white" asChild>
                  <a href="/admin/analytics">View Analytics</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-brand-primary text-white">Providers</Badge>
                </CardTitle>
                <CardDescription>Accredited training providers</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white" asChild>
                  <a href="/admin/accredited">Manage Providers</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Community & Engagement */}
        <div>
          <h2 className="text-xl font-semibold text-brand-primary mb-4">Community & Engagement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-blue-200 hover:border-blue-400 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white">Communities</Badge>
                </CardTitle>
                <CardDescription>Manage fitness communities</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white" asChild>
                  <a href="/admin/communities">Manage Communities</a>
                </Button>
                <p className="text-xs text-gray-500 mt-2">{totalCommunities.toLocaleString()} active</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 hover:border-purple-400 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-purple-600 text-white">Teams</Badge>
                </CardTitle>
                <CardDescription>Team management & challenges</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white" asChild>
                  <a href="/admin/teams">Manage Teams</a>
                </Button>
                <p className="text-xs text-gray-500 mt-2">{totalTeams.toLocaleString()} teams</p>
              </CardContent>
            </Card>

            <Card className="border-indigo-200 hover:border-indigo-400 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white">Challenges</Badge>
                </CardTitle>
                <CardDescription>Fitness challenges & competitions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white" asChild>
                  <a href="/admin/challenges">Manage Challenges</a>
                </Button>
                <p className="text-xs text-gray-500 mt-2">{activeChallenges.toLocaleString()} active</p>
              </CardContent>
            </Card>

            <Card className="border-teal-200 hover:border-teal-400 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-teal-600 text-white">Live Sessions</Badge>
                </CardTitle>
                <CardDescription>Live workout sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white" asChild>
                  <a href="/admin/live-sessions">Manage Sessions</a>
                </Button>
                <p className="text-xs text-gray-500 mt-2">{totalLiveSessions.toLocaleString()} total</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

