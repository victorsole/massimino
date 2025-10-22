"use server";
import { prisma } from '@/core/database';
import { revalidatePath } from 'next/cache';
import PartnershipsService from '@/services/partnerships_service';

export async function ensureDefaults() {
  const db: any = prisma as any;
  if (!db?.partners?.upsert) return;
  const defaults = [
    { name: 'Amix', country: 'Spain', url: 'https://amix.com/', logoUrl: '/images/amix-logo.png', description: 'Quality sports supplements for performance and recovery.', tags: ['supplements'] },
    { name: 'Jims', country: 'Belgium', url: 'https://www.jims.be/nl', logoUrl: '/images/jims-logo.png', description: 'Accessible gym network with flexible memberships.', tags: ['gym'] },
    { name: 'Bo', country: 'Europe', url: 'http://app.hellobo.eu', logoUrl: '/images/Bo_logo.png', description: 'Bo links visitors to local producers across Europe and showcases geographical indications (GIs).', tags: ['social', 'local', 'marketplace'] },
  ];
  for (const p of defaults) {
    try {
      const existing = await db.partners.findFirst({ where: { name: p.name } });
      if (existing) {
        await db.partners.update({ where: { id: existing.id }, data: { ...p, isActive: true } });
      } else {
        await db.partners.create({ data: { ...p, isActive: true } });
      }
    } catch (e) {
      console.error('ensureDefaults error for', p.name, e);
    }
  }
  revalidatePath('/admin/partnerships');
}

export async function createPartner(formData: FormData) {
  const name = String(formData.get('name') || '');
  if (!name) return;
  const logoUrlRaw = String(formData.get('logoUrl') || '');
  await prisma.partners.create({
    data: {
      name,
      country: String(formData.get('country') || '') || null,
      url: String(formData.get('url') || ''),
      logoUrl: logoUrlRaw ? logoUrlRaw.replace(/^\/assets\/images\//, '/images/') : null,
      description: String(formData.get('description') || '') || null,
      tags: String(formData.get('tags') || '')?.split(',').map((s) => s.trim()).filter(Boolean) || [],
      isActive: true,
    },
  });
  revalidatePath('/admin/partnerships');
}

export async function updatePartner(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const logoUrlRaw = String(formData.get('logoUrl') || '');
  await prisma.partners.update({
    where: { id },
    data: {
      name: String(formData.get('name') || ''),
      country: String(formData.get('country') || '') || null,
      url: String(formData.get('url') || ''),
      logoUrl: logoUrlRaw ? logoUrlRaw.replace(/^\/assets\/images\//, '/images/') : null,
      description: String(formData.get('description') || '') || null,
      tags: String(formData.get('tags') || '')?.split(',').map((s) => s.trim()).filter(Boolean) || [],
      isActive: String(formData.get('isActive') || '') === 'on',
    },
  });
  revalidatePath('/admin/partnerships');
}

export async function deletePartner(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  await prisma.partners.delete({ where: { id } }).catch(() => null);
  revalidatePath('/admin/partnerships');
}

export async function approveLead(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  try { await PartnershipsService.approveLead(id); } catch {}
  revalidatePath('/admin/partnerships');
}

export async function rejectLead(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  try { await PartnershipsService.rejectLead(id); } catch {}
  revalidatePath('/admin/partnerships');
}

export async function convertLeadToPartner(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  try { await PartnershipsService.convertLeadToPartner(id); } catch {}
  revalidatePath('/admin/partnerships');
}

export async function createGymIntegration(formData: FormData) {
  const partnerId = String(formData.get('partnerId') || '');
  const features = String(formData.get('features') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const webhookUrl = String(formData.get('webhookUrl') || '') || null;
  const branding = String(formData.get('branding') || '');
  if (!partnerId) return;
  const parsedBranding = branding ? JSON.parse(branding) : null;
  try {
    const { apiKey } = await PartnershipsService.createGymIntegration({ partnerId, features, webhookUrl, branding: parsedBranding || undefined });
    return { apiKey };
  } catch (e) {
    console.error('createGymIntegration error', e);
    return { error: 'Failed to create integration' };
  } finally {
    revalidatePath('/admin/partnerships');
  }
}

export async function createCampaign(formData: FormData) {
  const partnerId = String(formData.get('partnerId') || '');
  const name = String(formData.get('name') || '');
  const objective = String(formData.get('objective') || '') || null;
  const budgetCentsRaw = String(formData.get('budgetCents') || '');
  const budgetCents = budgetCentsRaw ? Number(budgetCentsRaw) : null;
  const startAt = String(formData.get('startAt') || '');
  const endAt = String(formData.get('endAt') || '');
  const targetingRaw = String(formData.get('targeting') || '');
  const placements = String(formData.get('placements') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!partnerId || !name || placements.length === 0) return;
  const targeting = targetingRaw ? JSON.parse(targetingRaw) : null;
  try {
    await PartnershipsService.createCampaign({
      partnerId,
      name,
      objective,
      budgetCents,
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
      targeting: targeting || null,
      placements,
      status: 'DRAFT',
    });
  } catch (e) {
    console.error('createCampaign error', e);
  } finally {
    revalidatePath('/admin/partnerships');
  }
}

export async function submitCreative(formData: FormData) {
  const campaignId = String(formData.get('campaignId') || '');
  const type = String(formData.get('type') || 'IMAGE') as any;
  const assetUrl = String(formData.get('assetUrl') || '');
  const title = String(formData.get('title') || '') || null;
  const body = String(formData.get('body') || '') || null;
  const cta = String(formData.get('cta') || '') || null;
  const clickUrl = String(formData.get('clickUrl') || '');
  if (!campaignId || !assetUrl || !clickUrl) return;
  try {
    await PartnershipsService.submitCreative({ campaignId, type, assetUrl, title, body, cta, clickUrl });
  } catch (e) {
    console.error('submitCreative error', e);
  } finally {
    revalidatePath('/admin/partnerships');
  }
}

export async function approveCreative(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  try { await PartnershipsService.approveCreative(id); } catch {}
  revalidatePath('/admin/partnerships');
}

export async function rejectCreative(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  try { await PartnershipsService.rejectCreative(id); } catch {}
  revalidatePath('/admin/partnerships');
}

export async function pauseCampaign(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  try { await PartnershipsService.pauseCampaign(id); } catch {}
  revalidatePath('/admin/partnerships');
}

export async function resumeCampaign(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  try { await PartnershipsService.resumeCampaign(id); } catch {}
  revalidatePath('/admin/partnerships');
}

