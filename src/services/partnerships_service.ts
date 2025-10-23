// src/services/partnerships_service.ts
import { prisma } from '@/core/database';
import crypto from 'crypto';
import { moderateContent } from '@/services/moderation/openai';

type LeadType = 'GYM' | 'AD';

export const PartnershipsService = {
  async createLead(input: {
    type: LeadType;
    orgName: string;
    contactName: string;
    email: string;
    phone?: string | null;
    website?: string | null;
    details?: Record<string, any> | null;
  }) {
    const safeDetailsText = JSON.stringify(input.details || {});
    const mod = await moderateContent([
      input.orgName,
      input.contactName,
      input.email,
      input.phone || '',
      input.website || '',
      safeDetailsText,
    ].join('\n'));
    if (mod.blocked) {
      throw new Error('Content failed moderation');
    }
    const lead = await prisma.partner_leads.create({
      data: {
        type: input.type as any,
        orgName: input.orgName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone || null,
        website: input.website || null,
        details: input.details || undefined,
        status: 'NEW' as any,
      },
    });
    return lead;
  },

  async approveLead(leadId: string) {
    return prisma.partner_leads.update({
      where: { id: leadId },
      data: { status: 'APPROVED' as any },
    });
  },

  async rejectLead(leadId: string) {
    return prisma.partner_leads.update({
      where: { id: leadId },
      data: { status: 'REJECTED' as any },
    });
  },

  async convertLeadToPartner(leadId: string) {
    const lead = await prisma.partner_leads.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error('Lead not found');
    const partner = await prisma.partners.create({
      data: {
        name: lead.orgName,
        url: lead.website || 'https://',
        description: (lead.details as any)?.notes || null,
        country: null,
        logoUrl: null,
        tags: lead.type === 'GYM' ? ['gym'] : ['advertiser'],
        isActive: true,
      },
    });
    await prisma.partner_leads.update({
      where: { id: leadId },
      data: { convertedPartnerId: partner.id, status: 'APPROVED' as any },
    });
    return partner;
  },

  async createGymIntegration(params: {
    partnerId: string;
    features?: string[];
    webhookUrl?: string | null;
    branding?: Record<string, any> | null;
  }) {
    const apiKey = PartnershipsService.generateApiKey();
    const apiKeyHash = PartnershipsService.hashApiKey(apiKey);
    const rec = await prisma.gym_integrations.create({
      data: {
        partnerId: params.partnerId,
        apiKeyHash,
        allowedFeatures: params.features || undefined,
        webhookUrl: params.webhookUrl || null,
        branding: params.branding || undefined,
        status: 'ACTIVE' as any,
      },
    });
    return { integration: rec, apiKey };
  },

  generateApiKey() {
    return `gym_${crypto.randomBytes(24).toString('base64url')}`;
  },

  hashApiKey(apiKey: string) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  },

  async createCampaign(input: {
    partnerId: string;
    name: string;
    objective?: string | null;
    budgetCents?: number | null;
    startAt?: Date | null;
    endAt?: Date | null;
    targeting?: Record<string, any> | null;
    placements: string[];
    status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  }) {
    const campaign = await prisma.ad_campaigns.create({
      data: {
        partnerId: input.partnerId,
        name: input.name,
        objective: input.objective || null,
        budgetCents: input.budgetCents ?? null,
        startAt: input.startAt ?? null,
        endAt: input.endAt ?? null,
        targeting: input.targeting || undefined,
        placements: input.placements,
        status: (input.status || 'DRAFT') as any,
      },
    });
    return campaign;
  },

  async submitCreative(input: {
    campaignId: string;
    type: 'IMAGE' | 'VIDEO' | 'NATIVE';
    assetUrl: string;
    title?: string | null;
    body?: string | null;
    cta?: string | null;
    clickUrl: string;
  }) {
    const contentForModeration = [input.title, input.body, input.cta].filter(Boolean).join('\n');
    if (contentForModeration) {
      const mod = await moderateContent(contentForModeration);
      if (mod.blocked) {
        throw new Error('Creative content failed moderation');
      }
    }
    const creative = await prisma.ad_creatives.create({
      data: {
        campaignId: input.campaignId,
        type: input.type as any,
        assetUrl: input.assetUrl,
        title: input.title || null,
        body: input.body || null,
        cta: input.cta || null,
        clickUrl: input.clickUrl,
        status: 'PENDING_REVIEW' as any,
      },
    });
    return creative;
  },

  async approveCreative(creativeId: string) {
    return prisma.ad_creatives.update({ where: { id: creativeId }, data: { status: 'APPROVED' as any } });
  },

  async rejectCreative(creativeId: string) {
    return prisma.ad_creatives.update({ where: { id: creativeId }, data: { status: 'REJECTED' as any } });
  },

  async pauseCampaign(campaignId: string) {
    return prisma.ad_campaigns.update({ where: { id: campaignId }, data: { status: 'PAUSED' as any } });
  },

  async resumeCampaign(campaignId: string) {
    return prisma.ad_campaigns.update({ where: { id: campaignId }, data: { status: 'ACTIVE' as any } });
  },

  async selectAdForUser(params: { userId?: string | null; placement: string; excludeCreativeId?: string | null }) {
    const now = new Date();
    // Pull candidate creatives with campaign join
    let creatives = await prisma.ad_creatives.findMany({
      where: {
        status: 'APPROVED' as any,
        ad_campaigns: {
          status: 'ACTIVE' as any,
          AND: [
            { OR: [{ startAt: null }, { startAt: { lte: now } }] },
            { OR: [{ endAt: null }, { endAt: { gte: now } }] },
          ],
        },
      },
      include: { ad_campaigns: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    // Filter by placement
    let eligible = creatives.filter((c) => (c.ad_campaigns.placements || []).includes(params.placement));

    // Targeting match (simple): goals intersect OR experienceLevel match
    if (params.userId) {
      const user = await prisma.users.findUnique({
        where: { id: params.userId },
        select: { fitnessGoals: true, experienceLevel: true, country: true },
      }).catch(() => null) as any;
      if (user) {
        eligible = eligible.filter((c) => {
          const t: any = c.ad_campaigns.targeting || {};
          // Goals intersect
          if (Array.isArray(t.goals) && t.goals.length) {
            const goals = Array.isArray(user.fitnessGoals) ? user.fitnessGoals : [];
            if (!goals.some((g: string) => t.goals.includes(g))) return false;
          }
          // Experience level
          if (t.experienceLevel && user.experienceLevel && t.experienceLevel !== user.experienceLevel) return false;
          // Country
          if (t.locationCountry && user.country && t.locationCountry !== user.country) return false;
          return true;
        });
      }
    }

    // Exclude last served creative if requested
    if (params.excludeCreativeId) {
      eligible = eligible.filter((c) => c.id !== params.excludeCreativeId);
    }

    if (eligible.length === 0) return null;
    const choice = eligible[Math.floor(Math.random() * eligible.length)];
    // Record impression with placement
    await PartnershipsService.recordImpression(choice.id, params.placement, params.userId || undefined);
    return choice;
  },

  async recordImpression(creativeId: string, placement: string, _userId?: string) {
    // Simple counters increment (atomic)
    const creative = await prisma.ad_creatives.update({
      where: { id: creativeId },
      data: { impressions: { increment: 1 } as any },
    });
    const campaign = await prisma.ad_campaigns.update({
      where: { id: creative.campaignId },
      data: { impressions: { increment: 1 } as any },
    });
    // TODO: Create ad_events table in Prisma schema
    // await prisma.ad_events.create({ data: { campaignId: campaign.id, creativeId, placement, event: 'IMPRESSION' as any, userId: _userId || null } });
    await this.updateCampaignSpendAndPacing(campaign.id);
  },

  async recordClick(creativeId: string, _userId?: string, placement?: string | null) {
    const creative = await prisma.ad_creatives.update({
      where: { id: creativeId },
      data: { clicks: { increment: 1 } as any },
    });
    const campaign = await prisma.ad_campaigns.update({
      where: { id: creative.campaignId },
      data: { clicks: { increment: 1 } as any },
    });
    // TODO: Create ad_events table in Prisma schema
    // await prisma.ad_events.create({ data: { campaignId: campaign.id, creativeId, placement: placement || 'unknown', event: 'CLICK' as any, userId: _userId || null } });
    await this.updateCampaignSpendAndPacing(campaign.id);
    return creative.clickUrl;
  },

  async updateCampaignSpendAndPacing(campaignId: string) {
    const c = await prisma.ad_campaigns.findUnique({ where: { id: campaignId } });
    if (!c) return;
    // Compute spend: impressions * (cpm/1000) + clicks * cpc
    // TODO: Add cpmCents and cpcCents fields to ad_campaigns table
    const cpm = (c as any).cpmCents ?? 0;
    const cpc = (c as any).cpcCents ?? 0;
    const spend = Math.round((c.impressions * (cpm / 1000)) + (c.clicks * cpc));
    const updates: any = { spendCents: spend };
    // Auto-pause when over budget or flight ended
    const now = new Date();
    const overBudget = typeof c.budgetCents === 'number' && c.budgetCents > 0 && spend >= c.budgetCents;
    const afterEnd = !!c.endAt && c.endAt < now;
    if ((overBudget || afterEnd) && c.status === 'ACTIVE') {
      updates.status = 'PAUSED';
    }
    await prisma.ad_campaigns.update({ where: { id: campaignId }, data: updates });
  },
};

export default PartnershipsService;
