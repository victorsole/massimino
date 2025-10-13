/**
 * Payment Types for Trainer Business Features
 * Comprehensive type definitions for trainer payment functionality
 */

// ============================================================================
// CORE PAYMENT TYPES
// ============================================================================

export interface TrainerSubscription {
  id: string;
  trainerId: string;
  name: string;
  description?: string;
  price: number; // in cents
  interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'DRAFT';
  activeSubscribers: number;
  totalRevenue: number;
  mollieProductId?: string;
  molliePriceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageDeal {
  id: string;
  trainerId: string;
  name: string;
  description?: string;
  price: number; // in cents
  sessionsIncluded: number;
  validityDays: number;
  features: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  totalSold: number;
  totalRevenue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainerEarning {
  id: string;
  trainerId: string;
  amount: number; // in cents
  type: 'SESSION' | 'PACKAGE' | 'SUBSCRIPTION' | 'BONUS' | 'REFERRAL';
  sourceId: string;
  clientId: string;
  platformFee: number;
  netEarnings: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'DISPUTED' | 'CANCELLED';
  payoutDate?: Date;
  payoutId?: string;
  description?: string;
  earnedAt: Date;
  createdAt: Date;
}

export interface ClientPayment {
  id: string;
  trainerId: string;
  clientId: string;
  clientName: string;
  amount: number; // in cents
  description: string;
  type: 'SESSION' | 'PACKAGE' | 'SUBSCRIPTION' | 'CUSTOM' | 'LATE_FEE' | 'CANCELLATION_FEE';
  relatedId?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'CANCELLED';
  dueDate?: Date;
  paidAt?: Date;
  molliePaymentId?: string;
  mollieCustomerId?: string;
  paymentUrl?: string;
  refundAmount: number;
  refundReason?: string;
  refundedAt?: Date;
  metadata?: Record<string, any>;
  reminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreateSubscriptionRequest {
  name: string;
  description?: string;
  price: number; // in cents
  interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  features: string[];
}

export interface CreatePackageRequest {
  name: string;
  description?: string;
  price: number; // in cents
  sessionsIncluded: number;
  validityDays: number;
  features: string[];
}

export interface CreatePaymentRequest {
  clientId: string;
  amount: number; // in cents
  description: string;
  type: 'SESSION' | 'PACKAGE' | 'SUBSCRIPTION' | 'CUSTOM';
  relatedId?: string;
  dueDate?: Date;
  redirectUrl: string;
  webhookUrl?: string;
}

// ============================================================================
// ANALYTICS & METRICS
// ============================================================================

export interface RevenueMetrics {
  totalRevenue: number;
  netEarnings: number;
  commission: number;
  sessionsRevenue: number;
  packagesRevenue: number;
  subscriptionsRevenue: number;
  previousPeriodRevenue: number;
  growth: number;
  averageSessionPrice: number;
  totalSessions: number;
  totalPackagesSold: number;
  activeSubscriptions: number;
}

export interface PaymentAnalytics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  averagePaymentAmount: number;
  paymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    payments: number;
  }>;
  clientAnalytics: Array<{
    clientId: string;
    clientName: string;
    totalPaid: number;
    sessionsCount: number;
    lastPayment: Date;
  }>;
}

export interface SubscriptionAnalytics {
  active: number;
  paused: number;
  cancelled: number;
  expired: number;
  revenue: number;
  averageLifetime: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
}

export interface PackageAnalytics {
  totalPackages: number;
  totalSold: number;
  revenue: number;
  averagePrice: number;
  popularPackages: Array<{
    id: string;
    name: string;
    sold: number;
    revenue: number;
  }>;
  salesByMonth: Array<{
    month: string;
    sold: number;
    revenue: number;
  }>;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const SUBSCRIPTION_VALIDATION_RULES = {
  name: {
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_&().]+$/
  },
  description: {
    maxLength: 500
  },
  price: {
    min: 500, // €5.00
    max: 50000 // €500.00
  },
  features: {
    maxItems: 10,
    maxLength: 100
  }
} as const;

export const PACKAGE_VALIDATION_RULES = {
  name: {
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_&().]+$/
  },
  description: {
    maxLength: 500
  },
  price: {
    min: 1000, // €10.00
    max: 500000 // €5000.00
  },
  sessions: {
    min: 1,
    max: 100
  },
  validityDays: {
    min: 7,
    max: 365
  },
  features: {
    maxItems: 10,
    maxLength: 100
  }
} as const;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PaymentInterval = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'CANCELLED';

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED' | 'TRIAL';

export type EarningType = 'SESSION' | 'PACKAGE' | 'SUBSCRIPTION' | 'BONUS' | 'REFERRAL';

export type ClientPaymentType = 'SESSION' | 'PACKAGE' | 'SUBSCRIPTION' | 'CUSTOM' | 'LATE_FEE' | 'CANCELLATION_FEE';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaymentResponse {
  success: boolean;
  data?: {
    paymentUrl: string;
    paymentId: string;
  };
  error?: string;
}

export interface DashboardData {
  revenueMetrics: RevenueMetrics;
  paymentAnalytics: PaymentAnalytics;
  subscriptions: TrainerSubscription[];
  packages: PackageDeal[];
  period: string;
}

export interface PaymentHistoryResponse {
  payments: ClientPayment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface EarningsResponse {
  earnings: TrainerEarning[];
  revenue: RevenueMetrics;
  period: string;
}

