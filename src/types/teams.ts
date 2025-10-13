// src/types/teams.ts

/**
 * Team Management Type Definitions for Massimino
 * Comprehensive type system for team creation, management, and interactions
 */

import { SafeUser } from './auth';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type TeamType = 'RESISTANCE' | 'CIRCUITS' | 'YOGA' | 'CARDIO' | 'ZUMBA' | 'CUSTOM';
export type TeamVisibility = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
export type MembershipStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | 'KICKED';
export type TeamMembershipStatus = MembershipStatus; // Alias for consistency
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'WORKOUT_LINK' | 'EXERCISE_MEDIA';
export type TeamMessageType = MessageType; // Alias for consistency
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

// Team size constraints
export const TEAM_CONSTRAINTS = {
  MIN_MEMBERS: 2, // Including trainer
  MAX_MEMBERS_PER_TEAM: 50,
  MAX_TEAMS_PER_TRAINER: 10,
} as const;

// ============================================================================
// CORE TEAM TYPES
// ============================================================================

/**
 * Team entity with all properties
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  type: TeamType;
  customTypeDescription?: string;

  // Trainer information
  trainerId: string;
  trainer?: SafeUser;

  // Team settings
  visibility: TeamVisibility;
  maxMembers: number;
  isActive: boolean;

  // Aesthetic customization
  aestheticSettings: TeamAestheticSettings;

  // Social features
  spotifyPlaylistUrl?: string;
  allowComments: boolean;
  allowMemberInvites: boolean;

  // Metadata
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  members?: TeamMember[];
  messages?: TeamMessage[];
  workoutLogs?: TeamWorkoutLog[];
}

/**
 * Team aesthetic customization options
 */
export interface TeamAestheticSettings {
  // Visual appearance
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  logoUrl?: string;
  bannerUrl?: string;

  // Typography
  fontStyle: 'modern' | 'classic' | 'sporty' | 'elegant';

  // Theme
  theme: 'light' | 'dark' | 'auto';

  // Custom CSS classes (for advanced customization)
  customClasses?: string[];

  // Optional animations used by UI
  animations?: {
    enableCardHover?: boolean;
    enableBannerWave?: boolean;
    enableSectionFade?: boolean;
  };
}

/**
 * Team membership with relationship details
 */
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;

  // Membership details
  status: MembershipStatus;
  joinedAt: Date;
  leftAt?: Date;
  invitedBy?: string;

  // Member permissions within team
  canInviteOthers: boolean;
  canComment: boolean;
  canViewAllWorkouts: boolean;

  // Relationships
  team?: Team;
  user?: SafeUser;
  inviter?: SafeUser;
}

/**
 * Team application for joining
 */
export interface TeamApplication {
  id: string;
  teamId: string;
  userId: string;

  // Application details
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;

  // Relationships
  team?: Team;
  user?: SafeUser;
  reviewer?: SafeUser;
}

// ============================================================================
// TEAM INVITATION TYPES
// ============================================================================

/**
 * Team invitation sent via email
 */
export interface TeamInvite {
  id: string;
  token: string;
  teamId: string;
  email: string;
  invitedBy: string;
  status: InviteStatus;
  message?: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  viewedAt?: Date;

  // Relationships
  team?: Team;
  inviter?: SafeUser;
}

/**
 * Request to send an email invitation
 */
export interface SendEmailInviteRequest {
  email: string;
  message?: string;
}

/**
 * Response after sending an email invitation
 */
export interface SendEmailInviteResponse {
  success: boolean;
  invite?: TeamInvite;
  error?: string;
}

// ============================================================================
// TEAM MESSAGING TYPES
// ============================================================================

/**
 * Team message for in-team communication
 */
export interface TeamMessage {
  id: string;
  teamId: string;
  userId: string;

  // Message content
  content: string;
  type: MessageType;
  mediaUrl?: string;
  thumbnailUrl?: string;

  // Exercise/workout linking
  linkedExerciseId?: string;
  linkedWorkoutLogId?: string;
  linkedSocialMediaUrl?: string;

  // Message metadata
  editedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;

  // Relationships
  team?: Team;
  user?: SafeUser;
  replies?: TeamMessageReply[];
}

/**
 * Reply to a team message
 */
export interface TeamMessageReply {
  id: string;
  messageId: string;
  userId: string;
  content: string;
  createdAt: Date;

  // Relationships
  message?: TeamMessage;
  user?: SafeUser;
}

// ============================================================================
// TEAM WORKOUT TYPES
// ============================================================================

/**
 * Team workout log (shared workout visible to all team members)
 */
export interface TeamWorkoutLog {
  id: string;
  teamId: string;
  createdBy: string;

  // Workout details
  title: string;
  description?: string;
  date: Date;
  duration?: number; // in minutes

  // Workout structure
  exercises: TeamWorkoutExercise[];

  // Visibility and interaction
  allowComments: boolean;
  isTemplate: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  team?: Team;
  creator?: SafeUser;
  comments?: TeamWorkoutComment[];
  completions?: TeamWorkoutCompletion[];
}

/**
 * Exercise within a team workout
 */
export interface TeamWorkoutExercise {
  id: string;
  workoutLogId: string;
  exerciseId: string;

  // Exercise details
  order: number;
  sets: number;
  reps: string; // Can be "12", "8-10", "AMRAP", etc.
  weight?: string;
  restSeconds?: number;
  notes?: string;

