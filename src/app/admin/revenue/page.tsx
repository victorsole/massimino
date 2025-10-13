import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/core/database'

export default async function AdminRevenuePage() {
  // Get comprehensive revenue analytics
  const [
    // Payment Analytics
    totalPayments,
    recentPayments,
    paymentsByMethod,

    // Subscription Analytics
    subscriptionRevenue,
    activeSubscriptions,

    // Trainer Economics
    trainerEarnings,
    topEarningTrainers,
    packageSales,

    // Revenue Breakdown
    monthlyRevenue,
    platformFees,
    refundsAndChargebacks
  ] = await Promise.all([
    // Payment Analytics
    prisma.payments.aggregate({
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true }
    }),

    prisma.payments.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    }),

    prisma.payments.groupBy({
      by: ['method'],
      _sum: { amount: true },
      _count: true
    }),

    // Subscription Analytics
    prisma.subscriptions.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { price: true },
      _count: true
    }),

    prisma.subscriptions.count({
      where: { status: 'ACTIVE' }
    }),

    // Trainer Economics
    prisma.trainer_earnings.aggregate({
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true }
    }),

    prisma.trainer_earnings.groupBy({
      by: ['trainerId'],
      _sum: { amount: true },
      _count: true,
      orderBy: {
        _sum: { amount: 'desc' }
      },
      take: 10
    }).then(async (results: Array<{ trainerId: string; _sum: { amount: number | null }; _count: number }>) => {
      return Promise.all(results.map(async (result: { trainerId: string; _sum: { amount: number | null }; _count: number }) => {
        const trainer = await prisma.users.findUnique({
          where: { id: result.trainerId },
          select: { name: true, email: true, trainerVerified: true }
        })
        return {
          ...result,
          trainer
        }
      }))
    }),

    prisma.package_purchases.aggregate({
      _sum: { pricePaid: true },
      _count: true
    }),

    // Monthly revenue (last 12 months)
    Promise.all([...Array(12)].map((_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      return prisma.payments.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          status: 'COMPLETED'
        },
        _sum: { amount: true },
        _count: true
      })
    })),

    // Platform revenue calculation from actual data
    Promise.all([
      prisma.payments.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.trainer_earnings.aggregate({
        _sum: { amount: true }
      })
    ]).then(([totalPayments, trainerEarnings]: [{ _sum: { amount: number | null } }, { _sum: { amount: number | null } }]) => {
      const totalRevenue = totalPayments._sum.amount || 0
      const actualTrainerEarnings = trainerEarnings._sum.amount || 0
      const platformRevenue = totalRevenue - actualTrainerEarnings
      return {
        totalRevenue,
        trainerCommission: actualTrainerEarnings,
        platformRevenue: platformRevenue > 0 ? platformRevenue : 0
      }
    }),

    // Refunds and chargebacks
    prisma.payments.aggregate({
      where: { status: 'REFUNDED' },
      _sum: { amount: true },
      _count: true
    })
  ])

  // Calculate key metrics
  const averagePayment = totalPayments._avg.amount || 0
  const monthlyRecurringRevenue = subscriptionRevenue._sum.price || 0
  const totalTrainerEarnings = trainerEarnings._sum.amount || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-brand-primary">Revenue Management</h1>
        <p className="text-gray-600 mt-2">Financial overview and business intelligence</p>
      </div>

      {/* Revenue Overview KPIs */}
      <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
        <h2 className="text-xl font-semibold text-brand-primary mb-4">💰 Revenue Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-green-200">
            <CardHeader className="pb-2 bg-green-50">
              <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-green-700">€{(totalPayments._sum.amount || 0).toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">{totalPayments._count.toLocaleString()} transactions</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-2 bg-blue-50">
              <CardTitle className="text-sm font-medium text-blue-700">Monthly Recurring Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-blue-700">€{monthlyRecurringRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">{activeSubscriptions.toLocaleString()} active subscriptions</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-2 bg-purple-50">
              <CardTitle className="text-sm font-medium text-purple-700">Trainer Earnings</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-purple-700">€{totalTrainerEarnings.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">{trainerEarnings._count.toLocaleString()} payouts</p>
            </CardContent>
          </Card>

          <Card className="border-brand-primary/20">
            <CardHeader className="pb-2 bg-brand-secondary/30">
              <CardTitle className="text-sm font-medium text-brand-primary">Platform Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-brand-primary">€{platformFees.platformRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">Net platform revenue</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Streams */}
        <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
          <h2 className="text-xl font-semibold text-brand-primary mb-4">📊 Revenue Streams</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white rounded border border-brand-primary/10">
              <div>
                <p className="font-medium text-brand-primary">Subscription Revenue</p>
                <p className="text-xs text-gray-600">Monthly recurring</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">€{(subscriptionRevenue._sum.price || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">{subscriptionRevenue._count} active</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-white rounded border border-brand-primary/10">
              <div>
                <p className="font-medium text-brand-primary">Package Sales</p>
                <p className="text-xs text-gray-600">One-time purchases</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-purple-600">€{(packageSales._sum.pricePaid || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">{packageSales._count.toLocaleString()} packages</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-white rounded border border-brand-primary/10">
              <div>
                <p className="font-medium text-brand-primary">Platform Fees</p>
                <p className="text-xs text-gray-600">Processing & commission</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-primary">€{platformFees.platformRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Platform revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
          <h2 className="text-xl font-semibold text-brand-primary mb-4">💳 Payment Methods</h2>
          <div className="space-y-3">
            {(
              paymentsByMethod as Array<{ method: string | null; _sum: { amount: number | null }; _count: number }>
            ).map((method, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white rounded border border-brand-primary/10">
                <div>
                  <p className="font-medium text-brand-primary">{method.method || 'Unknown'}</p>
                  <p className="text-xs text-gray-600">{method._count.toLocaleString()} transactions</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">€{(method._sum?.amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">
                    {totalPayments._sum.amount ?
                      Math.round(((method._sum?.amount || 0) / totalPayments._sum.amount) * 100) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Trend */}
      <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
        <h2 className="text-xl font-semibold text-brand-primary mb-4">📈 Monthly Revenue Trend (12 Months)</h2>
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {(monthlyRevenue as Array<{ _sum: { amount: number | null }; _count: number }>).reverse().map((month, index: number) => {
              const date = new Date()
              date.setMonth(date.getMonth() - (11 - index))
              return (
                <div key={index} className="text-center min-w-[100px]">
                  <div className="bg-white rounded-lg border border-brand-primary/10 p-4">
                    <p className="text-xs text-gray-600 mb-2">
                      {date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                    </p>
                    <p className="font-bold text-brand-primary">€{(month._sum.amount || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{month._count.toLocaleString()} transactions</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Earning Trainers */}
      <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
        <h2 className="text-xl font-semibold text-brand-primary mb-4">🏆 Top Earning Trainers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-brand-secondary/30 text-brand-primary">
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Trainer</th>
                <th className="px-4 py-3 text-left">Total Earnings</th>
                <th className="px-4 py-3 text-left">Transactions</th>
                <th className="px-4 py-3 text-left">Average</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {(topEarningTrainers as Array<{ trainerId: string; _sum: { amount: number | null }; _count: number; trainer?: { name: string | null; email: string; trainerVerified: boolean | null } }>).map((trainer, index: number) => (
                <tr key={trainer.trainerId} className="border-t border-gray-100">
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
                        {trainer.trainer?.name || 'Unknown'}
                        {trainer.trainer?.trainerVerified && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs">{trainer.trainer?.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-green-600">
                      €{(trainer._sum.amount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{trainer._count}</td>
                  <td className="px-4 py-3 text-gray-600">
                    €{trainer._count > 0 ? Math.round((trainer._sum.amount || 0) / trainer._count).toLocaleString() : '0'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={trainer.trainer?.trainerVerified ? 'bg-green-600' : 'bg-gray-600'}>
                      {trainer.trainer?.trainerVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-brand-secondary/20 p-6 rounded-lg border border-brand-primary/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-brand-primary">💸 Recent Transactions</h2>
          <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white">
            View All Transactions
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-brand-secondary/30 text-brand-primary">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {(recentPayments as Array<{ id: string; createdAt: Date; clientId: string; amount: number; method: string | null; status: string; type: string | null }>).map((payment) => (
                <tr key={payment.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">Payment User</div>
                      <div className="text-gray-500 text-xs">ID: {payment.clientId || 'Unknown'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-green-600">
                    €{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {payment.method || 'Unknown'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={
                      payment.status === 'COMPLETED' ? 'bg-green-600' :
                      payment.status === 'PENDING' ? 'bg-yellow-600' :
                      payment.status === 'FAILED' ? 'bg-red-600' : 'bg-gray-600'
                    }>
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {payment.type || 'Payment'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Health Indicators */}
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <h2 className="text-xl font-semibold text-red-700 mb-4">⚠️ Financial Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded border border-red-200">
            <div className="text-2xl font-bold text-red-600">€{(refundsAndChargebacks._sum.amount || 0).toLocaleString()}</div>
            <p className="text-sm text-gray-600">Total Refunds</p>
            <p className="text-xs text-red-600">{refundsAndChargebacks._count} transactions</p>
          </div>
          <div className="text-center p-4 bg-white rounded border border-red-200">
            <div className="text-2xl font-bold text-orange-600">
              {totalPayments._sum.amount ?
                Math.round(((refundsAndChargebacks._sum.amount || 0) / totalPayments._sum.amount) * 100 * 100) / 100 : 0}%
            </div>
            <p className="text-sm text-gray-600">Refund Rate</p>
            <p className="text-xs text-gray-500">Industry avg: 2-5%</p>
          </div>
          <div className="text-center p-4 bg-white rounded border border-red-200">
            <div className="text-2xl font-bold text-green-600">
              €{averagePayment.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">Average Transaction</p>
            <p className="text-xs text-gray-500">Per transaction</p>
          </div>
        </div>
      </div>
    </div>
  )
}
