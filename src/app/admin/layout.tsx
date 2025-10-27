// src/app/admin/layout.tsx

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Admin • Massimino',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-[70vh] grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 py-8">
      <aside className="px-6 lg:px-8">
        <div className="sticky top-6 space-y-6">
          {/* Admin Header */}
          <div className="p-4 bg-brand-secondary/30 rounded-lg border border-brand-primary/20">
            <h2 className="text-lg font-bold text-brand-primary">Admin Dashboard</h2>
            <p className="text-xs text-gray-600 mt-1">Platform Management</p>
          </div>

          <nav className="space-y-6">
            {/* Core Platform */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-brand-primary uppercase tracking-wide mb-3">Core Platform</h3>
              <div className="space-y-1">
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors group"
                >
                  <span className="w-2 h-2 bg-brand-primary rounded-full group-hover:bg-brand-primary/80"></span>
                  Overview
                </Link>
                <Link
                  href="/admin/feedback"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Feedback
                </Link>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Users & Accounts
                </Link>
                <Link
                  href="/admin/credentials"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Trainer Credentials
                </Link>
                <Link
                  href="/admin/moderation"
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Safety & Moderation
                  </div>
                  <Badge className="bg-red-100 text-red-700 text-xs">Priority</Badge>
                </Link>
                <Link
                  href="/admin/moderation/media_queue"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  Media Queue
                </Link>
              </div>
            </div>

            {/* Content Management */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-brand-primary uppercase tracking-wide mb-3">Content & Training</h3>
              <div className="space-y-1">
                <Link
                  href="/admin/exercises"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Exercise Database
                </Link>
                <Link
                  href="/admin/templates"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Workout Templates
                </Link>
                {/* TODO: Create Training Programs page
                <Link
                  href="/admin/programs"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Training Programs
                </Link>
                */}
                <Link
                  href="/admin/accredited"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Accredited Providers
                </Link>
              </div>
            </div>

            {/* AI & Massichat */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-brand-primary uppercase tracking-wide mb-3">AI & Massichat</h3>
              <div className="space-y-1">
                <Link
                  href="/admin/knowledge-base"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  Knowledge Base
                </Link>
                <Link
                  href="/admin/ai-conversations"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  AI Conversations
                </Link>
              </div>
            </div>

            {/* Community & Engagement */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-brand-primary uppercase tracking-wide mb-3">Community</h3>
              <div className="space-y-1">
                <Link
                  href="/admin/teams"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  Teams
                </Link>
                {/* TODO: Create Challenges page
                <Link
                  href="/admin/challenges"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                  Challenges
                </Link>
                */}
              </div>
            </div>

            {/* Business Intelligence */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-brand-primary uppercase tracking-wide mb-3">Business</h3>
              <div className="space-y-1">
                <Link
                  href="/admin/analytics"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Platform Analytics
                </Link>
                <Link
                  href="/admin/revenue"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Revenue Management
                </Link>
                <Link
                  href="/admin/partnerships"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                  Partnerships
                </Link>
                {/* TODO: Create Subscriptions page
                <Link
                  href="/admin/subscriptions"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Subscriptions
                </Link>
                */}
              </div>
            </div>

            {/* Professional Network */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-brand-primary uppercase tracking-wide mb-3">Professional</h3>
              <div className="space-y-1">
                {/* TODO: Create Trainer Partnerships page
                <Link
                  href="/admin/partnerships"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                  Trainer Partnerships
                </Link>
                */}
                {/* TODO: Create Mentorship Programs page
                <Link
                  href="/admin/mentorship"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                  Mentorship Programs
                </Link>
                */}
                {/* TODO: Create Professional Network page
                <Link
                  href="/admin/networking"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-md transition-colors"
                >
                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                  Professional Network
                </Link>
                */}
              </div>
            </div>
          </nav>
        </div>
      </aside>
      <main className="px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
