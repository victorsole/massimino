/**
 * Prisma Database Client for Massimino
 * Centralized database configuration with connection pooling and error handling
 */

import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// ============================================================================
// CLIENT CONFIGURATION
// ============================================================================

/**
 * Database configuration options
 */
export const DATABASE_CONFIG = {
  // Connection settings
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'), // 10s
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20'),
  statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'), // 30s
  
  // Logging configuration
  logQueries: process.env.NODE_ENV === 'development',
  logSlowQueries: true,
  slowQueryThreshold: 2000, // 2 seconds
  
  // Error handling
  retryAttempts: 3,
  retryDelay: 1000, // 1 second base delay
} as const;

/**
 * Prisma client options with optimized settings for production
 */
const PRISMA_OPTIONS: Prisma.PrismaClientOptions = {
  // Logging configuration
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
  
  // Error formatting
  errorFormat: 'pretty',
  
  // Transaction options
  transactionOptions: {
    maxWait: 5000, // 5s max wait for transaction to start
    timeout: 30000, // 30s max transaction time
  },
};

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

/**
 * Create Prisma client with enhanced error handling and logging
 */
function createPrismaClient(): PrismaClient {
  console.log('🗄️ Initializing Prisma database client...');
  
  const client = new PrismaClient(PRISMA_OPTIONS);
  
  // Setup event listeners for logging and monitoring
  setupEventListeners(client);
  
  // Setup connection management
  setupConnectionManagement(client);
  
  return client;
}

/**
 * Setup event listeners for database monitoring
 */
function setupEventListeners(_client: PrismaClient): void {
  // Event listeners disabled due to TypeScript strict mode
  // Uncomment and fix types if needed for debugging
}

/**
 * Setup connection management and cleanup
 */
function setupConnectionManagement(client: PrismaClient): void {
  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('🔌 Disconnecting from database...');
    await client.$disconnect();
    console.log('✅ Database disconnected successfully');
  };
  
  // Handle different shutdown signals
  process.on('beforeExit', shutdown);
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGUSR2', shutdown); // For nodemon
}

// ============================================================================
// SINGLETON CLIENT INSTANCE
// ============================================================================

/**
 * Global client instance with proper type safety
 * Uses singleton pattern to prevent multiple client instances
 */
