-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "enableDiscovery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationVisibility" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "showLocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "state" TEXT;
