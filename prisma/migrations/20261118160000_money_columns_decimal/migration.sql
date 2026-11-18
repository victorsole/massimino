-- Money columns: double precision -> numeric, matching the Decimal fields in schema.prisma.
-- Applied to production on 18 November 2026 through the Prisma client in one transaction with
-- lock_timeout 5s (`prisma db execute` hangs on the PgBouncer pooler, and production has no
-- _prisma_migrations table). Pre-checks: no dependent views, policies, triggers or indexes;
-- every existing value fits and has at most two decimals, so no value changes.

BEGIN;

ALTER TABLE "appointments"
  ALTER COLUMN "price" TYPE DECIMAL(10,2),
  ALTER COLUMN "noShowFee" TYPE DECIMAL(10,2);

ALTER TABLE "challenges"
  ALTER COLUMN "entryFee" TYPE DECIMAL(10,2),
  ALTER COLUMN "prizePool" TYPE DECIMAL(10,2);

ALTER TABLE "equipment_recommendations"
  ALTER COLUMN "price" TYPE DECIMAL(10,2);

ALTER TABLE "group_classes"
  ALTER COLUMN "price" TYPE DECIMAL(10,2);

ALTER TABLE "payments"
  ALTER COLUMN "amount" TYPE DECIMAL(10,2),
  ALTER COLUMN "refundAmount" TYPE DECIMAL(10,2),
  ALTER COLUMN "platformFee" TYPE DECIMAL(10,2),
  ALTER COLUMN "trainerEarnings" TYPE DECIMAL(10,2);

ALTER TABLE "premium_communities"
  ALTER COLUMN "price" TYPE DECIMAL(10,2);

ALTER TABLE "program_purchases"
  ALTER COLUMN "price" TYPE DECIMAL(10,2);

ALTER TABLE "program_templates"
  ALTER COLUMN "price" TYPE DECIMAL(10,2);

ALTER TABLE "subscriptions"
  ALTER COLUMN "price" TYPE DECIMAL(10,2);

ALTER TABLE "template_purchases"
  ALTER COLUMN "price" TYPE DECIMAL(10,2);

ALTER TABLE "trainer_clients"
  ALTER COLUMN "monthlyRate" TYPE DECIMAL(10,2);

ALTER TABLE "trainer_packages"
  ALTER COLUMN "price" TYPE DECIMAL(10,2);

ALTER TABLE "trainer_profiles"
  ALTER COLUMN "hourlyRate" TYPE DECIMAL(10,2),
  ALTER COLUMN "totalEarnings" TYPE DECIMAL(12,2),
  ALTER COLUMN "monthlyEarnings" TYPE DECIMAL(12,2);

ALTER TABLE "workout_templates"
  ALTER COLUMN "price" TYPE DECIMAL(10,2);

COMMIT;
