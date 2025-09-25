// src/app/admin/accredited/page.tsx

import { getAccreditedRepository } from '@/services/repository/accredited'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { importFromTbodyHtmlAction, updateProviderAction, createProviderAction } from './actions'

type PageProps = { searchParams?: { q?: string; page?: string; country?: string; qualification?: string; active?: string } }

export default async function AccreditedPage({ searchParams }: PageProps) {
  const q = searchParams?.q?.trim() || ''
  const page = Math.max(parseInt(searchParams?.page || '1', 10) || 1, 1)
  const pageSize = 20
  const isActive = searchParams?.active ? searchParams.active === 'true' : undefined
  const repo = getAccreditedRepository()
  const { items, total } = await repo.list({ search: q || undefined, page, pageSize, country: searchParams?.country || undefined, qualification: searchParams?.qualification || undefined, isActive })
  const hasPrev = page > 1
  const hasNext = page * pageSize < total

  const countries = Array.from(new Set(items.map(i => i.country))).sort()
  const quals = Array.from(new Set(items.flatMap(i => i.qualifications))).sort()

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Accredited Training Providers</h1>
          <p className="text-gray-600">Total: {total}</p>
        </div>
        <form className="flex items-center gap-2 flex-wrap" action="/admin/accredited" method="get">
          <Input name="q" placeholder="Search name" defaultValue={q} className="w-64" />
          <select name="country" defaultValue={searchParams?.country || ''} className="border rounded px-2 py-2">
            <option value="">All countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="qualification" defaultValue={searchParams?.qualification || ''} className="border rounded px-2 py-2">
            <option value="">All qualifications</option>
            {quals.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <select name="active" defaultValue={isActive === undefined ? '' : String(isActive)} className="border rounded px-2 py-2">
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">Create Provider</h2>
        <form action={createProviderAction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input name="name" placeholder="Name" required />
          <Input name="country" placeholder="Country" required />
          <Input name="qualifications" placeholder="Qualifications (comma-separated)" />
          <Input name="profileUrl" placeholder="Profile URL (optional)" />
          <Input name="profilePath" placeholder="Profile Path (optional)" />
          <div className="col-span-full">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">Import from EREPS &lt;tbody&gt; HTML</h2>
        <form action={importFromTbodyHtmlAction} className="space-y-3">
          <div className="text-sm text-gray-600">Paste the &lt;tbody&gt; HTML from the EREPS provider directory page here to import rows.</div>
          <textarea name="tbodyHtml" className="w-full min-h-[180px] border rounded px-2 py-2" placeholder="&lt;tbody&gt;...&lt;/tbody&gt;"></textarea>
          <Button type="submit">Import</Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Country</th>
              <th className="px-3 py-2 text-left">Qualifications</th>
              <th className="px-3 py-2 text-left">Profile</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id} className="border-t align-top">
                <td className="px-3 py-2 font-medium">{p.name}</td>
                <td className="px-3 py-2">{p.country}</td>
                <td className="px-3 py-2 max-w-[28rem] truncate" title={p.qualifications.join(', ')}>{p.qualifications.join(', ')}</td>
                <td className="px-3 py-2">
                  {p.profileUrl ? <a href={p.profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">full profile</a> : (p.profilePath || '-')}
                </td>
                <td className="px-3 py-2">{p.isActive ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">
                  <form action={updateProviderAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <Input name="name" defaultValue={p.name} className="w-56" />
                    <Input name="country" defaultValue={p.country} className="w-40" />
                    <Input name="qualifications" defaultValue={p.qualifications.join(', ')} className="w-80" />
                    <Input name="profileUrl" defaultValue={p.profileUrl ?? ''} className="w-80" />
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="isActive" defaultChecked={p.isActive} /> Active</label>
                    <Button type="submit" size="sm">Save</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {page} · Showing {items.length} of {total}</div>
        <div className="flex gap-2">
          <a className={`btn-outline ${!hasPrev ? 'pointer-events-none opacity-50' : ''}`} href={`/admin/accredited?${new URLSearchParams({ q, page: String(page - 1) })}`}>Prev</a>
          <a className={`btn-outline ${!hasNext ? 'pointer-events-none opacity-50' : ''}`} href={`/admin/accredited?${new URLSearchParams({ q, page: String(page + 1) })}`}>Next</a>
        </div>
      </div>
    </div>
  )
}

