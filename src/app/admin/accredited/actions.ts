// src/app/admin/accredited/actions.ts
"use server"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { revalidatePath } from 'next/cache'
import { getAccreditedRepository } from '@/services/repository/accredited'
import { publishAccreditedProvider } from '@/core/integrations/firebase'

function extractText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
}

export async function importFromTbodyHtmlAction(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  const tbodyHtml = (formData.get('tbodyHtml') as string | null) || ''
  if (!tbodyHtml || tbodyHtml.trim().length === 0) throw new Error('No HTML provided')

  const repo = getAccreditedRepository()

  // Parse <tr> blocks and extract 4 <td> columns
  const trs = tbodyHtml.match(/<tr[\s\S]*?<\/tr>/gi) || []
  let imported = 0, failed = 0
  for (const tr of trs) {
    try {
      const tds = tr.match(/<td[\s\S]*?<\/td>/gi) || []
      if (tds.length < 4) { failed++; continue }
      const name = extractText(tds[0] || '')
      const country = extractText(tds[1] || '')
      const qualificationsText = extractText(tds[2] || '')
      const qualifications = qualificationsText ? qualificationsText.split(',').map(s => s.trim()).filter(Boolean) : []
      const linkMatch = tds[3]?.match(/href=["']([^"']+)["']/i)
      const profilePath: string | null = linkMatch?.[1] || null
      const profileUrl: string | null = profilePath ? `https://www.ereps.eu${profilePath}` : null

      const up = await repo.upsertByNameCountry({ name, country, qualifications, profilePath, profileUrl, source: 'EREPS', isActive: true })
      try {
        await publishAccreditedProvider({
          id: up.id,
          name: up.name,
          country: up.country,
          qualifications: up.qualifications,
          profileUrl: up.profileUrl ?? null,
          profilePath: up.profilePath ?? null,
          slug: up.slug ?? null,
          source: up.source,
          isActive: up.isActive
        })
      } catch {}
      // Simple heuristic: upsert returns updatedAt change; cannot easily differentiate here
      imported++
    } catch (e) {
      failed++
    }
  }
  revalidatePath('/admin/accredited')
}

export async function updateProviderAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Missing id')
  const data: any = {}
  ;['name','country','profileUrl','profilePath'].forEach((k) => { const v = formData.get(k); if (v != null) data[k] = String(v) })
  const qualifications = (formData.get('qualifications') as string | null)
  if (qualifications != null) data.qualifications = qualifications.split(',').map(s=>s.trim()).filter(Boolean)
  const isActiveRaw = formData.get('isActive')
  if (isActiveRaw != null) data.isActive = isActiveRaw === 'on' || isActiveRaw === 'true'

  const repo = getAccreditedRepository()
  const updated = await repo.update(id, data)
  try { await publishAccreditedProvider(updated) } catch {}
  revalidatePath('/admin/accredited')
}

export async function createProviderAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  const name = String(formData.get('name') || '')
  const country = String(formData.get('country') || '')
  const qualifications = (formData.get('qualifications') as string | null)
  const profileUrl = (formData.get('profileUrl') as string | null) || null
  const profilePath = (formData.get('profilePath') as string | null) || null
  if (!name || !country) throw new Error('Name and country required')
  const repo = getAccreditedRepository()
  const created = await repo.create({ name, country, qualifications: (qualifications||'').split(',').map(s=>s.trim()).filter(Boolean), profileUrl, profilePath })
  try { await publishAccreditedProvider(created) } catch {}
  revalidatePath('/admin/accredited')
}
