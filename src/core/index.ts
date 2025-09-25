/**
 * Core Infrastructure Exports
 * Main entry point for all framework-level infrastructure code
 */

// Database functionality - will be available via database/index.ts
export * from './database';

// Authentication configuration
export { authOptions } from './auth/config';
export type { SafeUser } from './auth/providers';

// External integrations - will be available via integrations/index.ts
export * from './integrations';

// Socket server
export * from './socket/server';

// Utilities - will be available via utils/index.ts
export {
  UserRegistrationSchema,
  UserProfileUpdateSchema,
  TrainerProfileSchema,
  PostCreationSchema,
  CommentCreationSchema,
  DirectMessageSchema,
  CommunityCreationSchema,
  ReportSubmissionSchema,
  ModerationActionSchema,
  SearchSchema,
  PaginationSchema,
  ApiResponseSchema,
  FileUploadSchema,
  validateContentSafety,
  sanitizeTextInput,
  validateMentions,
  validateHashtags
} from './utils/validation';
export * from './utils/error-handling';
export * from './utils/workout-validation';