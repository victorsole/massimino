/**
 * Input Validation Schemas for Massimino
 * Comprehensive validation with safety-first approach using Zod
 */

import { z } from 'zod';
import { UserRole, ViolationType, ModerationAction as PrismaModerationAction } from '@prisma/client';

// ============================================================================
// BASIC VALIDATION HELPERS
// ============================================================================

/**
 * Common validation patterns and constraints
 */
export const ValidationPatterns = {
  // Text content validation
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,15}$/,
  URL: /^https?:\/\/[^\s$.?#].[^\s]*$/,
  
  // Fitness-specific patterns
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  HASHTAG: /^#[a-zA-Z0-9_]{1,30}$/,
  MENTION: /^@[a-zA-Z0-9_]{1,20}$/,
  
  // Safety patterns (things to watch for)
  SUSPICIOUS_CONTACT: /(\b(call|text|dm|message)\s+me\b|@gmail\.com|\d{3}[-.]?\d{3}[-.]?\d{4})/i,
  EXTERNAL_LINKS: /\b(?:bit\.ly|tinyurl|t\.co|goo\.gl|short\.link)\b/i,
  CRYPTOCURRENCY: /\b(bitcoin|btc|ethereum|eth|crypto|NFT|blockchain)\b/i,
} as const;

/**
 * Content length constraints
 */
export const ContentLimits = {
  POST_TITLE: { min: 1, max: 200 },
  POST_CONTENT: { min: 1, max: 5000 },
  COMMENT: { min: 1, max: 1000 },
  MESSAGE: { min: 1, max: 2000 },
  BIO: { min: 0, max: 500 },
  USERNAME: { min: 3, max: 20 },
  NAME: { min: 1, max: 50 },
  EMAIL: { min: 5, max: 100 },
} as const;

// ============================================================================
// USER VALIDATION SCHEMAS
// ============================================================================

/**
 * User registration validation
 */
export const UserRegistrationSchema = z.object({
  name: z.string()
    .min(ContentLimits.NAME.min, 'Name is required')
    .max(ContentLimits.NAME.max, 'Name is too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters')
    .transform(str => str.trim()),
  
  email: z.string()
    .min(ContentLimits.EMAIL.min, 'Email is required')
    .max(ContentLimits.EMAIL.max, 'Email is too long')
    .email('Invalid email format')
    .toLowerCase(),
  
  role: z.nativeEnum(UserRole).default(UserRole.CLIENT),
  
  // Safety agreement
  agreeToGuidelines: z.boolean()
    .refine(val => val === true, 'You must agree to the community guidelines'),
  
  agreeToTerms: z.boolean()
    .refine(val => val === true, 'You must agree to the terms of service'),
  
  // Optional fields
  profileImage: z.string().url('Invalid image URL').optional(),
  timezone: z.string().optional(),
});

/**
 * User profile update validation
 */
export const UserProfileUpdateSchema = z.object({
  name: z.string()
    .min(ContentLimits.NAME.min)
    .max(ContentLimits.NAME.max)
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters')
    .transform(str => str.trim())
    .optional(),
  
  bio: z.string()
    .max(ContentLimits.BIO.max, 'Bio is too long')
    .transform(str => str.trim())
    .optional(),
  
  profileImage: z.string().url('Invalid image URL').optional(),
  
  // Privacy settings
  profileVisibility: z.enum(['PUBLIC', 'PRIVATE', 'TRAINERS_ONLY']).optional(),
  showRealName: z.boolean().optional(),
  acceptDMs: z.boolean().optional(),
  onlyTrainerDMs: z.boolean().optional(),
});

/**
 * Trainer profile validation
 */
export const TrainerProfileSchema = z.object({
  bio: z.string()
    .min(50, 'Trainer bio must be at least 50 characters')
    .max(ContentLimits.BIO.max, 'Bio is too long')
    .transform(str => str.trim()),
  
  specializations: z.array(z.string())
    .min(1, 'At least one specialization is required')
    .max(10, 'Maximum 10 specializations allowed')
    .refine(
      arr => arr.every(spec => spec.length >= 3 && spec.length <= 50),
      'Each specialization must be 3-50 characters'
    ),
  
  certifications: z.array(z.object({
    name: z.string().min(1, 'Certification name is required'),
    organization: z.string().min(1, 'Organization is required'),
    date: z.string().datetime('Invalid certification date'),
    expirationDate: z.string().datetime().optional(),
    credentialUrl: z.string().url().optional(),
  })).min(1, 'At least one certification is required'),
  
  yearsExperience: z.number()
    .min(0, 'Years of experience cannot be negative')
    .max(50, 'Years of experience seems unrealistic'),
  
  hourlyRate: z.number()
    .min(10, 'Minimum hourly rate is $10')
    .max(500, 'Maximum hourly rate is $500')
    .optional(),
});

// ============================================================================
// CONTENT VALIDATION SCHEMAS
// ============================================================================

