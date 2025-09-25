import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/core/database'

export default async function AdminHomePage() {
  // Get dashboard statistics
  const [
    totalUsers,
    totalTrainers,
    pendingCredentials,
    recentSubmissions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { trainerVerified: true } }),
    prisma.user.count({
      where: {
        trainerCredentials: { not: null },
        trainerVerified: false
      }
    }),
    prisma.user.findMany({
      where: {
        trainerCredentials: { not: null },
        trainerVerified: false
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true
      }
    })
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your platform</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified Trainers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalTrainers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCredentials}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalUsers > 0 ? Math.round((totalTrainers / totalUsers) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Credentials Alert */}
      {pendingCredentials > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                  <span className="font-medium">{user.name || 'No Name'}</span>
                  <span className="text-sm text-gray-600 ml-2">{user.email}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            <Button asChild className="w-full mt-3">
              <a href="/admin/credentials">Review All Credentials</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Users</Badge>
            </CardTitle>
            <CardDescription>Manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <a href="/admin/users">Manage Users</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Credentials</Badge>
            </CardTitle>
            <CardDescription>Review trainer certifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <a href="/admin/credentials">Review Credentials</a>
              </Button>
              {pendingCredentials > 0 && (
                <Badge className="w-full justify-center bg-orange-100 text-orange-800">
                  {pendingCredentials} Pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Exercises</Badge>
            </CardTitle>
            <CardDescription>Manage exercise database</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <a href="/admin/exercises">Manage Exercises</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Accredited</Badge>
            </CardTitle>
            <CardDescription>Manage training providers</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <a href="/admin/accredited">Manage Providers</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Moderation</Badge>
            </CardTitle>
            <CardDescription>Review flagged content</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <a href="/admin/moderation">Review Content</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

