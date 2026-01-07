import { prisma } from '@/core/database';
import { approveApplication, rejectApplication } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

type Application = {
  id: string;
  name: string;
  email: string;
  discipline: string;
  achievements: string;
  instagram: string | null;
  website: string | null;
  message: string | null;
  status: string;
  appliedAt: Date;
  reviewedAt: Date | null;
  adminNotes: string | null;
  users: { name: string | null; email: string } | null;
};

export default async function AthleteApplicationsPage() {
  let applications: Application[] = [];
  let stats = { pending: 0, approved: 0, rejected: 0, total: 0 };

  try {
    applications = await prisma.athlete_applications.findMany({
      orderBy: { appliedAt: 'desc' },
      include: {
        users: {
          select: { name: true, email: true },
        },
      },
    });

    stats = {
      pending: applications.filter((a) => a.status === 'PENDING').length,
      approved: applications.filter((a) => a.status === 'APPROVED').length,
      rejected: applications.filter((a) => a.status === 'REJECTED').length,
      total: applications.length,
    };
  } catch {
    return (
      <div className="p-6">
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-700">Athlete Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              Table not available. Run database migrations: <code>npx prisma db push</code>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDisciplineLabel = (discipline: string) => {
    const labels: Record<string, string> = {
      bodybuilding: 'Bodybuilding',
      powerlifting: 'Powerlifting',
      crossfit: 'CrossFit',
      weightlifting: 'Olympic Weightlifting',
      strongman: 'Strongman',
      hyrox: 'Hyrox',
      coaching: 'Professional Coaching',
      other: 'Other',
    };
    return labels[discipline] || discipline;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Athlete Applications</h1>
        <p className="text-gray-600">Review applications from athletes who want to be featured on Massimino</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Applications</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending Review</div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8">No applications yet.</div>
            )}
            {applications.map((app) => (
              <div
                key={app.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{app.name}</span>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {app.email} | {getDisciplineLabel(app.discipline)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Applied: {new Date(app.appliedAt).toLocaleString()}
                      {app.reviewedAt && (
                        <> | Reviewed: {new Date(app.reviewedAt).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                  {app.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <form action={approveApplication}>
                        <input type="hidden" name="id" value={app.id} />
                        <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                          Approve
                        </Button>
                      </form>
                      <form action={rejectApplication}>
                        <input type="hidden" name="id" value={app.id} />
                        <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                          Reject
                        </Button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex gap-4 text-sm">
                  {app.instagram && (
                    <a
                      href={`https://instagram.com/${app.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Instagram: {app.instagram}
                    </a>
                  )}
                  {app.website && (
                    <a
                      href={app.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Website
                    </a>
                  )}
                </div>

                {/* Achievements */}
                <div>
                  <div className="text-sm font-medium text-gray-700">Achievements:</div>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded p-2 mt-1">
                    {app.achievements}
                  </div>
                </div>

                {/* Training Philosophy */}
                {app.message && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Training Philosophy:</div>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded p-2 mt-1">
                      {app.message}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {app.adminNotes && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Admin Notes:</div>
                    <div className="text-sm text-gray-600 bg-blue-50 rounded p-2 mt-1">
                      {app.adminNotes}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