/**
 * Post creation validation
 */
export const PostCreationSchema = z.object({
  title: z.string()
    .min(ContentLimits.POST_TITLE.min, 'Title is required')
    .max(ContentLimits.POST_TITLE.max, 'Title is too long')
    .transform(str => str.trim())
    .refine(
      str => !ValidationPatterns.SUSPICIOUS_CONTACT.test(str),
      'Title contains potentially inappropriate contact information'
    ),
  
  content: z.string()
    .min(ContentLimits.POST_CONTENT.min, 'Content is required')
    .max(ContentLimits.POST_CONTENT.max, 'Content is too long')
    .transform(str => str.trim())
    .refine(
      str => str.split('\n').length <= 100,
      'Too many line breaks in content'
    ),
  
  communityId: z.string().uuid('Invalid community ID').optional(),
  
  tags: z.array(z.string().regex(ValidationPatterns.HASHTAG))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  
  attachments: z.array(z.object({
    type: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']),
    url: z.string().url('Invalid attachment URL'),
    name: z.string().min(1).max(100),
    size: z.number().max(50 * 1024 * 1024), // 50MB max
  })).max(5, 'Maximum 5 attachments allowed').optional(),
});

/**
 * Comment creation validation
 */
export const CommentCreationSchema = z.object({
  content: z.string()
    .min(ContentLimits.COMMENT.min, 'Comment cannot be empty')
    .max(ContentLimits.COMMENT.max, 'Comment is too long')
    .transform(str => str.trim())
    .refine(
      str => !ValidationPatterns.SUSPICIOUS_CONTACT.test(str),
      'Comment contains potentially inappropriate contact information'
    ),
  
  postId: z.string().uuid('Invalid post ID'),
  
  parentId: z.string().uuid('Invalid parent comment ID').optional(),
});

/**
 * Direct message validation
 */
export const DirectMessageSchema = z.object({
  content: z.string()
    .min(ContentLimits.MESSAGE.min, 'Message cannot be empty')
    .max(ContentLimits.MESSAGE.max, 'Message is too long')
    .transform(str => str.trim()),
  
  recipientId: z.string().uuid('Invalid recipient ID'),
  
  attachments: z.array(z.object({
    type: z.enum(['IMAGE', 'DOCUMENT']),
    url: z.string().url(),
    name: z.string().min(1).max(100),
  })).max(3, 'Maximum 3 attachments allowed').optional(),
});

/**
 * Community creation validation
 */
export const CommunityCreationSchema = z.object({
  name: z.string()
    .min(3, 'Community name must be at least 3 characters')
    .max(50, 'Community name is too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Community name contains invalid characters')
    .transform(str => str.trim()),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description is too long')
    .transform(str => str.trim()),
  
  type: z.enum(['PUBLIC', 'PRIVATE', 'TRAINER']),
  
  rules: z.array(z.string().min(5).max(200))
    .max(10, 'Maximum 10 community rules allowed')
    .optional(),
  
  category: z.enum([
    'GENERAL_FITNESS', 'STRENGTH_TRAINING', 'CARDIO', 'YOGA', 
    'NUTRITION', 'WEIGHT_LOSS', 'MUSCLE_BUILDING', 'ENDURANCE',
    'BEGINNERS', 'ADVANCED', 'WOMENS_FITNESS', 'MENS_FITNESS'
  ]),
});

// ============================================================================
// MODERATION VALIDATION SCHEMAS
// ============================================================================

/**
 * Report submission validation
 */
export const ReportSubmissionSchema = z.object({
  reportedUserId: z.string().uuid('Invalid user ID'),
  
  category: z.nativeEnum(ViolationType),
  
  description: z.string()
    .min(10, 'Please provide a detailed description')
    .max(1000, 'Description is too long')
    .transform(str => str.trim()),
  
  evidence: z.object({
    screenshots: z.array(z.string().url()).max(5).optional(),
    messageIds: z.array(z.string().uuid()).max(10).optional(),
    additionalContext: z.string().max(500).optional(),
  }).optional(),
  
  contentId: z.string().uuid().optional(),
  contentType: z.enum(['POST', 'COMMENT', 'MESSAGE', 'PROFILE']).optional(),
});

/**
 * Moderation action validation
 */
export const ModerationActionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  
  action: z.nativeEnum(PrismaModerationAction),
  
  reason: z.string()
    .min(10, 'Please provide a detailed reason')
    .max(500, 'Reason is too long')
    .transform(str => str.trim()),
  
  duration: z.number()
    .min(1, 'Duration must be positive')
    .max(8760, 'Maximum duration is 1 year (8760 hours)')
    .optional(),
  
  severity: z.number().min(1).max(5),
  
  violationType: z.nativeEnum(ViolationType),
  
  evidence: z.object({
    contentId: z.string().uuid().optional(),
    screenshots: z.array(z.string().url()).optional(),
    moderationLogId: z.string().uuid().optional(),
  }).optional(),
});

