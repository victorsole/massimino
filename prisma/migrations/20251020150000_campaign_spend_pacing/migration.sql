ALTER TABLE "public"."ad_campaigns"
  ADD COLUMN "cpmCents" INTEGER,
  ADD COLUMN "cpcCents" INTEGER,
  ADD COLUMN "spendCents" INTEGER NOT NULL DEFAULT 0;

