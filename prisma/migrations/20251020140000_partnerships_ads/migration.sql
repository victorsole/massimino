-- Enums for partnerships and advertising
CREATE TYPE "public"."lead_type" AS ENUM ('GYM', 'AD');
CREATE TYPE "public"."lead_status" AS ENUM ('NEW', 'REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "public"."integration_status" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "public"."campaign_status" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "public"."creative_type" AS ENUM ('IMAGE', 'VIDEO', 'NATIVE');
CREATE TYPE "public"."creative_status" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PAUSED');

-- partner_leads
CREATE TABLE "public"."partner_leads" (
  "id" TEXT NOT NULL,
  "type" "public"."lead_type" NOT NULL,
  "orgName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "website" TEXT,
  "details" JSONB,
  "status" "public"."lead_status" NOT NULL DEFAULT 'NEW',
  "convertedPartnerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "partner_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "partner_leads_status_createdAt_idx" ON "public"."partner_leads" ("status", "createdAt");
CREATE INDEX "partner_leads_email_idx" ON "public"."partner_leads" ("email");

-- gym_integrations
CREATE TABLE "public"."gym_integrations" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "apiKeyHash" TEXT NOT NULL,
  "allowedFeatures" JSONB,
  "webhookUrl" TEXT,
  "branding" JSONB,
  "status" "public"."integration_status" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "gym_integrations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."gym_integrations"
  ADD CONSTRAINT "gym_integrations_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "public"."partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "gym_integrations_partnerId_idx" ON "public"."gym_integrations" ("partnerId");
CREATE INDEX "gym_integrations_status_idx" ON "public"."gym_integrations" ("status");

-- ad_campaigns
CREATE TABLE "public"."ad_campaigns" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "objective" TEXT,
  "budgetCents" INTEGER,
  "startAt" TIMESTAMP(3),
  "endAt" TIMESTAMP(3),
  "status" "public"."campaign_status" NOT NULL DEFAULT 'DRAFT',
  "targeting" JSONB,
  "placements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."ad_campaigns"
  ADD CONSTRAINT "ad_campaigns_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "public"."partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ad_campaigns_partnerId_status_idx" ON "public"."ad_campaigns" ("partnerId", "status");
CREATE INDEX "ad_campaigns_start_end_idx" ON "public"."ad_campaigns" ("startAt", "endAt");

-- ad_creatives
CREATE TABLE "public"."ad_creatives" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "type" "public"."creative_type" NOT NULL,
  "assetUrl" TEXT NOT NULL,
  "title" TEXT,
  "body" TEXT,
  "cta" TEXT,
  "clickUrl" TEXT NOT NULL,
  "status" "public"."creative_status" NOT NULL DEFAULT 'PENDING_REVIEW',
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_creatives_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."ad_creatives"
  ADD CONSTRAINT "ad_creatives_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "public"."ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ad_creatives_campaignId_status_idx" ON "public"."ad_creatives" ("campaignId", "status");