// ============================================================================
// SEARCH AND FILTERING SCHEMAS
// ============================================================================

/**
 * Search validation
 */
export const SearchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query is too long')
    .transform(str => str.trim()),
  
  type: z.enum(['POSTS', 'USERS', 'COMMUNITIES', 'ALL']).default('ALL'),
  
  filters: z.object({
    category: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    userRole: z.nativeEnum(UserRole).optional(),
  }).optional(),
  
  page: z.number().min(1).max(100).default(1),
  limit: z.number().min(1).max(100).default(20),
});

/**
 * Pagination validation
 */
export const PaginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Maximum limit is 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// API REQUEST VALIDATION
// ============================================================================

/**
 * Generic API response validation
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
});

/**
 * File upload validation
 */
export const FileUploadSchema = z.object({
  file: z.object({
    name: z.string().min(1, 'Filename is required'),
    size: z.number()
      .min(1, 'File cannot be empty')
      .max(50 * 1024 * 1024, 'File too large (max 50MB)'),
    type: z.string().refine(
      type => [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm',
        'application/pdf', 'text/plain'
      ].includes(type),
      'File type not allowed'
    ),
  }),
  
  category: z.enum(['PROFILE_IMAGE', 'POST_ATTACHMENT', 'MESSAGE_ATTACHMENT', 'CERTIFICATE']),
  
  alt: z.string().max(200, 'Alt text too long').optional(),
});

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate content for safety issues
 */
export function validateContentSafety(content: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for suspicious contact patterns
  if (ValidationPatterns.SUSPICIOUS_CONTACT.test(content)) {
    issues.push('Content contains potential contact information sharing');
    suggestions.push('Avoid sharing personal contact details in public posts');
  }

  // Check for external links
  if (ValidationPatterns.EXTERNAL_LINKS.test(content)) {
    issues.push('Content contains potentially unsafe shortened links');
    suggestions.push('Use full URLs instead of shortened links for transparency');
  }

  // Check for off-topic content
  if (ValidationPatterns.CRYPTOCURRENCY.test(content)) {
    issues.push('Content may be off-topic for fitness platform');
    suggestions.push('Keep discussions focused on fitness, health, and wellness');
  }

  // Check content length and quality
  if (content.length < 10) {
    issues.push('Content is very short');
    suggestions.push('Provide more detailed information to help the community');
  }

  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) {
    issues.push('Excessive use of capital letters');
    suggestions.push('Use normal capitalization for better readability');
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * Clean and sanitize text input
 */
export function sanitizeTextInput(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n{3,}/g, '\n\n') // Replace excessive line breaks
    .replace(/[^\w\s\-_.,:;!?@#()[\]{}'"]/g, '') // Remove special characters except common ones
    .substring(0, 5000); // Truncate to max length
}

/**
 * Extract and validate mentions
 */
export function validateMentions(content: string): {
  mentions: string[];
  isValid: boolean;
  errors: string[];
} {
  const mentionMatches = content.match(/@(\w+)/g) || [];
  const mentions = mentionMatches.map(m => m.substring(1));
  const errors: string[] = [];

  if (mentions.length > 10) {
    errors.push('Too many mentions (maximum 10 allowed)');
  }

  mentions.forEach(mention => {
    if (!ValidationPatterns.USERNAME.test(mention)) {
      errors.push(`Invalid username format: @${mention}`);
    }
  });

  return {
    mentions,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate hashtags
 */
export function validateHashtags(content: string): {
  hashtags: string[];
  isValid: boolean;
  errors: string[];
} {
  const hashtagMatches = content.match(/#(\w+)/g) || [];
  const hashtags = hashtagMatches.map(h => h.toLowerCase());
  const errors: string[] = [];

  if (hashtags.length > 20) {
    errors.push('Too many hashtags (maximum 20 allowed)');
  }

  hashtags.forEach(hashtag => {
    if (hashtag.length < 2) {
      errors.push(`Hashtag too short: ${hashtag}`);
    }
    if (hashtag.length > 30) {
      errors.push(`Hashtag too long: ${hashtag}`);
    }
  });

  return {
    hashtags,
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

// Type exports for TypeScript
export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;
export type TrainerProfile = z.infer<typeof TrainerProfileSchema>;
export type PostCreation = z.infer<typeof PostCreationSchema>;
export type CommentCreation = z.infer<typeof CommentCreationSchema>;
export type DirectMessage = z.infer<typeof DirectMessageSchema>;
export type CommunityCreation = z.infer<typeof CommunityCreationSchema>;
export type ReportSubmission = z.infer<typeof ReportSubmissionSchema>;
export type ModerationAction = z.infer<typeof ModerationActionSchema>;
export type SearchParams = z.infer<typeof SearchSchema>;
export type PaginationParams = z.infer<typeof PaginationSchema>;