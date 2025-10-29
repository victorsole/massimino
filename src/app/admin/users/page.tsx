// src/app/admin/users/page.tsx

import { getUserRepository } from '@/services/repository'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateUserAction, syncUserFromFirestoreAction, createUserAction, updateRedemptionStatusAction, adjustUserPointsAction, bulkAwardPointsAction, quickPointsAwardAction, createInvitationAction, updateInvitationAction } from './actions'
import { Textarea } from '@/components/ui/textarea'
import { prisma } from '@/core/database'

type PageProps = { searchParams?: { q?: string; page?: string } }

const ROLES = ['CLIENT', 'TRAINER', 'ADMIN'] as const
const STATUSES = ['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING'] as const

// Redemption Management Component
async function RedemptionManagement() {
  // Get pending redemptions
  const pendingRedemptions = await prisma.points_redemptions.findMany({
    where: { status: 'PENDING' },
    include: {
      users: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: { redeemedAt: 'desc' },
    take: 20
  })

  // Get recent redemptions for context
  const recentRedemptions = await prisma.points_redemptions.findMany({
    where: {
      status: { in: ['APPROVED', 'FULFILLED', 'REJECTED'] }
    },
    include: {
      users: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: { redeemedAt: 'desc' },
    take: 10
  })

  return (
    <div className="space-y-6">
      {/* Pending Redemptions */}
      <div className="rounded-md border border-orange-200 bg-orange-50 p-4">
        <h2 className="text-lg font-semibold mb-3 text-orange-800">
          Pending Redemptions ({pendingRedemptions.length})
        </h2>
        {pendingRedemptions.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-orange-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-orange-50 text-orange-700">
                <tr>
                  <th className="px-4 py-2 text-left">Trainer</th>
                  <th className="px-4 py-2 text-left">Reward</th>
                  <th className="px-4 py-2 text-left">Points Cost</th>
                  <th className="px-4 py-2 text-left">Requested</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRedemptions.map((redemption: any) => (
                  <tr key={redemption.id} className="border-t">
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium">{redemption.users.name}</div>
                        <div className="text-gray-500 text-xs">{redemption.users.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium">{redemption.rewardTitle}</div>
                        <div className="text-gray-600 text-xs">{redemption.description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2 font-mono">{redemption.pointsCost}</td>
                    <td className="px-4 py-2">{new Date(redemption.redeemedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <form action={updateRedemptionStatusAction}>
                          <input type="hidden" name="redemptionId" value={redemption.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <Button type="submit" size="sm" variant="outline">
                            Process
                          </Button>
                        </form>
                        <form action={updateRedemptionStatusAction}>
                          <input type="hidden" name="redemptionId" value={redemption.id} />
                          <input type="hidden" name="status" value="FULFILLED" />
                          <Button type="submit" size="sm">
                            Fulfill
                          </Button>
                        </form>
                        <form action={updateRedemptionStatusAction}>
                          <input type="hidden" name="redemptionId" value={redemption.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <Button type="submit" size="sm" variant="destructive">
                            Reject
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-orange-700">No pending redemptions.</p>
        )}
      </div>

      {/* Recent Redemptions */}
      <div className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">Recent Redemptions</h2>
        {recentRedemptions.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left">Trainer</th>
                  <th className="px-4 py-2 text-left">Reward</th>
                  <th className="px-4 py-2 text-left">Points</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Requested</th>
                  <th className="px-4 py-2 text-left">Fulfilled</th>
                </tr>
              </thead>
              <tbody>
                {recentRedemptions.map((redemption: any) => (
                  <tr key={redemption.id} className="border-t">
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium">{redemption.users.name}</div>
                        <div className="text-gray-500 text-xs">{redemption.users.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{redemption.rewardTitle}</div>
                    </td>
                    <td className="px-4 py-2 font-mono">{redemption.pointsCost}</td>
                    <td className="px-4 py-2">
                      <Badge
                        className={
                          redemption.status === 'FULFILLED' ? 'bg-green-600' :
                          redemption.status === 'APPROVED' ? 'bg-blue-600' :
                          redemption.status === 'REJECTED' ? 'bg-red-600' : 'bg-gray-600'
                        }
                      >
                        {redemption.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">{new Date(redemption.redeemedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      {redemption.fulfilledAt ? new Date(redemption.fulfilledAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No recent redemptions.</p>
        )}
      </div>
    </div>
  )
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const q = searchParams?.q?.trim() || ''
  const page = Math.max(parseInt(searchParams?.page || '1', 10) || 1, 1)
  const pageSize = 20

  const repo = getUserRepository()
  const params: Parameters<typeof repo.listUsers>[0] = { page, pageSize, orderBy: { field: 'createdAt', direction: 'desc' } }
  if (q) params.search = q
  const { items: users, total } = await repo.listUsers(params)

  // Invitations overview
  let pendingInvites: any[] = []
  let recentInvites: any[] = []
  try {
    pendingInvites = await prisma.invitations.findMany({
      where: { status: 'PENDING' },
      include: {
        users_invitations_senderIdTousers: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  } catch {}
  try {
    recentInvites = await prisma.invitations.findMany({
      where: { status: { in: ['ACCEPTED', 'REVOKED', 'EXPIRED'] } as any },
      include: {
        users_invitations_senderIdTousers: { select: { name: true, email: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    })
  } catch {}

  // Get points data for each user (only for trainers)
  const usersWithPoints = await Promise.all(
    users.map(async (user) => {
      // My Library gamification points (all users)
      let myLibPointsAgg = { _sum: { points: null as number | null } }
      let awardsCount = 0
      try {
        myLibPointsAgg = await prisma.user_points.aggregate({ where: { userId: user.id }, _sum: { points: true } })
        awardsCount = await prisma.user_achievements.count({ where: { userId: user.id } })
      } catch (e) {
        // ignore
      }

      if (user.role !== 'TRAINER') {
        return { ...user, pointsBalance: 0, totalEarned: 0, totalRedeemed: 0, myLibPoints: myLibPointsAgg._sum.points || 0, awardsCount }
      }

      // Get points balance
      let pointsBalance = { _sum: { points: null as number | null } }
      let totalEarned = { _sum: { points: null as number | null } }
      let totalRedeemed = { _sum: { pointsCost: null as number | null } }

      try {
        pointsBalance = await prisma.trainer_points.aggregate({
          where: { trainerId: user.id },
          _sum: { points: true }
        })
      } catch (error) {
        console.error('Error fetching points balance for user:', user.id, error)
      }

      try {
        // Get total earned (positive points only)
        totalEarned = await prisma.trainer_points.aggregate({
          where: {
            trainerId: user.id,
            points: { gt: 0 }
          },
          _sum: { points: true }
        })
      } catch (error) {
        console.error('Error fetching total earned for user:', user.id, error)
      }

      try {
        // Get total redeemed
        totalRedeemed = await prisma.points_redemptions.aggregate({
          where: {
            trainerId: user.id,
            status: { in: ['FULFILLED', 'APPROVED'] }
          },
          _sum: { pointsCost: true }
        })
      } catch (error) {
        console.error('Error fetching total redeemed for user:', user.id, error)
      }

      return {
        ...user,
        pointsBalance: pointsBalance._sum.points || 0,
        totalEarned: totalEarned._sum.points || 0,
        totalRedeemed: totalRedeemed._sum.pointsCost ?? 0,
        myLibPoints: myLibPointsAgg._sum.points || 0,
        awardsCount
      }
    })
  )
  const hasPrev = page > 1
  const hasNext = page * pageSize < total

  // Points Overview Statistics
  let totalPointsDistributed = 0
  let totalTransactions = 0

  try {
    const pointsStats = await prisma.trainer_points.aggregate({
      _sum: { points: true },
      _count: true
    })
    totalPointsDistributed = pointsStats._sum.points || 0
    totalTransactions = pointsStats._count
  } catch (error) {
    console.error('Error fetching points stats:', error)
    // Continue with default values
  }

  const activeTrainers = await prisma.users.count({
    where: {
      role: 'TRAINER',
      status: 'ACTIVE'
    }
  })

  let totalRedemptions = { _sum: { pointsCost: null as number | null }, _count: 0 }
  let pendingRedemptionsCount = 0

  try {
    totalRedemptions = await prisma.points_redemptions.aggregate({
      _sum: { pointsCost: true },
      _count: true
    })
  } catch (error) {
    console.error('Error fetching redemption stats:', error)
  }

  try {
    pendingRedemptionsCount = await prisma.points_redemptions.count({
      where: { status: 'PENDING' }
    })
  } catch (error) {
    console.error('Error fetching pending redemptions:', error)
  }

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  let recentPointsActivity = { _sum: { points: null as number | null }, _count: 0 }

  try {
    recentPointsActivity = await prisma.trainer_points.aggregate({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      _sum: { points: true },
      _count: true
    })
  } catch (error) {
    console.error('Error fetching recent points activity:', error)
  }

  // Top performer this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  let topPerformer: any[] = []

  try {
    topPerformer = await (prisma.trainer_points.groupBy as any)({
      by: ['trainerId'],
      where: {
        createdAt: { gte: startOfMonth },
        points: { gt: 0 }
      },
      _sum: { points: true },
      orderBy: {
        _sum: { points: 'desc' }
      },
      take: 1
    })
  } catch (error) {
    console.error('Error fetching top performer:', error)
  }

  let topPerformerInfo: { name: string; email: string; points: number } | null = null
  if (topPerformer.length > 0) {
    const topTrainer = await prisma.users.findUnique({
      where: { id: topPerformer[0]!.trainerId },
      select: { name: true, email: true }
    })
    topPerformerInfo = {
      name: topTrainer?.name || 'Unknown',
      email: topTrainer?.email || '',
      points: topPerformer[0]!._sum.points || 0
    }
  }

  // Trainer Points Leaderboard (Top 10)
  let leaderboard: any[] = []

  try {
    leaderboard = await (prisma.trainer_points.groupBy as any)({
      by: ['trainerId'],
      where: {
        points: { gt: 0 }
      },
      _sum: { points: true },
      _count: true,
      orderBy: {
        _sum: { points: 'desc' }
      },
      take: 10
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
  }

  const leaderboardWithDetails = await Promise.all(
    leaderboard.map(async (entry: any) => {
      const trainer = await prisma.users.findUnique({
        where: { id: entry.trainerId },
        select: {
          name: true,
          email: true,
          trainerVerified: true,
          createdAt: true
        }
      })

      // Get recent achievements count
      let achievementsCount = 0
      try {
        achievementsCount = await prisma.trainer_achievements.count({
          where: { trainerId: entry.trainerId }
        })
      } catch (error) {
        console.error('Error fetching achievements count:', error)
      }

      // Get invitation success rate
      const sentInvitations = await prisma.invitations.count({
        where: { senderId: entry.trainerId }
      })

      const acceptedInvitations = await prisma.invitations.count({
        where: {
          senderId: entry.trainerId,
          status: 'ACCEPTED'
        }
      })

      const successRate = sentInvitations > 0 ? Math.round((acceptedInvitations / sentInvitations) * 100) : 0

      return {
        trainerId: entry.trainerId,
        name: trainer?.name || 'Unknown',
        email: trainer?.email || '',
        verified: trainer?.trainerVerified || false,
        totalPoints: entry._sum.points || 0,
        transactionCount: entry._count,
        achievementsCount,
        successRate,
        joinDate: trainer?.createdAt || new Date()
      }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Users & Points Administration</h1>
          <p className="text-gray-600">Total Users: <span className="font-semibold text-brand-primary">{total.toLocaleString()}</span> | Active Trainers: <span className="font-semibold text-brand-primary">{activeTrainers.toLocaleString()}</span></p>
        </div>

        <form className="flex gap-2" action="/admin/users" method="get">
          <Input name="q" placeholder="Search email or name" defaultValue={q} className="w-64 border-brand-primary/20 focus:border-brand-primary" />
          <Button type="submit" className="bg-brand-primary hover:bg-brand-primary/90 text-white">Search</Button>
        </form>
      </div>

      {/* Points Overview Statistics */}
      <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
        <h2 className="text-lg font-semibold text-brand-primary mb-4">Platform Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-brand-primary/20 bg-brand-secondary/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-primary">Total Points Distributed</p>
                <p className="text-2xl font-bold text-brand-primary">{totalPointsDistributed.toLocaleString()}</p>
                <p className="text-xs text-gray-600">{totalTransactions.toLocaleString()} transactions</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <span className="text-brand-primary text-lg">🎯</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Points Redeemed</p>
                <p className="text-2xl font-bold text-green-800">{(totalRedemptions._sum.pointsCost || 0).toLocaleString()}</p>
                <p className="text-xs text-green-600">{totalRedemptions._count.toLocaleString()} redemptions</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-lg">🎁</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Recent Activity (7d)</p>
                <p className="text-2xl font-bold text-orange-800">{(recentPointsActivity._sum.points || 0).toLocaleString()}</p>
                <p className="text-xs text-orange-600">{recentPointsActivity._count.toLocaleString()} new transactions</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 text-lg">📈</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Pending Actions</p>
                <p className="text-2xl font-bold text-red-800">{pendingRedemptionsCount.toLocaleString()}</p>
                <p className="text-xs text-red-600">redemptions awaiting approval</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-lg">⏳</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performer Highlight */}
      {topPerformerInfo && (
        <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-brand-secondary/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">🏆 Top Performer This Month</p>
              <p className="text-lg font-bold text-brand-primary">{topPerformerInfo.name}</p>
              <p className="text-xs text-gray-600">{topPerformerInfo.email} • <span className="font-semibold text-amber-700">{topPerformerInfo.points.toLocaleString()}</span> points earned</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-100 to-brand-secondary flex items-center justify-center">
              <span className="text-amber-600 text-2xl">🏆</span>
            </div>
          </div>
        </div>
      )}

      {/* Trainer Points Leaderboard - Collapsible Section */}
      <details className="rounded-lg border border-brand-primary/20 bg-white">
        <summary className="cursor-pointer p-4 hover:bg-brand-secondary/20 select-none">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-primary">🏅 Trainer Points Leaderboard</h2>
            <span className="text-sm text-gray-600">Top {leaderboardWithDetails.length} performers</span>
          </div>
        </summary>
        <div className="border-t border-brand-primary/20">
          {leaderboardWithDetails.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-brand-secondary/30 text-brand-primary">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Trainer</th>
                    <th className="px-4 py-3 text-left">Total Points</th>
                    <th className="px-4 py-3 text-left">Transactions</th>
                    <th className="px-4 py-3 text-left">Success Rate</th>
                    <th className="px-4 py-3 text-left">Achievements</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardWithDetails.map((trainer: any, index: number) => (
                    <tr key={trainer.trainerId} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">#{index + 1}</span>
                          {index === 0 && <span className="ml-1 text-amber-500">🏆</span>}
                          {index === 1 && <span className="ml-1 text-gray-400">🥈</span>}
                          {index === 2 && <span className="ml-1 text-amber-600">🥉</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {trainer.name}
                            {trainer.verified && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="text-gray-500 text-xs">{trainer.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-gray-900">
                          {trainer.totalPoints.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{trainer.transactionCount}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${
                          trainer.successRate >= 80 ? 'text-green-600' :
                          trainer.successRate >= 60 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {trainer.successRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">{trainer.achievementsCount}</span>
                          {trainer.achievementsCount > 0 && <span className="text-amber-500">🏅</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          Since {new Date(trainer.joinDate).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No trainers with points found.
            </div>
          )}
        </div>
      </details>

      {/* Inline Points Management Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bulk Points Operations */}
        <div className="rounded-md border border-brand-primary/20 bg-brand-secondary/20 p-4">
          <h2 className="text-lg font-semibold mb-3 text-brand-primary">💫 Bulk Points Management</h2>
          <div className="space-y-3">
            <form action={bulkAwardPointsAction} className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col">
                <label className="text-sm text-indigo-700">Points Amount</label>
                <Input type="number" name="pointsAmount" placeholder="100" required className="w-20" min="1" max="1000" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-indigo-700">Award To</label>
                <select name="targetGroup" className="border rounded px-2 py-2 bg-white" required>
                  <option value="ALL_TRAINERS">All Active Trainers</option>
                  <option value="VERIFIED_TRAINERS">Verified Trainers Only</option>
                  <option value="TOP_PERFORMERS">Top 10 Performers</option>
                </select>
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-sm text-indigo-700">Reason</label>
                <Input name="description" placeholder="Holiday bonus, system appreciation..." required className="min-w-48" />
              </div>
              <Button type="submit" className="bg-brand-primary hover:bg-brand-primary/90">Bulk Award</Button>
            </form>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-md border border-green-200 bg-green-50 p-4">
          <h2 className="text-lg font-semibold mb-3 text-green-800">⚡ Quick Points Actions</h2>
          <div className="space-y-3">
            <form action={quickPointsAwardAction} className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col">
                <label className="text-sm text-green-700">Trainer Email</label>
                <Input type="email" name="trainerEmail" placeholder="trainer@example.com" required className="w-48" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-green-700">Points</label>
                <Input type="number" name="pointsAmount" placeholder="±50" required className="w-20" min="-999" max="999" />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-sm text-green-700">Reason</label>
                <Input name="description" placeholder="Manual adjustment reason..." required />
              </div>
              <Button type="submit" variant="outline" className="border-green-600 text-green-700 hover:bg-green-100">
                Quick Adjust
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-brand-primary/30 bg-gradient-to-br from-brand-secondary/30 to-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-brand-primary flex items-center gap-2">✉️ Send Invitations</h2>
          <span className="text-xs text-gray-500">Pending: {pendingInvites.length}</span>
        </div>
        <form action={createInvitationAction} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">Emails (one per line)</label>
              <Textarea name="emails" placeholder={`user1@example.com\nuser2@example.com` } required rows={5} />
              <div className="text-xs text-gray-500 mt-1">Tip: use plus aliases to test (e.g. you+test1@gmail.com)</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select name="role" defaultValue={'CLIENT'} className="border rounded px-2 py-2 bg-white">
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Expires (days)</label>
                <Input type="number" name="expiresInDays" defaultValue={7} min={1} max={90} className="w-28" />
              </div>
              <div className="col-span-2 flex flex-col">
                <label className="text-sm font-medium text-gray-700">Message (optional)</label>
                <Textarea name="message" placeholder="Add a short note..." rows={3} />
                <div className="text-xs text-gray-500 mt-1">• Existing users will receive a sign-in prompt email. • Emails with an already pending invite are skipped.</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" className="bg-brand-primary hover:bg-brand-primary/90">Send Invitations</Button>
          </div>
        </form>
      </div>

      {/* Invitations Table */}
      <div className="rounded-md border border-brand-primary/20 bg-white">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-primary">Invitations</h2>
          <span className="text-xs text-gray-500">Showing {pendingInvites.length} pending · {recentInvites.length} recent</span>
        </div>
        <div className="border-t">
          {pendingInvites.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-brand-secondary/30 text-brand-primary">
                  <tr>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Invited By</th>
                    <th className="px-4 py-2 text-left">Created</th>
                    <th className="px-4 py-2 text-left">Expires</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map((inv: any) => (
                    <tr key={inv.id} className="border-t">
                      <td className="px-4 py-2">{inv.email}</td>
                      <td className="px-4 py-2">{inv.role}</td>
                      <td className="px-4 py-2">
                        <div className="text-gray-900">{inv.users_invitations_senderIdTousers?.name || '—'}</div>
                        <div className="text-xs text-gray-500">{inv.users_invitations_senderIdTousers?.email}</div>
                      </td>
                      <td className="px-4 py-2">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{new Date(inv.expiresAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">{inv.status}</Badge>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <form action={updateInvitationAction}>
                            <input type="hidden" name="id" value={inv.id} />
                            <input type="hidden" name="action" value="resend" />
                            <Button size="sm" variant="outline">Resend</Button>
                          </form>
                          <form action={updateInvitationAction}>
                            <input type="hidden" name="id" value={inv.id} />
                            <input type="hidden" name="action" value="extend" />
                            <Button size="sm" variant="outline">Extend</Button>
                          </form>
                          <form action={updateInvitationAction}>
                            <input type="hidden" name="id" value={inv.id} />
                            <input type="hidden" name="action" value="revoke" />
                            <Button size="sm" variant="destructive">Revoke</Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-sm text-gray-600">No pending invitations.</div>
          )}
        </div>

        {recentInvites.length > 0 && (
          <div className="border-t p-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Recent activity</h3>
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvites.map((inv: any) => (
                    <tr key={inv.id} className="border-t">
                      <td className="px-4 py-2">{inv.email}</td>
                      <td className="px-4 py-2">{inv.role}</td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className={
                          inv.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 border-green-200' :
                          inv.status === 'REVOKED' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">{new Date(inv.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-md border border-brand-primary/20 bg-brand-secondary/10 p-4">
        <h2 className="text-lg font-semibold mb-3 text-brand-primary">👤 Create New User</h2>
        <form action={createUserAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Email</label>
            <Input name="email" placeholder="email@example.com" required className="w-64" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Name</label>
            <Input name="name" placeholder="Full name" className="w-56" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Role</label>
            <select name="role" defaultValue={'CLIENT'} className="border rounded px-2 py-2">
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Status</label>
            <select name="status" defaultValue={'ACTIVE'} className="border rounded px-2 py-2">
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="trainerVerified" /> Trainer verified
          </label>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Reputation</label>
            <Input type="number" name="reputationScore" placeholder="100" className="w-24" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Warnings</label>
            <Input type="number" name="warningCount" placeholder="0" className="w-20" />
          </div>
          <Button type="submit" className="bg-brand-primary hover:bg-brand-primary/90">Create User</Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-md border border-brand-primary/20 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-secondary/30 text-brand-primary">
            <tr>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Display Name</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Massimino Username</th>
              <th className="px-4 py-2 text-left">MyLib Points</th>
              <th className="px-4 py-2 text-left">Awards</th>
              <th className="px-4 py-2 text-left">Points Balance</th>
              <th className="px-4 py-2 text-left">Total Earned</th>
              <th className="px-4 py-2 text-left">Reputation</th>
              <th className="px-4 py-2 text-left">Warnings</th>
              <th className="px-4 py-2 text-left">Trainer</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersWithPoints.map(u => {
              // Display name logic: nickname > name + surname > name > -
              let displayName = '-'
              if (u.nickname) {
                displayName = u.nickname
              } else if (u.name && u.surname) {
                displayName = `${u.name} ${u.surname}`
              } else if (u.name) {
                displayName = u.name
              }

              return (
              <tr key={u.id} className="border-t align-top">
                <td className="px-4 py-2 font-mono">{u.email}</td>
                <td className="px-4 py-2">{displayName}</td>
                <td className="px-4 py-2">
                  <Badge variant="secondary" className="uppercase">{u.role}</Badge>
                </td>
                <td className="px-4 py-2">
                  <Badge className={u.status === 'ACTIVE' ? 'bg-green-600' : u.status === 'SUSPENDED' ? 'bg-yellow-600' : 'bg-red-600'}>
                    {u.status}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  {u.massiminoUsername ? (
                    <a
                      href={`https://bio.massimino.fitness/${u.massiminoUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-purple-600 hover:text-purple-800 underline"
                    >
                      @{u.massiminoUsername}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-2 font-mono">{(u as any).myLibPoints?.toLocaleString?.() || '0'}</td>
                <td className="px-4 py-2">{(u as any).awardsCount || 0}</td>
                <td className="px-4 py-2">
                  {u.role === 'TRAINER' ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-blue-600">
                        {u.pointsBalance.toLocaleString()}
                      </span>
                      {u.pointsBalance > 0 && <span className="text-blue-500">🎯</span>}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {u.role === 'TRAINER' ? (
                    <span className="font-mono text-green-600">
                      {u.totalEarned.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-2">{u.reputationScore}</td>
                <td className="px-4 py-2">{u.warningCount}</td>
                <td className="px-4 py-2">{u.trainerVerified ? 'Verified' : '-'}</td>
                <td className="px-4 py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 space-y-2">
                  <form action={updateUserAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="role" defaultValue={u.role} className="border rounded px-2 py-1">
                      {ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <select name="status" defaultValue={u.status} className="border rounded px-2 py-1">
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox" name="trainerVerified" defaultChecked={u.trainerVerified} />
                      Trainer verified
                    </label>
                    <input
                      type="text"
                      name="massiminoUsername"
                      defaultValue={u.massiminoUsername || ''}
                      placeholder="public-username"
                      className="border rounded px-2 py-1 text-xs"
                    />
                    <input type="number" name="reputationScore" defaultValue={u.reputationScore} min={0} max={100} className="w-20 border rounded px-2 py-1" />
                    <input type="number" name="warningCount" defaultValue={u.warningCount} min={0} className="w-16 border rounded px-2 py-1" />
                    <Button type="submit" size="sm" className="bg-brand-primary hover:bg-brand-primary/90">Save</Button>
                  </form>

                  <form action={syncUserFromFirestoreAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="email" value={u.email} />
                    <Button type="submit" size="sm" variant="outline">Sync from Firestore</Button>
                  </form>

                  {/* Points Adjustment for Trainers */}
                  {u.role === 'TRAINER' && (
                    <form action={adjustUserPointsAction} className="flex items-center gap-2 border-t pt-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          name="pointsAmount"
                          placeholder="±Points"
                          className="w-20 border rounded px-2 py-1 text-xs"
                          min="-9999"
                          max="9999"
                          step="1"
                        />
                        <select name="reason" className="border rounded px-2 py-1 text-xs">
                          <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                          <option value="BONUS_ACHIEVEMENT">Bonus Award</option>
                          <option value="PENALTY">Penalty</option>
                          <option value="CORRECTION">Correction</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        name="description"
                        placeholder="Reason..."
                        className="flex-1 border rounded px-2 py-1 text-xs"
                        maxLength={100}
                      />
                      <Button type="submit" size="sm" variant="outline" className="text-xs">
                        Adjust
                      </Button>
                    </form>
                  )}

                  {/* Quick Links */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {u.massiminoUsername ? (
                      <a
                        href={`https://bio.massimino.fitness/${u.massiminoUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline text-purple-700"
                      >
                        View Public Profile
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No public username</span>
                    )}
                    <a href="/admin/revenue" className="text-xs underline text-brand-primary">Revenue</a>
                  </div>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Redemption Management Section */}
      <RedemptionManagement />

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {page} · Showing {users.length} of {total}
        </div>
        <div className="flex gap-2">
          <a className={`btn-outline ${!hasPrev ? 'pointer-events-none opacity-50' : ''}`} href={`/admin/users?${new URLSearchParams({ q, page: String(page - 1) })}`}>Prev</a>
          <a className={`btn-outline ${!hasNext ? 'pointer-events-none opacity-50' : ''}`} href={`/admin/users?${new URLSearchParams({ q, page: String(page + 1) })}`}>Next</a>
        </div>
      </div>
    </div>
  )
}
