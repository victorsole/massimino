import { prisma } from '@/core/database'

export const dynamic = 'force-dynamic'

export default async function AIConversationsPage() {
  const sessions = await prisma.ai_chat_sessions.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      ai_chat_messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">AI Conversations</h1>
        <p className="text-sm text-gray-600">Monitor recent Massichat sessions</p>
      </div>
      <div className="overflow-x-auto bg-white border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-secondary/30 text-brand-primary">
            <tr>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Last Message</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">{s.userId}</td>
                <td className="px-4 py-3">{s.title || '(untitled)'}</td>
                <td className="px-4 py-3">{s.status}</td>
                <td className="px-4 py-3">{s.ai_chat_messages?.[0]?.content?.slice(0, 120) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

