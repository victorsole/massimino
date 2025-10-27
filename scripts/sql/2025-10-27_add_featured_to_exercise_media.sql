-- Migration fallback: add 'featured' boolean column to exercise_media
-- Use this if you cannot run `prisma migrate`.

ALTER TABLE exercise_media
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

