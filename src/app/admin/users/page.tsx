// src/app/admin/users/page.tsx

import { getUserRepository } from '@/services/repository'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateUserAction, syncUserFromFirestoreAction, createUserAction } from './actions'

type PageProps = { searchParams?: { q?: string; page?: string } }

const ROLES = ['CLIENT', 'TRAINER', 'ADMIN'] as const
const STATUSES = ['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING'] as const

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const q = searchParams?.q?.trim() || ''
  const page = Math.max(parseInt(searchParams?.page || '1', 10) || 1, 1)
  const pageSize = 20

  const repo = getUserRepository()
  const params: Parameters<typeof repo.listUsers>[0] = { page, pageSize, orderBy: { field: 'createdAt', direction: 'desc' } }
  if (q) params.search = q
  const { items: users, total } = await repo.listUsers(params)
  const hasPrev = page > 1
  const hasNext = page * pageSize < total

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-gray-600">Total: {total}</p>
        </div>

        <form className="flex gap-2" action="/admin/users" method="get">
          <Input name="q" placeholder="Search email or name" defaultValue={q} className="w-64" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">Create New User</h2>
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
          <Button type="submit">Create</Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Reputation</th>
              <th className="px-4 py-2 text-left">Warnings</th>
              <th className="px-4 py-2 text-left">Trainer</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t align-top">
                <td className="px-4 py-2 font-mono">{u.email}</td>
                <td className="px-4 py-2">{u.name ?? '-'}</td>
                <td className="px-4 py-2">
                  <Badge variant="secondary" className="uppercase">{u.role}</Badge>
                </td>
                <td className="px-4 py-2">
                  <Badge className={u.status === 'ACTIVE' ? 'bg-green-600' : u.status === 'SUSPENDED' ? 'bg-yellow-600' : 'bg-red-600'}>
                    {u.status}
                  </Badge>
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
                    <input type="number" name="reputationScore" defaultValue={u.reputationScore} min={0} max={100} className="w-20 border rounded px-2 py-1" />
                    <input type="number" name="warningCount" defaultValue={u.warningCount} min={0} className="w-16 border rounded px-2 py-1" />
                    <Button type="submit" size="sm">Save</Button>
                  </form>

                  <form action={syncUserFromFirestoreAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="email" value={u.email} />
                    <Button type="submit" size="sm" variant="outline">Sync from Firestore</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
