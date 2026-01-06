-- Add media tracking fields to exercises table
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "hasMedia" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "mediaCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "mediaCoverageScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "lastMediaAddedAt" TIMESTAMP(3);

-- Add analytics fields to exercise_media table
ALTER TABLE "exercise_media" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "exercise_media" ADD COLUMN IF NOT EXISTS "attachmentCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "exercise_media" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Create indexes for efficient media-based queries
CREATE INDEX IF NOT EXISTS "exercises_isActive_hasMedia_idx" ON "exercises"("isActive", "hasMedia");
CREATE INDEX IF NOT EXISTS "exercises_hasMedia_mediaCount_idx" ON "exercises"("hasMedia", "mediaCount");

-- Backfill hasMedia and mediaCount for existing exercises based on approved media
UPDATE "exercises" e
SET
  "hasMedia" = (
    SELECT COUNT(*) > 0
    FROM "exercise_media" em
    WHERE em."globalExerciseId" = e."id"
    AND em."status" = 'approved'
    AND em."visibility" = 'public'
  ),
  "mediaCount" = (
    SELECT COUNT(*)
    FROM "exercise_media" em
    WHERE em."globalExerciseId" = e."id"
    AND em."status" = 'approved'
    AND em."visibility" = 'public'
  ),
  "mediaCoverageScore" = CASE
    WHEN (
      SELECT COUNT(*)
      FROM "exercise_media" em
      WHERE em."globalExerciseId" = e."id"
      AND em."status" = 'approved'
      AND em."visibility" = 'public'
    ) >= 3 THEN 1.0
    WHEN (
      SELECT COUNT(*)
      FROM "exercise_media" em
      WHERE em."globalExerciseId" = e."id"
      AND em."status" = 'approved'
      AND em."visibility" = 'public'
    ) >= 1 THEN 0.5
    ELSE 0.0
  END,
  "lastMediaAddedAt" = (
    SELECT MAX(em."createdAt")
    FROM "exercise_media" em
    WHERE em."globalExerciseId" = e."id"
    AND em."status" = 'approved'
    AND em."visibility" = 'public'
  );
