-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('CLIENT', 'TRAINER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."ModerationAction" AS ENUM ('APPROVED', 'FLAGGED', 'BLOCKED', 'EDITED');

-- CreateEnum
CREATE TYPE "public"."ModerationSource" AS ENUM ('OPENAI_API', 'CUSTOM_RULES', 'USER_REPORT', 'ADMIN_ACTION');

-- CreateEnum
CREATE TYPE "public"."ViolationType" AS ENUM ('INAPPROPRIATE_CONTENT', 'HARASSMENT', 'SPAM', 'IMPERSONATION', 'OFF_TOPIC', 'PRIVACY_VIOLATION', 'HATE_SPEECH', 'THREAT');

-- CreateEnum
CREATE TYPE "public"."CommunityType" AS ENUM ('PUBLIC', 'PRIVATE', 'TRAINER');

-- CreateEnum
CREATE TYPE "public"."PostStatus" AS ENUM ('PUBLISHED', 'PENDING', 'FLAGGED', 'REMOVED', 'DRAFT');

-- CreateEnum
CREATE TYPE "public"."SetType" AS ENUM ('STRAIGHT', 'SUPERSET', 'TRISET', 'GIANT_SET', 'PYRAMID', 'REVERSE_PYRAMID', 'DROP_SET', 'REST_PAUSE', 'CLUSTER', 'EMOM', 'AMRAP');

-- CreateEnum
CREATE TYPE "public"."WeightUnit" AS ENUM ('KG', 'LB');

-- CreateEnum
CREATE TYPE "public"."IntensityType" AS ENUM ('PERCENTAGE_1RM', 'RPE', 'RIR');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'CLIENT',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "googleId" TEXT,
    "linkedinId" TEXT,
    "facebookId" TEXT,
    "emailVerified" TIMESTAMP(3),
    "acceptDMs" BOOLEAN NOT NULL DEFAULT false,
    "onlyTrainerDMs" BOOLEAN NOT NULL DEFAULT true,
    "profileVisibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "showRealName" BOOLEAN NOT NULL DEFAULT false,
    "instagramUrl" TEXT,
    "tiktokUrl" TEXT,
    "facebookUrl" TEXT,
    "youtubeUrl" TEXT,
    "linkedinUrl" TEXT,
    "showSocialMedia" BOOLEAN NOT NULL DEFAULT true,
    "fitnessGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "preferredWorkoutTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availableWorkoutDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredWorkoutDuration" TEXT DEFAULT '30-60',
    "trainerVerified" BOOLEAN NOT NULL DEFAULT false,
    "trainerBio" TEXT,
    "trainerCredentials" TEXT,
    "trainerRating" DOUBLE PRECISION DEFAULT 0.0,
    "reputationScore" INTEGER NOT NULL DEFAULT 100,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "suspendedUntil" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."moderation_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "action" "public"."ModerationAction" NOT NULL,
    "source" "public"."ModerationSource" NOT NULL,
    "flaggedReason" TEXT,
    "confidence" DOUBLE PRECISION,
    "openaiResponse" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_violations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "violationType" "public"."ViolationType" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "warningIssued" BOOLEAN NOT NULL DEFAULT false,
    "suspensionHours" INTEGER,
    "reputationHit" INTEGER NOT NULL DEFAULT 0,
    "contentType" TEXT,
    "contentId" TEXT,
    "moderationLogId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."safety_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "violationType" "public"."ViolationType" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "contentType" TEXT,
    "contentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."safety_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allowDirectMessages" BOOLEAN NOT NULL DEFAULT false,
    "allowTrainerMessages" BOOLEAN NOT NULL DEFAULT true,
    "allowGroupMessages" BOOLEAN NOT NULL DEFAULT true,
    "profileVisibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "showOnlineStatus" BOOLEAN NOT NULL DEFAULT false,
    "showLastSeen" BOOLEAN NOT NULL DEFAULT false,
    "autoBlockFlaggedUsers" BOOLEAN NOT NULL DEFAULT true,
    "requireVerifiedTrainers" BOOLEAN NOT NULL DEFAULT false,
    "contentFilterStrength" TEXT NOT NULL DEFAULT 'MEDIUM',
    "safetyAlerts" BOOLEAN NOT NULL DEFAULT true,
    "moderationNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."CommunityType" NOT NULL DEFAULT 'PUBLIC',
    "ownerId" TEXT NOT NULL,
    "moderationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."community_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."posts" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "communityId" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'TEXT',
    "attachments" JSONB,
    "status" "public"."PostStatus" NOT NULL DEFAULT 'PUBLISHED',
    "moderatedAt" TIMESTAMP(3),
    "moderatedBy" TEXT,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "reportsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "status" "public"."PostStatus" NOT NULL DEFAULT 'PUBLISHED',
    "moderatedAt" TIMESTAMP(3),
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "reportsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workout_log_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" TEXT,
    "sessionId" TEXT,
    "date" DATE NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "setType" "public"."SetType" NOT NULL,
    "reps" INTEGER NOT NULL,
    "weight" TEXT NOT NULL,
    "unit" "public"."WeightUnit" NOT NULL,
    "intensity" TEXT,
    "intensityType" "public"."IntensityType",
    "tempo" TEXT,
    "restSeconds" INTEGER,
    "trainingVolume" DOUBLE PRECISION,
    "duration" TEXT,
    "coachFeedback" TEXT,
    "userComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "category" TEXT NOT NULL,
    "muscleGroups" TEXT[],
    "equipment" TEXT[],
    "instructions" TEXT,
    "videoUrl" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "safetyNotes" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accredited_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "qualifications" TEXT[],
    "profilePath" TEXT,
    "profileUrl" TEXT,
    "slug" TEXT,
    "source" TEXT NOT NULL DEFAULT 'EREPS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accredited_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workout_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" TEXT,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "title" TEXT,
    "notes" TEXT,
    "location" TEXT,
    "totalVolume" DOUBLE PRECISION,
    "totalSets" INTEGER NOT NULL DEFAULT 0,
    "totalReps" INTEGER NOT NULL DEFAULT 0,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "public"."users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_linkedinId_key" ON "public"."users"("linkedinId");

-- CreateIndex
CREATE UNIQUE INDEX "users_facebookId_key" ON "public"."users"("facebookId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_token_key" ON "public"."verificationtokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "public"."verificationtokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "moderation_logs_userId_createdAt_idx" ON "public"."moderation_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "moderation_logs_action_source_idx" ON "public"."moderation_logs"("action", "source");

-- CreateIndex
CREATE INDEX "user_violations_userId_createdAt_idx" ON "public"."user_violations"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "user_violations_violationType_severity_idx" ON "public"."user_violations"("violationType", "severity");

-- CreateIndex
CREATE INDEX "safety_reports_reportedUserId_createdAt_idx" ON "public"."safety_reports"("reportedUserId", "createdAt");

-- CreateIndex
CREATE INDEX "safety_reports_status_priority_idx" ON "public"."safety_reports"("status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "safety_settings_userId_key" ON "public"."safety_settings"("userId");

-- CreateIndex
CREATE INDEX "communities_ownerId_type_idx" ON "public"."communities"("ownerId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "community_members_userId_communityId_key" ON "public"."community_members"("userId", "communityId");

-- CreateIndex
CREATE INDEX "posts_authorId_createdAt_idx" ON "public"."posts"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "posts_communityId_status_createdAt_idx" ON "public"."posts"("communityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "comments_postId_createdAt_idx" ON "public"."comments"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "comments_authorId_status_idx" ON "public"."comments"("authorId", "status");

-- CreateIndex
CREATE INDEX "workout_log_entries_userId_date_idx" ON "public"."workout_log_entries"("userId", "date");

-- CreateIndex
CREATE INDEX "workout_log_entries_coachId_date_idx" ON "public"."workout_log_entries"("coachId", "date");

-- CreateIndex
CREATE INDEX "workout_log_entries_exerciseId_date_idx" ON "public"."workout_log_entries"("exerciseId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_key" ON "public"."exercises"("name");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_slug_key" ON "public"."exercises"("slug");

-- CreateIndex
CREATE INDEX "exercises_name_idx" ON "public"."exercises"("name");

-- CreateIndex
CREATE INDEX "exercises_category_idx" ON "public"."exercises"("category");

-- CreateIndex
CREATE INDEX "exercises_category_muscleGroups_idx" ON "public"."exercises"("category", "muscleGroups");

-- CreateIndex
CREATE INDEX "exercises_isActive_difficulty_idx" ON "public"."exercises"("isActive", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "accredited_providers_slug_key" ON "public"."accredited_providers"("slug");

-- CreateIndex
CREATE INDEX "accredited_providers_country_idx" ON "public"."accredited_providers"("country");

-- CreateIndex
CREATE UNIQUE INDEX "accredited_providers_name_country_key" ON "public"."accredited_providers"("name", "country");

-- CreateIndex
CREATE INDEX "workout_sessions_userId_date_idx" ON "public"."workout_sessions"("userId", "date");

-- CreateIndex
CREATE INDEX "workout_sessions_coachId_date_idx" ON "public"."workout_sessions"("coachId", "date");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."moderation_logs" ADD CONSTRAINT "moderation_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_violations" ADD CONSTRAINT "user_violations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."safety_reports" ADD CONSTRAINT "safety_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."safety_reports" ADD CONSTRAINT "safety_reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."safety_settings" ADD CONSTRAINT "safety_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communities" ADD CONSTRAINT "communities_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_members" ADD CONSTRAINT "community_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_members" ADD CONSTRAINT "community_members_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_log_entries" ADD CONSTRAINT "workout_log_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_log_entries" ADD CONSTRAINT "workout_log_entries_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_log_entries" ADD CONSTRAINT "workout_log_entries_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_log_entries" ADD CONSTRAINT "workout_log_entries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."workout_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_sessions" ADD CONSTRAINT "workout_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_sessions" ADD CONSTRAINT "workout_sessions_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
