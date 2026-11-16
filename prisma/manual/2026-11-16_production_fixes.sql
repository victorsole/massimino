-- Massimino production database fixes, 2026-11-16
-- Run in the Supabase SQL editor (or psql on the direct connection, not the pooler).
-- Each part is independent and safe to run twice.
--
-- Checked on 2026-11-16 by comparing every model in prisma/schema.prisma with
-- information_schema: these are the only two differences (one column, one table).

-- ---------------------------------------------------------------------------
-- 1. users.onboardingCompleted
--    In the schema since 2026-03-05, never added to production. Without it:
--    signup fails (P2022 on users.create), GET /api/settings failed, and the
--    onboarding tour can never be marked as done.
--    Existing users get false, so they will be offered the tour once.
-- ---------------------------------------------------------------------------
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Optional: skip the tour for the accounts that already exist.
-- UPDATE "users" SET "onboardingCompleted" = true;

-- ---------------------------------------------------------------------------
-- 2. athlete_applications ("Get Featured" applications)
--    The ApplicationStatus enum already exists; only the table is missing.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "athlete_applications" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "discipline"   TEXT NOT NULL,
  "achievements" TEXT NOT NULL,
  "instagram"    TEXT,
  "website"      TEXT,
  "message"      TEXT,
  "status"       "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "appliedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt"   TIMESTAMP(3),
  "reviewedBy"   TEXT,
  "adminNotes"   TEXT,
  CONSTRAINT "athlete_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "athlete_applications_status_appliedAt_idx"
  ON "athlete_applications" ("status", "appliedAt");
CREATE INDEX IF NOT EXISTS "athlete_applications_email_idx"
  ON "athlete_applications" ("email");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'athlete_applications_reviewedBy_fkey'
  ) THEN
    ALTER TABLE "athlete_applications"
      ADD CONSTRAINT "athlete_applications_reviewedBy_fkey"
      FOREIGN KEY ("reviewedBy") REFERENCES "users" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Exercise photos
--    755 exercises and 748 media rows store .../main/dist/exercises/X/X/0.jpg,
--    which returns 404. The file is at .../main/exercises/X/0.jpg (25 of 25
--    sampled addresses returned 200 after the change).
--    The app already corrects the address when rendering (src/lib/exercise-image.ts)
--    on the Workout Log and the Exercises page; this repairs the rows for every
--    other screen.
-- ---------------------------------------------------------------------------
UPDATE "exercises"
SET "imageUrl" = regexp_replace("imageUrl", '/main/dist/exercises/([^/]+)/\1/', '/main/exercises/\1/')
WHERE "imageUrl" ~ '/main/dist/exercises/([^/]+)/\1/[0-9]+\.jpg$';
-- expected: UPDATE 755

UPDATE "exercise_media"
SET "url" = regexp_replace("url", '/main/dist/exercises/([^/]+)/\1/', '/main/exercises/\1/')
WHERE "url" ~ '/main/dist/exercises/([^/]+)/\1/[0-9]+\.jpg$';
-- expected: UPDATE 748

-- To undo part 3:
-- UPDATE "exercises" SET "imageUrl" = regexp_replace("imageUrl", '/main/exercises/([^/]+)/', '/main/dist/exercises/\1/\1/')
--   WHERE "imageUrl" LIKE '%free-exercise-db/main/exercises/%';
-- UPDATE "exercise_media" SET "url" = regexp_replace("url", '/main/exercises/([^/]+)/', '/main/dist/exercises/\1/\1/')
--   WHERE "url" LIKE '%free-exercise-db/main/exercises/%';

-- ---------------------------------------------------------------------------
-- Check afterwards
-- ---------------------------------------------------------------------------
-- SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboardingCompleted';  -- 1
-- SELECT to_regclass('public.athlete_applications');                                                                    -- athlete_applications
-- SELECT count(*) FROM "exercises" WHERE "imageUrl" LIKE '%/dist/exercises/%';                                          -- 0
