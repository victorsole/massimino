import { prisma } from '@/core/database'
import { ensureDefaults, createPartner, updatePartner, deletePartner } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'

export default async function PartnersSection() {
  const rows = await prisma.partners.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => [] as any[])
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Partnerships</h1>
          <p className="text-gray-600">Manage featured partners shown publicly</p>
        </div>
        <form action={ensureDefaults}>
          <Button type="submit" variant="outline">Ensure Default Partners</Button>
        </form>
      </div>
      <Card className="border-brand-primary/20">
        <CardHeader>
          <CardTitle className="text-sm text-brand-primary">Add Partner</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPartner} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input name="name" placeholder="Name" required />
            <Input name="country" placeholder="Country" />
            <Input name="url" placeholder="https://example.com" required />
            <Input name="logoUrl" placeholder="/images/logo.png" />
            <Input name="tags" placeholder="tags (comma separated)" />
            <Textarea name="description" placeholder="Short description" className="md:col-span-3" />
            <div className="md:col-span-3">
              <Button type="submit" variant="outline">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rows.map((p) => (
          <Card key={p.id} className="border-brand-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                {p.logoUrl && (
                  <div className="relative w-20 h-12 rounded-lg overflow-hidden border">
                    <Image src={(p.logoUrl || '').replace(/^\/assets\/images\//, '/images/')} alt={`${p.name} logo`} fill sizes="80px" className="object-contain bg-white" />
                  </div>
                )}
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.country || '—'}</div>
                </div>
              </div>
              <form action={updatePartner} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="hidden" name="id" value={p.id} />
                <Input name="name" defaultValue={p.name} />
                <Input name="country" defaultValue={p.country || ''} />
                <Input name="url" defaultValue={p.url} />
                <Input name="logoUrl" defaultValue={p.logoUrl || ''} />
                <Input name="tags" defaultValue={(p.tags || []).join(', ')} />
                <Textarea name="description" defaultValue={p.description || ''} className="md:col-span-3" />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked={p.isActive} /> Active
                </label>
                <div className="flex items-center gap-2 md:col-span-3">
                  <Button type="submit" variant="outline">Save</Button>
                  <Button formAction={deletePartner} type="submit" variant="outline" className="text-red-600 border-red-300">Delete</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