  // Social media linking
  instructionalVideoUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;

  // Relationships
  workoutLog?: TeamWorkoutLog;
  exercise?: any; // Reference to Exercise from workout types
}

/**
 * Comment on a team workout
 */
export interface TeamWorkoutComment {
  id: string;
  workoutLogId: string;
  userId: string;
  content: string;
  createdAt: Date;

  // Relationships
  workoutLog?: TeamWorkoutLog;
  user?: SafeUser;
}

/**
 * Member completion of a team workout
 */
export interface TeamWorkoutCompletion {
  id: string;
  workoutLogId: string;
  userId: string;
  completedAt: Date;
  duration?: number; // actual time taken
  notes?: string;

  // Relationships
  workoutLog?: TeamWorkoutLog;
  user?: SafeUser;
}

// ============================================================================
// TEAM MANAGEMENT TYPES
// ============================================================================

/**
 * Team creation form data
 */
export interface CreateTeamRequest {
  name: string;
  description?: string;
  type: TeamType;
  customTypeDescription?: string;
  visibility: TeamVisibility;
  maxMembers: number;
  aestheticSettings: Partial<TeamAestheticSettings>;
  spotifyPlaylistUrl?: string;
  allowComments: boolean;
  allowMemberInvites: boolean;
}

/**
 * Team update form data
 */
export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  visibility?: TeamVisibility;
  maxMembers?: number;
  aestheticSettings?: Partial<TeamAestheticSettings>;
  spotifyPlaylistUrl?: string;
  allowComments?: boolean;
  allowMemberInvites?: boolean;
  isActive?: boolean;
}

/**
 * Team invitation data
 */
export interface TeamInvitation {
  teamId: string;
  userId: string;
  personalMessage?: string;
  expiresAt?: Date;
}

/**
 * Team discovery filters for clients
 */
export interface TeamDiscoveryFilters {
  type?: TeamType[];
  trainerVerified?: boolean;
  hasSpots?: boolean; // Teams with available spots
  location?: {
    city?: string | undefined;
    state?: string | undefined;
    radius?: number | undefined; // in km
  } | undefined;
  searchQuery?: string;
}

// ============================================================================
// TEAM ANALYTICS TYPES
// ============================================================================

/**
 * Team analytics for trainers
 */
export interface TeamAnalytics {
  teamId: string;

  // Member engagement
  activeMembers: number;
  totalMembers: number;
  memberRetentionRate: number;
  averageEngagement: number;

  // Activity metrics
  totalWorkouts: number;
  totalMessages: number;
  totalComments: number;
  workoutsThisWeek: number;
  messagesThisWeek: number;

  // Growth metrics
  memberGrowthRate: number;
  newMembersThisMonth: number;
  membersLeftThisMonth: number;

  // Engagement by member
  memberEngagement: {
    userId: string;
    userName: string;
    workoutCompletions: number;
    messagesCount: number;
    lastActive: Date;
  }[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * API response for team operations
 */
export interface TeamApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated team list response
 */
export interface PaginatedTeamsResponse {
  teams: Team[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Team dashboard data for trainers
 */
export interface TrainerTeamDashboard {
  totalTeams: number;
  totalMembers: number;
  activeTeams: Team[];
  recentActivity: {
    type: 'new_member' | 'workout_completed' | 'message_sent' | 'application_received';
    teamId: string;
    teamName: string;
    memberName?: string;
    timestamp: Date;
  }[];
  upcomingEvents: {
    type: 'workout_scheduled' | 'challenge_deadline';
    teamId: string;
    teamName: string;
    title: string;
    date: Date;
  }[];
}

// ============================================================================
// UTILITY TYPES AND TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if user can manage team
 */
export const canManageTeam = (team: Team, userId: string): boolean => {
  return team.trainerId === userId;
};

/**
 * Type guard to check if user is team member
 */
export const isTeamMember = (team: Team, userId: string): boolean => {
  return team.members?.some(member =>
    member.userId === userId && member.status === 'ACTIVE'
  ) || false;
};

/**
 * Type guard to check if team has available spots
 */
export const hasAvailableSpots = (team: Team): boolean => {
  return team.memberCount < team.maxMembers;
};

/**
 * Type guard to check if team meets minimum member requirement
 */
export const meetsMinimumMembers = (team: Team): boolean => {
  return team.memberCount >= TEAM_CONSTRAINTS.MIN_MEMBERS;
};

/**
 * Default aesthetic settings for new teams
 */
export const DEFAULT_TEAM_AESTHETICS: TeamAestheticSettings = {
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  backgroundColor: '#F9FAFB',
  fontStyle: 'modern',
  theme: 'auto',
  animations: {
    enableCardHover: false,
    enableBannerWave: false,
    enableSectionFade: false,
  },
};

/**
 * Team validation rules
 */
export interface TeamValidationRules {
  name: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
  };
  description: {
    maxLength: number;
  };
  maxMembers: {
    min: number;
    max: number;
  };
}

export const TEAM_VALIDATION_RULES: TeamValidationRules = {
  name: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_]+$/,
  },
  description: {
    maxLength: 500,
  },
  maxMembers: {
    min: TEAM_CONSTRAINTS.MIN_MEMBERS,
    max: TEAM_CONSTRAINTS.MAX_MEMBERS_PER_TEAM,
  },
};
