// src/app/admin/layout.tsx

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import Link from 'next/link'

export const metadata = {
  title: 'Admin • Massimino',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-[70vh] grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 py-8">
      <aside className="px-10 lg:px-10">
        <div className="sticky top-6 space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Admin</h2>
          <nav className="flex lg:flex-col gap-3 text-sm">
            <Link href="/admin" className="text-gray-700 hover:text-gray-900">Overview</Link>
            <Link href="/admin/users" className="text-gray-700 hover:text-gray-900">Users</Link>
            <Link href="/admin/exercises" className="text-gray-700 hover:text-gray-900">Exercises</Link>
            <Link href="/admin/accredited" className="text-gray-700 hover:text-gray-900">Accredited Training</Link>
            <Link href="/admin/credentials" className="text-gray-700 hover:text-gray-900">Trainer Credentials</Link>
            <Link href="/admin/moderation" className="text-gray-700 hover:text-gray-900">Moderation</Link>
          </nav>
        </div>
      </aside>
      <main className="px-4 lg:px-6">{children}</main>
    </div>
  )
}
