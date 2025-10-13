/**
 * Trainer Types for Professional Features
 * Comprehensive type definitions for trainer professional functionality
 */

// ============================================================================
// PROFESSIONAL TRAINER CORE TYPES
// ============================================================================

export interface TrainerPartnership {
  id: string;
  ownerId: string;
  partnerId: string;
  partnerName: string;
  type: 'JOINT_TRAINING' | 'REVENUE_SHARING' | 'REFERRAL' | 'MENTORSHIP' | 'CONTENT' | 'CROSS_PROMOTION';
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'REJECTED';
  revenueShare: number; // percentage
  description?: string;
  terms?: string;
  totalRevenue: number; // in cents
  partnerRevenue: number; // in cents
  startDate?: Date;
  endDate?: Date;
  endReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamChallenge {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description?: string;
  type: 'WORKOUT_GOAL' | 'WEIGHT_LOSS' | 'STRENGTH_GAIN' | 'ENDURANCE' | 'STEPS' | 'CONSISTENCY' | 'CUSTOM';
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  currentParticipants: number;
  isPublic: boolean;
  entryFee: number; // in cents
  prizePool: number; // in cents
  currency: string;
  rules: string;
  metrics: Record<string, any>;
  rewards: any[];
  completionRate: number;
  coverImage?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  participants?: ChallengeParticipation[];
}

export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  status: 'REGISTERED' | 'CONFIRMED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED' | 'WAITLISTED';
  joinedAt: Date;
  completedAt?: Date;
  currentProgress?: Record<string, any>;
  finalResults?: Record<string, any>;
  rank?: number;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'CANCELLED';
  paymentId?: string;
  isVerified: boolean;
  verifiedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MentorRelationship {
  id: string;
  mentorId: string;
  menteeId: string;
  mentorName?: string;
  menteeName?: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';
  reason: string;
  expectedDuration?: number; // days
  goals: string[];
  startDate?: Date;
  endDate?: Date;
  endReason?: string;
  sessionsCompleted: number;
  sessionsPlanned?: number;
  lastContactAt?: Date;
  nextSessionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  sessions?: MentorSession[];
}

export interface MentorSession {
  id: string;
  relationshipId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // minutes
  isVirtual: boolean;
  meetingLink?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  completedAt?: Date;
  notes?: string;
  mentorRating?: number; // 1-5 rating from mentee
  menteeRating?: number; // 1-5 rating from mentor
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainerConnection {
  id: string;
  senderId: string;
  receiverId: string;
  senderName?: string;
  receiverName?: string;
  status: 'PENDING' | 'CONNECTED' | 'DECLINED' | 'BLOCKED';
  message?: string;
  connectedAt?: Date;
  lastMessageAt?: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NetworkMessage {
  id: string;
  connectionId: string;
  senderId: string;
  senderName: string;
  subject: string;
  content: string;
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
}

export interface ProfessionalReview {
  id: string;
  reviewerId: string;
  revieweeId: string;
  reviewerName: string;
  revieweeName: string;
  rating: number; // 1-5 stars
  category: string;
  title?: string;
  review: string;
  skills: string[];
  wouldRecommend: boolean;
  isAnonymous: boolean;
  isPublic: boolean;
  isVerified: boolean;
  helpfulVotes: number;
  responseFromReviewee?: string;
  responseAt?: Date;
  isFlagged: boolean;
  flagReason?: string;
  flaggedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreatePartnershipRequest {
  partnerEmail: string;
  type: 'JOINT_TRAINING' | 'REVENUE_SHARING' | 'REFERRAL' | 'MENTORSHIP' | 'CONTENT' | 'CROSS_PROMOTION';
  revenueShare: number; // percentage
  description?: string;
  terms?: string;
}

export interface CreateChallengeRequest {
  title: string;
  description?: string;
  type: 'WORKOUT_GOAL' | 'WEIGHT_LOSS' | 'STRENGTH_GAIN' | 'ENDURANCE' | 'STEPS' | 'CONSISTENCY' | 'CUSTOM';
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  entryFee?: number; // in cents
  prizePool?: number; // in cents
  rules: string;
  metrics?: Record<string, any>;
}

export interface CreateMentorRequest {
  mentorId: string;
  reason: string;
  expectedDuration?: number; // days
  goals?: string[];
}

export interface ConnectionRequest {
  trainerId: string;
  message?: string;
}

// ============================================================================
// ANALYTICS & METRICS
// ============================================================================

export interface PartnershipAnalytics {
  totalPartnerships: number;
  activePartnerships: number;
  totalRevenue: number;
  partnerRevenue: number;
  topPartners: Array<{
    id: string;
    name: string;
    revenue: number;
    type: string;
  }>;
  monthlyTrends: Array<{
    month: string;
    partnerships: number;
    revenue: number;
  }>;
}

export interface ChallengeMetrics {
  totalChallenges: number;
  activeChallenges: number;
  totalParticipants: number;
  completionRate: number;
  averageParticipants: number;
  popularChallenges: Array<{
    id: string;
    title: string;
    participants: number;
    completionRate: number;
  }>;
  monthlyActivity: Array<{
    month: string;
    challenges: number;
    participants: number;
  }>;
}

export interface NetworkingStats {
  totalConnections: number;
  pendingRequests: number;
  mutualConnections: number;
  networkReach: number;
  connectionGrowth: number;
  popularSpecializations: Array<{
    specialization: string;
    count: number;
  }>;
  locationDistribution: Array<{
    location: string;
    count: number;
  }>;
}

export interface ReviewSummary {
  overallRating: number;
  totalReviews: number;
  ratingDistribution: Array<{ rating: number; count: number; }>;
  topSkills: string[];
  reviewCategories: Array<{ category: string; rating: number; count: number; }>;
  recommendationRate: number;
}

// ============================================================================
// SEARCH & DISCOVERY TYPES
// ============================================================================

export interface TrainerSearchCriteria {
  name?: string;
  specializations?: string[];
  location?: string;
  experienceYears?: number;
  rating?: number;
  verified?: boolean;
}

export interface TrainerSearchResult {
  id: string;
  name: string;
  specializations: string[];
  location?: string;
  experienceYears: number;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  profileImage?: string;
  bio?: string;
  connectionStatus?: 'NONE' | 'PENDING' | 'CONNECTED' | 'DECLINED';
}

export interface MentorSearchCriteria {
  specializations?: string[];
  experienceYears?: number;
  location?: string;
  rating?: number;
}

export interface PotentialMentor {
  id: string;
  name: string;
  specializations: string[];
  experienceYears: number;
  rating: number;
  totalMentees: number;
  successRate: number;
  location?: string;
  bio?: string;
  profileImage?: string;
  availability?: {
    hoursPerWeek: number;
    preferredTimes: string[];
  };
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const PROFESSIONAL_VALIDATION_RULES = {
  partnership: {
    revenueShare: {
      min: 0,
      max: 100
    }
  },
  challenge: {
    title: {
      minLength: 3,
      maxLength: 100
    },
    description: {
      maxLength: 1000
    },
    rules: {
      minLength: 10,
      maxLength: 2000
    },
    entryFee: {
      min: 0,
      max: 50000 // €500.00
    },
    prizePool: {
      min: 0,
      max: 1000000 // €10,000.00
    }
  },
  mentorship: {
    reason: {
      minLength: 10,
      maxLength: 500
    },
    expectedDuration: {
      min: 30, // days
      max: 365 // days
    }
  },
  review: {
    rating: {
      min: 1,
      max: 5
    },
    title: {
      maxLength: 100
    },
    review: {
      minLength: 10,
      maxLength: 2000
    },
    skills: {
      maxItems: 10
    }
  }
} as const;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PartnershipType = 'JOINT_TRAINING' | 'REVENUE_SHARING' | 'REFERRAL' | 'MENTORSHIP' | 'CONTENT' | 'CROSS_PROMOTION';

export type PartnershipStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'REJECTED';

export type ChallengeType = 'WORKOUT_GOAL' | 'WEIGHT_LOSS' | 'STRENGTH_GAIN' | 'ENDURANCE' | 'STEPS' | 'CONSISTENCY' | 'CUSTOM';

export type ChallengeStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';

export type MentorshipStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';

export type ConnectionStatus = 'PENDING' | 'CONNECTED' | 'DECLINED' | 'BLOCKED';

export type SessionStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ProfessionalDashboardResponse {
  partnerships: TrainerPartnership[];
  challenges: TeamChallenge[];
  mentorships: MentorRelationship[];
  connections: TrainerConnection[];
  reviews: ProfessionalReview[];
  analytics: {
    partnerships: PartnershipAnalytics;
    challenges: ChallengeMetrics;
    networking: NetworkingStats;
    reviews: ReviewSummary;
  };
  period: string;
}

export interface PartnershipResponse {
  partnerships: TrainerPartnership[];
  analytics: PartnershipAnalytics;
}

export interface ChallengeResponse {
  challenges: TeamChallenge[];
  metrics: ChallengeMetrics;
}

export interface MentoringResponse {
  requests: MentorRelationship[];
  mentorships: MentorRelationship[];
  menteeships: MentorRelationship[];
}

export interface NetworkingResponse {
  connections: TrainerConnection[];
  requests: TrainerConnection[];
  stats: NetworkingStats;
  recommended: TrainerSearchResult[];
}

export interface ReviewResponse {
  reviews: ProfessionalReview[];
  summary: ReviewSummary;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