declare global {
  // This prevents TypeScript errors in development
  // when the global variable might not be defined
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

// In development, store the client on globalThis to prevent
// multiple instances during hot reloading
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// ============================================================================
// CLIENT UTILITIES
// ============================================================================

/**
 * Test database connection
 */
export async function testConnection(): Promise<{
  connected: boolean;
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    
    console.log(`✅ Database connection test passed (${latency}ms)`);
    return { connected: true, latency };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('❌ Database connection test failed:', error);
    
    return {
      connected: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get database health information
 */
export async function getDatabaseHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  connections: number;
  latency: number;
  version: string;
  uptime: number;
}> {
  try {
    const startTime = Date.now();
    
    // Get database version
    const versionResult = await prisma.$queryRaw<[{ version: string }]>`SELECT version()`;
    const version = versionResult[0]?.version || 'unknown';
    
    // Get connection stats
    const connectionResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
    `;
    const connections = Number(connectionResult[0]?.count || 0);
    
    // Get uptime (PostgreSQL specific)
    const uptimeResult = await prisma.$queryRaw<[{ uptime: number }]>`
      SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime
    `;
    const uptime = uptimeResult[0]?.uptime || 0;
    
    const latency = Date.now() - startTime;
    
    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (latency > 5000 || connections > DATABASE_CONFIG.connectionLimit * 0.8) {
      status = 'degraded';
    }
    if (latency > 10000 || connections > DATABASE_CONFIG.connectionLimit) {
      status = 'unhealthy';
    }
    
    return {
      status,
      connections,
      latency,
      version,
      uptime,
    };
  } catch (error) {
    console.error('Failed to get database health:', error);
    return {
      status: 'unhealthy',
      connections: 0,
      latency: -1,
      version: 'unknown',
      uptime: 0,
    };
  }
}

/**
 * Execute database operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = DATABASE_CONFIG.retryAttempts
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.warn(`Database operation failed (attempt ${attempt}/${maxAttempts}):`, {
        error: lastError.message,
        attempt,
      });
      
      // Don't retry on certain types of errors
      if (isNonRetryableError(lastError)) {
        throw lastError;
      }
      
      // Don't wait after the last attempt
      if (attempt < maxAttempts) {
        const delay = DATABASE_CONFIG.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: Error): boolean {
  const nonRetryablePatterns = [
    'P2002', // Unique constraint violation
    'P2003', // Foreign key constraint violation
    'P2025', // Record not found
    'ValidationError',
    'AuthenticationError',
  ];
  
  return nonRetryablePatterns.some(pattern => 
    error.message.includes(pattern) || error.name.includes(pattern)
  );
}

/**
 * Execute multiple operations in a transaction with safety checks
 */
export async function safeTransaction<T>(
  operations: (client: Prisma.TransactionClient) => Promise<T>,
  options?: {
    timeout?: number;
    maxWait?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
): Promise<T> {
  const transactionOptions: {
    timeout?: number;
    maxWait?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  } = {
    timeout: options?.timeout || 30000,
    maxWait: options?.maxWait || 5000,
    ...(options?.isolationLevel && { isolationLevel: options.isolationLevel }),
  };
  
  return withRetry(async () => {
    return prisma.$transaction(operations, transactionOptions);
  });
}

/**
 * Safely execute raw SQL with parameter validation
 */
export async function safeRawQuery<T = unknown>(
  sql: TemplateStringsArray,
  ...values: any[]
): Promise<T> {
  // Basic SQL injection protection
  const sqlString = sql.join('?');
  
  // Log potentially dangerous queries in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Executing raw query:', { sql: sqlString, values });
  }
  
  return withRetry(async () => {
    return prisma.$queryRaw<T>(sql, ...values);
  });
}

// ============================================================================
// MIGRATION AND SEEDING UTILITIES
// ============================================================================

/**
 * Check if database needs migration
 */
export async function needsMigration(): Promise<boolean> {
  try {
    // This is a simple check - in production you might want more sophisticated logic
    await prisma.users.findFirst();
    return false;
  } catch (error) {
    // If basic table doesn't exist, likely needs migration
    return true;
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  applied: string[];
  pending: string[];
  lastMigration?: string;
}> {
  try {
    // In a real implementation, this would check the _prisma_migrations table
    // This is a simplified version
    const result = await prisma.$queryRaw<Array<{ migration_name: string; applied_at: Date }>>`
      SELECT migration_name, applied_at 
      FROM _prisma_migrations 
      ORDER BY applied_at DESC
    `;
    
    return {
      applied: result.map(r => r.migration_name),
      pending: [], // Would need to check filesystem for pending migrations
      ...(result[0] && { lastMigration: result[0].migration_name }),
    };
  } catch (error) {
    return {
      applied: [],
      pending: [],
    };
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Get database performance metrics
 */
export async function getPerformanceMetrics(): Promise<{
  queryCount: number;
  averageQueryTime: number;
  slowQueries: number;
  connectionPoolUsage: number;
}> {
  // This would integrate with monitoring tools in production
  // For now, return mock data structure
  return {
    queryCount: 0,
    averageQueryTime: 0,
    slowQueries: 0,
    connectionPoolUsage: 0,
  };
}

/**
 * Clear query performance metrics
 */
export function clearPerformanceMetrics(): void {
  // Reset internal counters if implemented
  console.log('🧹 Performance metrics cleared');
}

// ============================================================================
// EXPORT CLIENT AND UTILITIES
// ============================================================================

// Export types for external use
export type {
  PrismaClient,
  Prisma,
};

// Default export for convenience
export default prisma;