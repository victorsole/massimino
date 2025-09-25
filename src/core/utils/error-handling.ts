/**
 * Centralized Error Management for Massimino
 * Comprehensive error handling with safety-focused logging and user feedback
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// ============================================================================
// ERROR TYPE DEFINITIONS
// ============================================================================

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_BANNED = 'ACCOUNT_BANNED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Content Moderation
  CONTENT_BLOCKED = 'CONTENT_BLOCKED',
  CONTENT_FLAGGED = 'CONTENT_FLAGGED',
  MODERATION_ERROR = 'MODERATION_ERROR',
  SAFETY_VIOLATION = 'SAFETY_VIOLATION',
  
  // Resource Management
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // File Handling
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // External Services
  OPENAI_ERROR = 'OPENAI_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // General
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: any;
  userMessage?: string;
  shouldLog?: boolean;
  shouldNotifyUser?: boolean;
}

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp?: Date;
  additionalData?: Record<string, any>;
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Base application error class
 */
class BaseAppError extends Error implements AppError {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly userMessage?: string;
  public readonly shouldLog: boolean;
  public readonly shouldNotifyUser: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    options: {
      details?: any;
      userMessage?: string;
      shouldLog?: boolean;
      shouldNotifyUser?: boolean;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = options.details;
    this.userMessage = options.userMessage || message;
    this.shouldLog = options.shouldLog ?? true;
    this.shouldNotifyUser = options.shouldNotifyUser ?? false;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends BaseAppError {
  constructor(message: string, details?: any) {
    super(
      message,
      ErrorCode.VALIDATION_ERROR,
      400,
      {
        details,
        userMessage: 'Please check your input and try again.',
        shouldLog: false, // Don't log validation errors
      }
    );
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends BaseAppError {
  constructor(message: string, code: ErrorCode = ErrorCode.UNAUTHORIZED) {
    const statusCode = code === ErrorCode.FORBIDDEN ? 403 : 401;
    super(
      message,
      code,
      statusCode,
      {
        userMessage: 'Authentication required. Please sign in and try again.',
        shouldLog: true,
      }
    );
  }
}

/**
 * Content moderation error
 */
export class ModerationError extends BaseAppError {
  constructor(message: string, code: ErrorCode = ErrorCode.CONTENT_BLOCKED, details?: any) {
    super(
      message,
      code,
      400,
      {
        details,
        userMessage: 'Your content violates our community guidelines. Please review and modify your submission.',
        shouldLog: true,
        shouldNotifyUser: true,
      }
    );
  }
}

/**
 * Safety violation error (more serious than moderation)
 */
export class SafetyViolationError extends BaseAppError {
  constructor(message: string, details?: any) {
    super(
      message,
      ErrorCode.SAFETY_VIOLATION,
      403,
      {
        details,
        userMessage: 'This action violates our safety policies and has been blocked.',
        shouldLog: true,
        shouldNotifyUser: true,
      }
    );
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends BaseAppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier ${identifier} not found`
      : `${resource} not found`;
      
    super(
      message,
      ErrorCode.NOT_FOUND,
      404,
      {
        userMessage: 'The requested resource could not be found.',
        shouldLog: false,
      }
    );
  }
}

/**
 * Rate limiting error
 */
export class RateLimitError extends BaseAppError {
  constructor(limit: number, windowMs: number) {
    super(
      `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      {
        details: { limit, windowMs },
        userMessage: 'Too many requests. Please slow down and try again later.',
        shouldLog: true,
      }
    );
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends BaseAppError {
  constructor(service: string, message: string, details?: any) {
    super(
      `${service} error: ${message}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      503,
      {
        details: { service, ...details },
        userMessage: 'A service is temporarily unavailable. Please try again later.',
        shouldLog: true,
        shouldNotifyUser: true,
      }
    );
  }
}

// ============================================================================
// ERROR DETECTION AND TRANSFORMATION
// ============================================================================

/**
 * Convert unknown errors to standardized AppError format
 */
export function normalizeError(error: unknown, context?: ErrorContext): AppError {
  // Already an AppError
  if (error instanceof BaseAppError) {
    return error;
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    const issues = error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    
    return new ValidationError('Validation failed', { issues });
  }

  // Prisma database errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, context);
  }

  // Standard JavaScript errors
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
      return new ExternalServiceError('Network', error.message);
    }
    
    if (error.message.includes('OpenAI')) {
      return new ExternalServiceError('OpenAI', error.message, { originalError: error.message });
    }

    // Generic error conversion
    return new BaseAppError(
      error.message,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500,
      {
        details: { originalError: error.message, stack: error.stack },
        userMessage: 'An unexpected error occurred. Please try again.',
        shouldLog: true,
      }
    );
  }

  // Unknown error types
  return new BaseAppError(
    'Unknown error occurred',
    ErrorCode.UNKNOWN_ERROR,
    500,
    {
      details: { error: String(error) },
      userMessage: 'An unexpected error occurred. Please try again.',
      shouldLog: true,
    }
  );
}

/**
 * Handle Prisma database errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError, _context?: ErrorContext): AppError {
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      return new BaseAppError(
        `Duplicate entry for ${field}`,
        ErrorCode.CONSTRAINT_VIOLATION,
        409,
        {
          details: { field, constraint: 'unique' },
          userMessage: `This ${field} is already taken. Please choose another.`,
          shouldLog: false,
        }
      );

    case 'P2003': // Foreign key constraint violation
      return new BaseAppError(
        'Referenced record does not exist',
        ErrorCode.CONSTRAINT_VIOLATION,
        400,
        {
          details: { constraint: 'foreign_key' },
          userMessage: 'Invalid reference to another record.',
          shouldLog: true,
        }
      );

    case 'P2004': // Database constraint violation
      return new BaseAppError(
        'Database constraint violation',
        ErrorCode.CONSTRAINT_VIOLATION,
        400,
        {
          userMessage: 'The operation violates database constraints.',
          shouldLog: true,
        }
      );

    case 'P2025': // Record not found
      return new NotFoundError('Record');

    case 'P1001': // Can't reach database server
    case 'P1002': // Database server timeout
      return new BaseAppError(
        'Database connection error',
        ErrorCode.CONNECTION_ERROR,
        503,
        {
          userMessage: 'Database is temporarily unavailable. Please try again later.',
          shouldLog: true,
          shouldNotifyUser: true,
        }
      );

    default:
      return new BaseAppError(
        'Database error',
        ErrorCode.DATABASE_ERROR,
        500,
        {
          details: { prismaCode: error.code, prismaMessage: error.message },
          userMessage: 'A database error occurred. Please try again.',
          shouldLog: true,
        }
      );
  }
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

interface LogEntry {
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  code: ErrorCode;
  statusCode: number;
  context?: ErrorContext;
  stack?: string;
  details?: any;
}

/**
 * Log errors with appropriate level and detail
 */
export function logError(error: AppError, context?: ErrorContext): void {
  if (!error.shouldLog) return;

  const logEntry: LogEntry = {
    timestamp: new Date(),
    level: getLogLevel(error),
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details,
  };

  if (context) {
    logEntry.context = context;
  }

  if (error.stack) {
    logEntry.stack = error.stack;
  }

  // Log to console (in production, this would go to a logging service)
  switch (logEntry.level) {
    case 'error':
      console.error('🚨 Application Error:', logEntry);
      break;
    case 'warn':
      console.warn('⚠️ Application Warning:', logEntry);
      break;
    case 'info':
      console.info('ℹ️ Application Info:', logEntry);
      break;
  }

  // In production, also send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    sendToMonitoringService(logEntry);
  }
}

/**
 * Determine appropriate log level based on error
 */
function getLogLevel(error: AppError): 'error' | 'warn' | 'info' {
  if (error.statusCode >= 500) return 'error';
  if (error.statusCode >= 400) return 'warn';
  return 'info';
}

/**
 * Send error to monitoring service (placeholder)
 */
function sendToMonitoringService(logEntry: LogEntry): void {
  // In production, this would send to Sentry, DataDog, etc.
  // For now, just a placeholder
  if (process.env.SENTRY_DSN && logEntry.level === 'error') {
    // Sentry integration would go here
    console.log('📊 Would send to monitoring service:', {
      message: logEntry.message,
      code: logEntry.code,
      userId: logEntry.context?.userId,
    });
  }
}

// ============================================================================
// ERROR RESPONSE HELPERS
// ============================================================================

/**
 * Create standardized error response for API endpoints
 */
export function createErrorResponse(error: AppError, context?: ErrorContext): NextResponse {
  // Log the error
  logError(error, context);

  // Create safe response for user
  const responseBody = {
    success: false,
    error: {
      code: error.code,
      message: error.userMessage || error.message,
      ...(process.env.NODE_ENV === 'development' && {
        details: error.details,
        stack: error.stack,
      }),
    },
    ...(context?.requestId && { requestId: context.requestId }),
  };

  return NextResponse.json(responseBody, { 
    status: error.statusCode,
    headers: {
      'X-Error-Code': error.code,
      'X-Request-ID': context?.requestId || 'unknown',
    },
  });
}

/**
 * Create success response
 */
export function createSuccessResponse(
  data: any,
  options: {
    message?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    requestId?: string;
  } = {}
): NextResponse {
  const responseBody = {
    success: true,
    data,
    ...(options.message && { message: options.message }),
    ...(options.pagination && { pagination: options.pagination }),
    ...(options.requestId && { requestId: options.requestId }),
  };

  return NextResponse.json(responseBody);
}

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Async error wrapper for API routes
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      const context: ErrorContext = {
        timestamp: new Date(),
        // Additional context would be extracted from request if available
      };
      
      const normalizedError = normalizeError(error, context);
      return createErrorResponse(normalizedError, context);
    }
  };
}

/**
 * Try-catch wrapper with error normalization
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const normalizedError = normalizeError(error, context);
    logError(normalizedError, context);
    return { error: normalizedError };
  }
}

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

/**
 * Get user-friendly error message for common scenarios
 */
export function getFriendlyErrorMessage(code: ErrorCode, _context?: any): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.UNAUTHORIZED]: 'Please sign in to continue.',
    [ErrorCode.FORBIDDEN]: 'You don\'t have permission to perform this action.',
    [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
    [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
    [ErrorCode.ACCOUNT_SUSPENDED]: 'Your account has been temporarily suspended. Contact support for assistance.',
    [ErrorCode.ACCOUNT_BANNED]: 'Your account has been permanently banned.',
    
    [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ErrorCode.INVALID_INPUT]: 'Some information you provided is not valid.',
    [ErrorCode.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
    
    [ErrorCode.CONTENT_BLOCKED]: 'Your content violates our community guidelines and has been blocked.',
    [ErrorCode.CONTENT_FLAGGED]: 'Your content has been flagged for review.',
    [ErrorCode.MODERATION_ERROR]: 'Unable to process your content. Please try again.',
    [ErrorCode.SAFETY_VIOLATION]: 'This action violates our safety policies.',
    
    [ErrorCode.NOT_FOUND]: 'The requested resource could not be found.',
    [ErrorCode.RESOURCE_EXISTS]: 'This resource already exists.',
    [ErrorCode.RESOURCE_LIMIT_EXCEEDED]: 'You have reached your limit for this resource.',
    
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please slow down and try again.',
    [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests. Please wait before trying again.',
    
    [ErrorCode.FILE_TOO_LARGE]: 'The file you uploaded is too large.',
    [ErrorCode.INVALID_FILE_TYPE]: 'This file type is not supported.',
    [ErrorCode.UPLOAD_FAILED]: 'File upload failed. Please try again.',
    
    [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again.',
    [ErrorCode.CONSTRAINT_VIOLATION]: 'This action would violate data constraints.',
    [ErrorCode.CONNECTION_ERROR]: 'Unable to connect to the database.',
    
    [ErrorCode.OPENAI_ERROR]: 'Content moderation service is temporarily unavailable.',
    [ErrorCode.EMAIL_SERVICE_ERROR]: 'Unable to send email at this time.',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'An external service is temporarily unavailable.',
    
    [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred. Please try again.',
    [ErrorCode.BAD_REQUEST]: 'Invalid request. Please check your input.',
    [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred. Please try again.',
  };

  return messages[code] || 'An error occurred. Please try again.';
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export {
  BaseAppError,
};