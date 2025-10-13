// src/app/admin/credentials/page.tsx

import { prisma } from '@/core/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateUserVerificationAction } from './actions'

type PageProps = {
  searchParams?: {
    q?: string;
    page?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'all';
  }
}

export default async function CredentialsPage({ searchParams }: PageProps) {
  const q = searchParams?.q?.trim() || ''
  const page = Math.max(parseInt(searchParams?.page || '1', 10) || 1, 1)
  const pageSize = 20
  const status = searchParams?.status || 'pending'

  // Build where clause for filtering
  const where: any = {
    trainerCredentials: {
      not: null
    }
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } }
    ]
  }

  if (status !== 'all') {
    if (status === 'pending') {
      where.trainerVerified = false
    } else if (status === 'approved') {
      where.trainerVerified = true
    }
  }

  // Get users with credentials
  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        trainerVerified: true,
        trainerCredentials: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.users.count({ where })
  ])

  const hasPrev = page > 1
  const hasNext = page * pageSize < total

  // Process credentials data
  const usersWithCredentials = users.map(user => {
    let credentials: any[] = []
    try {
      if (user.trainerCredentials) {
        credentials = JSON.parse(user.trainerCredentials)
      }
    } catch {}

    const latestCredential = credentials.length > 0 ? credentials[credentials.length - 1] : null

    return {
      ...user,
      credentials,
      latestCredential
    }
  })

  const pendingCount = await prisma.users.count({
    where: { trainerCredentials: { not: null }, trainerVerified: false }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trainer Credentials</h1>
          <p className="text-gray-600">
            Total: {total} • Pending: {pendingCount}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <form className="flex items-center gap-2 flex-wrap" action="/admin/credentials" method="get">
        <Input
          name="q"
          placeholder="Search by name or email"
          defaultValue={q}
          className="w-64"
        />
        <select
          name="status"
          defaultValue={status}
          className="border rounded px-3 py-2"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      {/* Credentials List */}
      <div className="space-y-4">
        {usersWithCredentials.map((user) => (
          <Card key={user.id} className={`${
            user.trainerVerified
              ? 'border-green-200 bg-green-50'
              : 'border-orange-200 bg-orange-50'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {user.name || 'No Name'}
                    {user.trainerVerified ? (
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {user.email} • Submitted: {new Date(user.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!user.trainerVerified && (
                    <>
                      <form action={updateUserVerificationAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="trainerVerified" value="true" />
                        <Button size="sm" variant="default">
                          Approve
                        </Button>
                      </form>
                      <form action={updateUserVerificationAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="trainerVerified" value="false" />
                        <Button size="sm" variant="destructive">
                          Reject
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {user.latestCredential ? (
                <div className="space-y-4">
                  {/* Provider Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Training Provider</h4>
                      <p className="text-sm">
                        {user.latestCredential.providerName || 'Not specified'}
                      </p>
                      {user.latestCredential.country && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {user.latestCredential.country}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Qualifications</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.latestCredential.qualifications?.map((qual: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {qual}
                          </Badge>
                        )) || <span className="text-sm text-gray-500">None specified</span>}
                      </div>
                    </div>
                  </div>

                  {/* Credential File */}
                  {user.latestCredential.credentialPath && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Credential Document</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-20 border rounded bg-white shadow-sm flex items-center justify-center">
                          {user.latestCredential.credentialPath.toLowerCase().includes('.pdf') ? (
                            <div className="text-center">
                              <svg className="h-6 w-6 mx-auto text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <p className="text-xs text-gray-600">PDF</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <svg className="h-6 w-6 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-xs text-gray-600">Image</p>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={user.latestCredential.credentialPath} target="_blank" rel="noopener noreferrer">
                            View Document
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Verification Details */}
                  {user.latestCredential.verifiedAt && (
                    <div className="bg-white rounded p-3 border">
                      <h4 className="font-medium text-sm text-gray-700">Verification Details</h4>
                      <p className="text-sm text-gray-600">
                        Verified on: {new Date(user.latestCredential.verifiedAt).toLocaleDateString()}
                      </p>
                      {user.latestCredential.verificationNotes && (
                        <p className="text-sm text-gray-600">
                          Notes: {user.latestCredential.verificationNotes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No credential information available</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {(hasPrev || hasNext) && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} • Showing {usersWithCredentials.length} of {total}
          </div>
          <div className="flex gap-2">
            {hasPrev && (
              <Button variant="outline" asChild>
                <a href={`/admin/credentials?${new URLSearchParams({
                  ...searchParams,
                  page: String(page - 1)
                }).toString()}`}>
                  Previous
                </a>
              </Button>
            )}
            {hasNext && (
              <Button variant="outline" asChild>
                <a href={`/admin/credentials?${new URLSearchParams({
                  ...searchParams,
                  page: String(page + 1)
                }).toString()}`}>
                  Next
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
