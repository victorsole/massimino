import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/core/database'

export default async function AdminAnalyticsPage() {
  // Get comprehensive analytics data from all major models
  const [
    // User Analytics
    userStats,
    trainerStats,
    userGrowth,
    activeUsers,

    // Content Analytics
    workoutStats,
    communityStats,
    challengeStats,

    // Business Analytics
    revenueStats,
    subscriptionStats,

    // Engagement Analytics
    messageStats,
    sessionStats,

    // Health & Safety Analytics
    moderationStats,
    safetyStats
  ] = await Promise.all([
    // User Analytics
    Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { status: 'ACTIVE' } }),
      prisma.users.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.users.count({ where: { role: 'CLIENT' } }),
    ]),

    // Trainer Analytics
    Promise.all([
      prisma.users.count({ where: { role: 'TRAINER' } }),
      prisma.users.count({ where: { role: 'TRAINER', trainerVerified: true } }),
      prisma.trainer_profiles.count(),
      prisma.trainer_clients.count(),
    ]),

    // User Growth (last 6 months)
    Promise.all([...Array(6)].map((_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      return prisma.users.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      })
    })),

    // Active Users (different time periods)
    Promise.all([
      prisma.users.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.users.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.users.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    ]),

    // Content Analytics
    Promise.all([
      prisma.workout_log_entries.count(),
      prisma.exercises.count(),
      prisma.workout_templates.count(),
      prisma.program_templates.count(),
    ]),

    // Community Analytics
    Promise.all([
      prisma.communities.count({ where: { isActive: true } }),
      prisma.posts.count(),
      prisma.comments.count(),
      prisma.teams.count({ where: { isActive: true } }),
    ]),

    // Challenge Analytics
    Promise.all([
      prisma.challenges.count(),
      prisma.challenges.count({ where: { status: 'ACTIVE' } }),
      prisma.challenge_participants.count(),
      prisma.challenge_posts.count(),
    ]),

    // Business Analytics
    Promise.all([
      prisma.payments.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.trainer_earnings.aggregate({ _sum: { amount: true } }),
      prisma.subscriptions.count(),
      prisma.trainer_packages.count(),
    ]),

    // Subscription Analytics
    Promise.all([
      prisma.subscriptions.count({ where: { status: 'ACTIVE' } }),
      prisma.premium_memberships.count(),
      prisma.trainer_subscriptions.count(),
      prisma.program_subscriptions.count(),
    ]),

    // Message Analytics
    Promise.all([
      prisma.chat_messages.count(),
      prisma.chat_rooms.count({ where: { isActive: true } }),
      prisma.team_messages.count(),
      prisma.network_messages.count(),
    ]),

    // Session Analytics
    Promise.all([
      prisma.live_workout_sessions.count(),
      prisma.workout_sessions.count(),
      prisma.appointments.count(),
      prisma.mentor_sessions.count(),
    ]),

    // Moderation Analytics
    Promise.all([
      prisma.moderation_logs.count(),
      prisma.moderation_logs.count({ where: { action: 'FLAGGED' } }),
      prisma.moderation_logs.count({ where: { reviewedAt: null } }),
      prisma.user_violations.count({ where: { resolved: false } }),
    ]),

    // Safety Analytics
    Promise.all([
      prisma.safety_reports.count(),
      prisma.safety_reports.count({ where: { status: 'PENDING' } }),
      prisma.user_violations.count(),
      prisma.safety_settings.count(),
    ]),
  ])

  // Calculate growth rates and percentages
  const [totalUsers, , newUsersThisMonth, clientCount] = userStats
  const [totalTrainers, verifiedTrainers, , trainerClients] = trainerStats
  const [dailyActive, weeklyActive, monthlyActive] = activeUsers
  const [totalWorkouts, totalExercises, totalTemplates, totalPrograms] = workoutStats
  const [totalCommunities, totalPosts, totalComments, totalTeams] = communityStats
  const [, activeChallenges, challengeParticipants] = challengeStats
  const [paymentData, earningsData, totalSubscriptions, totalPackages] = revenueStats
  const [activeSubscriptions, premiumMemberships, trainerSubscriptions] = subscriptionStats
  const [totalMessages] = messageStats
  const [totalLiveSessions] = sessionStats
  const [, flaggedContent, pendingReviews, unresolvedViolations] = moderationStats
  const [, pendingSafetyReports] = safetyStats

  const verificationRate = totalTrainers > 0 ? Math.round((verifiedTrainers / totalTrainers) * 100) : 0
  const engagementRate = totalUsers > 0 ? Math.round((weeklyActive / totalUsers) * 100) : 0
  const conversionRate = totalUsers > 0 ? Math.round((totalSubscriptions / totalUsers) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-brand-primary">Platform Analytics</h1>
        <p className="text-gray-600 mt-2">Comprehensive insights across all platform modules</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
        <h2 className="text-xl font-semibold text-brand-primary mb-4">🎯 Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-brand-primary/20">
            <CardHeader className="pb-2 bg-brand-secondary/30">
              <CardTitle className="text-sm font-medium text-brand-primary">Total Platform Users</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-brand-primary">{totalUsers.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">{newUsersThisMonth} new this month</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-2 bg-emerald-50">
              <CardTitle className="text-sm font-medium text-emerald-700">Active Engagement</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-emerald-700">{engagementRate}%</div>
              <p className="text-xs text-gray-600 mt-1">{weeklyActive.toLocaleString()} weekly active</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-2 bg-blue-50">
              <CardTitle className="text-sm font-medium text-blue-700">Revenue Conversion</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-blue-700">{conversionRate}%</div>
              <p className="text-xs text-gray-600 mt-1">{totalSubscriptions.toLocaleString()} subscriptions</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-2 bg-purple-50">
              <CardTitle className="text-sm font-medium text-purple-700">Trainer Quality</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-purple-700">{verificationRate}%</div>
              <p className="text-xs text-gray-600 mt-1">{verifiedTrainers.toLocaleString()} verified trainers</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Analytics Section */}
      <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
        <h2 className="text-xl font-semibold text-brand-primary mb-4">👥 User Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Distribution */}
          <Card className="border-brand-primary/20">
            <CardHeader>
              <CardTitle className="text-brand-primary">User Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Users</span>
                <Badge className="bg-brand-primary">{totalUsers.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Clients</span>
                <Badge variant="outline">{clientCount.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Trainers</span>
                <Badge variant="outline">{totalTrainers.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Verified Trainers</span>
                <Badge className="bg-emerald-600">{verifiedTrainers.toLocaleString()}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Activity Metrics */}
          <Card className="border-brand-primary/20">
            <CardHeader>
              <CardTitle className="text-brand-primary">Activity Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Daily Active</span>
                <Badge className="bg-green-600">{dailyActive.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Weekly Active</span>
                <Badge className="bg-blue-600">{weeklyActive.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Active</span>
                <Badge className="bg-purple-600">{monthlyActive.toLocaleString()}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Growth Trend */}
          <Card className="border-brand-primary/20">
            <CardHeader>
              <CardTitle className="text-brand-primary">Growth Trend (6M)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userGrowth.reverse().map((count, index) => {
                  const date = new Date()
                  date.setMonth(date.getMonth() - (5 - index))
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        {date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                      </span>
                      <span className="text-sm font-medium">{count.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content & Engagement Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fitness Content */}
        <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
          <h2 className="text-xl font-semibold text-brand-primary mb-4">🏋️ Fitness Content</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded border border-brand-primary/10">
                <div className="text-2xl font-bold text-brand-primary">{totalWorkouts.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Workout Logs</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-brand-primary/10">
                <div className="text-2xl font-bold text-brand-primary">{totalExercises.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Exercises</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-brand-primary/10">
                <div className="text-2xl font-bold text-brand-primary">{totalTemplates.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Templates</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-brand-primary/10">
                <div className="text-2xl font-bold text-brand-primary">{totalPrograms.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Programs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Community Engagement */}
        <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
          <h2 className="text-xl font-semibold text-brand-primary mb-4">💬 Community Engagement</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded border border-brand-primary/10">
                <div className="text-2xl font-bold text-blue-600">{totalCommunities.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Communities</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-brand-primary/10">
                <div className="text-2xl font-bold text-blue-600">{totalPosts.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Posts</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-brand-primary/10">
                <div className="text-2xl font-bold text-blue-600">{totalComments.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Comments</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-brand-primary/10">
                <div className="text-2xl font-bold text-purple-600">{totalTeams.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Teams</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Intelligence */}
      <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
        <h2 className="text-xl font-semibold text-brand-primary mb-4">💰 Business Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-green-200">
            <CardHeader className="pb-2 bg-green-50">
              <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-700">€{(paymentData._sum.amount || 0).toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">{paymentData._count.toLocaleString()} transactions</p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-2 bg-green-50">
              <CardTitle className="text-sm font-medium text-green-700">Trainer Earnings</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-700">€{(earningsData._sum.amount || 0).toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">{trainerClients.toLocaleString()} trainer-client relationships</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-2 bg-blue-50">
              <CardTitle className="text-sm font-medium text-blue-700">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-700">{activeSubscriptions.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">{premiumMemberships.toLocaleString()} premium memberships</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-2 bg-purple-50">
              <CardTitle className="text-sm font-medium text-purple-700">Service Packages</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-700">{totalPackages.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">{trainerSubscriptions.toLocaleString()} trainer subscriptions</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Platform Health & Safety */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Health */}
        <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
          <h2 className="text-xl font-semibold text-brand-primary mb-4">📊 Platform Health</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded border border-brand-primary/10">
                <div className="text-2xl font-bold text-teal-600">{totalMessages.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Total Messages</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-brand-primary/10">
                <div className="text-2xl font-bold text-teal-600">{totalLiveSessions.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Live Sessions</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-brand-primary/10">
                <div className="text-2xl font-bold text-indigo-600">{activeChallenges.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Active Challenges</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-brand-primary/10">
                <div className="text-2xl font-bold text-indigo-600">{challengeParticipants.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Challenge Participants</p>
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Moderation */}
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 className="text-xl font-semibold text-red-700 mb-4">🛡️ Safety & Moderation</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded border border-red-200">
                <div className="text-2xl font-bold text-red-600">{pendingSafetyReports.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Pending Reports</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-red-200">
                <div className="text-2xl font-bold text-red-600">{unresolvedViolations.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Unresolved Violations</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-red-200">
                <div className="text-2xl font-bold text-orange-600">{flaggedContent.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Flagged Content</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-red-200">
                <div className="text-2xl font-bold text-orange-600">{pendingReviews.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Pending Reviews</p>
              </div>
            </div>
            {(pendingSafetyReports + unresolvedViolations + pendingReviews) > 0 && (
              <div className="mt-4 p-3 bg-red-100 rounded-md">
                <p className="text-sm text-red-800 font-medium">⚠️ Action Required</p>
                <p className="text-xs text-red-700">
                  {pendingSafetyReports + unresolvedViolations + pendingReviews} items need immediate attention
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Massitree Analytics Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">🔗 Massitree Bio Link Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Bio Link Visits */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2 bg-blue-50">
              <CardTitle className="text-sm font-medium text-blue-700">Bio Link Visits</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-700">0</div>
              <p className="text-xs text-gray-600 mt-1">Total visits (coming soon)</p>
            </CardContent>
          </Card>

          {/* Trainer Profiles Ready */}
          <Card className="border-green-200">
            <CardHeader className="pb-2 bg-green-50">
              <CardTitle className="text-sm font-medium text-green-700">Profiles Ready</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-700">{verifiedTrainers}</div>
              <p className="text-xs text-gray-600 mt-1">Verified trainers with bio links</p>
            </CardContent>
          </Card>

          {/* Top Traffic Sources */}
          <Card className="border-purple-200">
            <CardHeader className="pb-2 bg-purple-50">
              <CardTitle className="text-sm font-medium text-purple-700">Top Sources</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Linktree</span>
                  <span className="font-semibold">0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Instagram</span>
                  <span className="font-semibold">0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Direct</span>
                  <span className="font-semibold">0%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Analytics coming soon</p>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="border-orange-200">
            <CardHeader className="pb-2 bg-orange-50">
              <CardTitle className="text-sm font-medium text-orange-700">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-700">0%</div>
              <p className="text-xs text-gray-600 mt-1">Bio link to signup conversion</p>
            </CardContent>
          </Card>
        </div>

        {/* Massitree URL Examples */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-700 mb-3">Active Bio Links</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Victor Solé</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-blue-50 px-2 py-1 rounded">massimino.fitness/trainer/victorsole</code>
                <Badge className="bg-green-100 text-green-800 text-xs">NASM Verified</Badge>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              📊 Add more verified trainers to see additional bio links here
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors">
            🔗 View All Bio Links
          </Badge>
          <Badge className="bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200 transition-colors">
            📈 Setup Analytics Tracking
          </Badge>
          <Badge className="bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 transition-colors">
            🎯 Generate QR Codes
          </Badge>
        </div>
      </div>
    </div>
  )
}