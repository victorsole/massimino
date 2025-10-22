// src/app/api/partnerships/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import authOptions from '@/core/auth/config';
import PartnershipsService from '@/services/partnerships_service';
import { sendEmail, isEmailServiceConfigured } from '@/services/email/email_service';

const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

const LeadSubmitSchema = z.object({
  action: z.literal('lead_submit'),
  type: z.enum(['GYM', 'AD']),
  payload: z.object({
    orgName: z.string().min(2),
    contactName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
    details: z.any().optional(),
  }),
});

const KitDownloadSchema = z.object({ action: z.literal('kit_download'), email: z.string().email().optional() });

const CampaignCreateSchema = z.object({
  action: z.literal('campaign_create'),
  partnerId: z.string().min(1),
  payload: z.object({
    name: z.string().min(2),
    objective: z.string().optional(),
    budgetCents: z.number().int().nonnegative().optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    targeting: z.any().optional(),
    placements: z.array(z.enum(['feed', 'workout', 'teams', 'discover'])).min(1),
    status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']).optional(),
  }),
});

const CreativeSubmitSchema = z.object({
  action: z.literal('creative_submit'),
  campaignId: z.string().min(1),
  payload: z.object({
    type: z.enum(['IMAGE', 'VIDEO', 'NATIVE']),
    assetUrl: z.string().url(),
    title: z.string().max(60).optional(),
    body: z.string().max(140).optional(),
    cta: z.string().max(20).optional(),
    clickUrl: z.string().url(),
  }),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    // Route by action
    if (json?.action === 'lead_submit') {
      const { type, payload } = LeadSubmitSchema.parse(json);
      const lead = await PartnershipsService.createLead({
        type,
        ...payload,
        phone: payload.phone ?? null,
        website: payload.website ?? null,
        details: payload.details ?? null,
      });

      // Confirmation email to lead (optional)
      if (isEmailServiceConfigured()) {
        await sendEmail({
          to: payload.email,
          subject: `Thanks for your interest in partnering with Massimino`,
          text: `Hi ${payload.contactName},\n\nWe received your ${type === 'GYM' ? 'Gym' : 'Advertising'} partnership request for ${payload.orgName}. Our team will review and get back to you shortly.\n\n— Massimino Partnerships Team`,
        });
      }
      // Notify admins (best effort)
      await Promise.allSettled(
        ADMIN_EMAILS.map((admin) =>
          sendEmail({
            to: admin,
            subject: `[Massimino] New ${type} partnership lead: ${payload.orgName}`,
            text: `Lead ID: ${lead.id}\nOrg: ${payload.orgName}\nContact: ${payload.contactName} <${payload.email}>\nType: ${type}\nWebsite: ${payload.website || '-'}\nDetails: ${JSON.stringify(payload.details || {}, null, 2)}`,
          })
        )
      );
      return NextResponse.json({ ok: true, leadId: lead.id });
    }

    if (json?.action === 'kit_download') {
      const { email } = KitDownloadSchema.parse(json);
      if (email && isEmailServiceConfigured()) {
        await sendEmail({
          to: email,
          subject: 'Massimino Partnership Kit',
          text: 'Thanks for your interest! Download the partnership kit here: https://massimino.fitness/partners/kit.pdf',
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (json?.action === 'campaign_create') {
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const { partnerId, payload } = CampaignCreateSchema.parse(json);
      const campaign = await PartnershipsService.createCampaign({
        partnerId,
        name: payload.name,
        objective: payload.objective || null,
        budgetCents: payload.budgetCents ?? null,
        startAt: payload.startAt ? new Date(payload.startAt) : null,
        endAt: payload.endAt ? new Date(payload.endAt) : null,
        targeting: payload.targeting || null,
        placements: payload.placements,
        status: payload.status || 'DRAFT',
      });
      return NextResponse.json({ ok: true, campaignId: campaign.id });
    }

    if (json?.action === 'creative_submit') {
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const { campaignId, payload } = CreativeSubmitSchema.parse(json);
      const creative = await PartnershipsService.submitCreative({
        campaignId,
        type: payload.type,
        assetUrl: payload.assetUrl,
        title: payload.title || null,
        body: payload.body || null,
        cta: payload.cta || null,
        clickUrl: payload.clickUrl,
      });
      return NextResponse.json({ ok: true, creativeId: creative.id });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    console.error('[api/partnerships] Error:', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 400 });
  }
}
