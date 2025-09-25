import { NextResponse } from 'next/server'
import { getAccreditedRepository } from '@/services/repository/accredited'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const country = (searchParams.get('country') || '').trim()
  const qualification = (searchParams.get('qualification') || '').trim()
  const activeParam = searchParams.get('active')
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10) || 10, 1), 100)

  const repo = getAccreditedRepository()
  const params: any = { page, pageSize }
  if (q) params.search = q
  if (country) params.country = country
  if (qualification) params.qualification = qualification
  if (activeParam === 'true') params.isActive = true
  else if (activeParam === 'false') params.isActive = false

  const { items, total } = await repo.list(params)

  return NextResponse.json({
    items: items.map(p => ({ id: p.id, name: p.name, country: p.country, qualifications: p.qualifications })),
    total,
    page,
    pageSize,
  })
}
