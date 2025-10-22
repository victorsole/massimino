CREATE TYPE "public"."ad_event_type" AS ENUM ('IMPRESSION', 'CLICK');

CREATE TABLE "public"."ad_events" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "creativeId" TEXT NOT NULL,
  "placement" TEXT NOT NULL,
  "event" "public"."ad_event_type" NOT NULL,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."ad_events"
  ADD CONSTRAINT "ad_events_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "public"."ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ad_events"
  ADD CONSTRAINT "ad_events_creativeId_fkey"
  FOREIGN KEY ("creativeId") REFERENCES "public"."ad_creatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ad_events_campaign_placement_event_created_idx" ON "public"."ad_events" ("campaignId", "placement", "event", "createdAt");
CREATE INDEX "ad_events_creative_event_created_idx" ON "public"."ad_events" ("creativeId", "event", "createdAt");

