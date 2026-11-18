-- Massimino public API: key storage, 2026-11-18
-- Applied to production on 2026-11-18. Safe to run twice.
-- Only the SHA-256 hash of a key is stored; the key itself is shown once, at creation.

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "label"      TEXT NOT NULL,
  "prefix"     TEXT NOT NULL,
  "keyHash"    TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt"  TIMESTAMP(3),
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_keyHash_key" ON "api_keys" ("keyHash");
CREATE INDEX IF NOT EXISTS "api_keys_userId_idx" ON "api_keys" ("userId");

-- Phase 2 (same day): what a key may do beyond reading open data.
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "scopes" TEXT[] NOT NULL DEFAULT '{}';
