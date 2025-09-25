-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_postId_fkey";

-- AlterTable
ALTER TABLE "public"."comments" ADD COLUMN     "workoutLogId" TEXT,
ALTER COLUMN "postId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."workout_log_entries" ADD COLUMN     "allowComments" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "comments_workoutLogId_createdAt_idx" ON "public"."comments"("workoutLogId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "public"."workout_log_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
