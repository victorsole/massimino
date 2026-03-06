/**
 * Trainer Payment Service
 * Real implementation backed by Prisma + Stripe Connect
 */

import { prisma } from '@/core/database';
import {
  TrainerSubscription, PackageDeal, TrainerEarning, ClientPayment,
  CreateSubscriptionRequest, CreatePackageRequest, PaymentAnalytics,
  RevenueMetrics, SUBSCRIPTION_VALIDATION_RULES, PACKAGE_VALIDATION_RULES
} from '@/types/payments';
import {
  createCheckoutSession,
  createProduct,
  createPrice,
  createSubscriptionCheckout,
  cancelStripeSubscription,
  createRefund,
  getAccountBalance,
  isAccountReady,
  getAccount,
} from '@/core/integrations/stripe';
import { randomUUID } from 'crypto';

// ============================================================================
// HELPERS
// ============================================================================

const PLATFORM_FEE_RATE = 0.15; // 15%
const MAX_SUBSCRIPTIONS_PER_TRAINER = 10;
const MAX_PACKAGES_PER_TRAINER = 20;

function calculateCommission(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_RATE);
}

function periodToDateRange(period: string): { from: Date; to: Date } {
  const now = new Date();
  const to = now;
  let from: Date;

  switch (period) {
    case 'week':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case 'year':
      from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case 'month':
    default:
      from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
  }

  return { from, to };
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

export class TrainerSubscriptionService {
  static async createTrainerSubscription(trainerId: string, data: CreateSubscriptionRequest): Promise<TrainerSubscription> {
    const id = randomUUID();

    // Get trainer's Stripe account to create product+price on their account
    const profile = await prisma.trainer_profiles.findUnique({ where: { userId: trainerId } });
    let stripeProductId: string | null = null;
    let stripePriceId: string | null = null;

    if (profile?.businessAddress && typeof profile.businessAddress === 'object') {
      const stripeAccountId = (profile.businessAddress as any).stripeAccountId;
      if (stripeAccountId) {
        const product = await createProduct({
          name: data.name,
          description: data.description,
          trainerStripeAccountId: stripeAccountId,
          metadata: { trainerId, subscriptionId: id },
        });
        const price = await createPrice({
          productId: product.id,
          amount: data.price,
          interval: data.interval === 'quarterly' ? 'month' : data.interval === 'yearly' ? 'year' : data.interval === 'weekly' ? 'week' : 'month',
          trainerStripeAccountId: stripeAccountId,
        });
        stripeProductId = product.id;
        stripePriceId = price.id;
      }
    }

    const subscription = await prisma.trainer_subscriptions.create({
      data: {
        id,
        trainerId,
        name: data.name,
        description: data.description || null,
        price: data.price,
        interval: data.interval,
        features: data.features || [],
        status: 'ACTIVE',
        activeSubscribers: 0,
        totalRevenue: 0,
        mollieProductId: stripeProductId, // reusing column for stripe product id
        molliePriceId: stripePriceId,     // reusing column for stripe price id
        updatedAt: new Date(),
      },
    });

    return mapSubscription(subscription);
  }

  static async getTrainerSubscriptions(trainerId: string): Promise<TrainerSubscription[]> {
    const subs = await prisma.trainer_subscriptions.findMany({
      where: { trainerId },
      orderBy: { createdAt: 'desc' },
    });
    return subs.map(mapSubscription);
  }

  static async updateSubscription(subscriptionId: string, updates: Partial<CreateSubscriptionRequest>): Promise<TrainerSubscription> {
    const sub = await prisma.trainer_subscriptions.update({
      where: { id: subscriptionId },
      data: {
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.price ? { price: updates.price } : {}),
        ...(updates.interval ? { interval: updates.interval } : {}),
        ...(updates.features ? { features: updates.features } : {}),
        updatedAt: new Date(),
      },
    });
    return mapSubscription(sub);
  }

  static async cancelTrainerSubscription(subscriptionId: string, _reason?: string): Promise<void> {
    await prisma.trainer_subscriptions.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELLED', updatedAt: new Date() },
    });

    // Cancel all active subscriber subscriptions in Stripe
    const activeSubs = await prisma.trainer_subscription_active.findMany({
      where: { subscriptionId, status: 'ACTIVE' },
    });

    for (const sub of activeSubs) {
      if (sub.mollieSubscriptionId) {
        // mollieSubscriptionId is reused for stripeSubscriptionId
        const profile = await prisma.trainer_subscriptions.findUnique({ where: { id: subscriptionId } });
        if (profile) {
          const trainerProfile = await prisma.trainer_profiles.findUnique({ where: { userId: profile.trainerId } });
          const stripeAccountId = (trainerProfile?.businessAddress as any)?.stripeAccountId;
          if (stripeAccountId) {
            await cancelStripeSubscription(sub.mollieSubscriptionId, stripeAccountId, false).catch(() => {});
          }
        }
      }
      await prisma.trainer_subscription_active.update({
        where: { id: sub.id },
        data: { status: 'CANCELLED', endDate: new Date(), updatedAt: new Date() },
      });
    }
  }

  static async renewSubscription(subscriptionId: string): Promise<TrainerSubscription> {
    const sub = await prisma.trainer_subscriptions.update({
      where: { id: subscriptionId },
      data: { status: 'ACTIVE', updatedAt: new Date() },
    });
    return mapSubscription(sub);
  }

  static async getSubscriptionAnalytics(trainerId: string, _period?: string): Promise<{ active: number; expired: number; revenue: number }> {
    const subs = await prisma.trainer_subscriptions.findMany({ where: { trainerId } });
    const active = subs.filter(s => s.status === 'ACTIVE').length;
    const expired = subs.filter(s => s.status === 'CANCELLED').length;
    const revenue = subs.reduce((sum, s) => sum + s.totalRevenue, 0);
    return { active, expired, revenue };
  }
}

function mapSubscription(s: any): TrainerSubscription {
  return {
    id: s.id,
    trainerId: s.trainerId,
    name: s.name,
    description: s.description ?? undefined,
    price: s.price,
    interval: s.interval as any,
    features: s.features || [],
    status: s.status as any,
    activeSubscribers: s.activeSubscribers,
    totalRevenue: s.totalRevenue,
    mollieProductId: s.mollieProductId ?? undefined, // stripe product id
    molliePriceId: s.molliePriceId ?? undefined,     // stripe price id
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

// ============================================================================
// PACKAGE DEAL MANAGEMENT
// ============================================================================

export class PackageDealService {
  static async createPackage(trainerId: string, data: CreatePackageRequest): Promise<PackageDeal> {
    const id = randomUUID();
    const pkg = await prisma.package_deals.create({
      data: {
        id,
        trainerId,
        name: data.name,
        description: data.description || null,
        price: data.price,
        sessionsIncluded: data.sessionsIncluded,
        validityDays: data.validityDays || 90,
        features: data.features || [],
        status: 'ACTIVE',
        totalSold: 0,
        totalRevenue: 0,
        updatedAt: new Date(),
      },
    });
    return mapPackage(pkg);
  }

  static async getTrainerPackages(trainerId: string): Promise<PackageDeal[]> {
    const pkgs = await prisma.package_deals.findMany({
      where: { trainerId },
      orderBy: { createdAt: 'desc' },
    });
    return pkgs.map(mapPackage);
  }

  static async updatePackage(packageId: string, updates: Partial<CreatePackageRequest>): Promise<PackageDeal> {
    const pkg = await prisma.package_deals.update({
      where: { id: packageId },
      data: {
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.price ? { price: updates.price } : {}),
        ...(updates.sessionsIncluded ? { sessionsIncluded: updates.sessionsIncluded } : {}),
        ...(updates.validityDays ? { validityDays: updates.validityDays } : {}),
        ...(updates.features ? { features: updates.features } : {}),
        updatedAt: new Date(),
      },
    });
    return mapPackage(pkg);
  }

  static async deletePackage(packageId: string): Promise<void> {
    await prisma.package_deals.update({
      where: { id: packageId },
      data: { status: 'INACTIVE', updatedAt: new Date() },
    });
  }

  static async purchasePackage(packageId: string, clientId: string, paymentData: {
    redirectUrl: string;
    webhookUrl?: string;
  }): Promise<{ paymentUrl: string; paymentId: string }> {
    const pkg = await prisma.package_deals.findUniqueOrThrow({ where: { id: packageId } });
    const profile = await prisma.trainer_profiles.findUnique({ where: { userId: pkg.trainerId } });
    const stripeAccountId = (profile?.businessAddress as any)?.stripeAccountId;

    if (!stripeAccountId) {
      throw new Error('Trainer has not set up Stripe payments yet');
    }

    const client = await prisma.users.findUniqueOrThrow({ where: { id: clientId } });

    const session = await createCheckoutSession({
      trainerStripeAccountId: stripeAccountId,
      amount: pkg.price,
      description: `${pkg.name} — ${pkg.sessionsIncluded} sessions`,
      customerEmail: client.email || undefined,
      successUrl: paymentData.redirectUrl + '?success=true',
      cancelUrl: paymentData.redirectUrl + '?canceled=true',
      metadata: {
        type: 'package_purchase',
        packageId,
        clientId,
        trainerId: pkg.trainerId,
      },
    });

    return {
      paymentUrl: session.url || '',
      paymentId: session.id,
    };
  }

  static async getPackageSales(trainerId: string, period?: string): Promise<{ total: number; revenue: number; packages: any[] }> {
    const { from } = periodToDateRange(period || 'month');
    const purchases = await prisma.package_purchases.findMany({
      where: {
        package_deals: { trainerId },
        purchasedAt: { gte: from },
      },
      include: { package_deals: true },
    });

    return {
      total: purchases.length,
      revenue: purchases.reduce((sum, p) => sum + p.pricePaid, 0),
      packages: purchases,
    };
  }
}

function mapPackage(p: any): PackageDeal {
  return {
    id: p.id,
    trainerId: p.trainerId,
    name: p.name,
    description: p.description ?? undefined,
    price: p.price,
    sessionsIncluded: p.sessionsIncluded,
    validityDays: p.validityDays,
    features: p.features || [],
    status: p.status as any,
    totalSold: p.totalSold,
    totalRevenue: p.totalRevenue,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// ============================================================================
// CLIENT BILLING & PAYMENTS
// ============================================================================

export class ClientBillingService {
  static async createClientPayment(data: {
    trainerId: string;
    clientId: string;
    amount: number;
    description: string;
    type: 'session' | 'package' | 'subscription' | 'custom';
    relatedId?: string;
    dueDate?: Date;
    redirectUrl: string;
    webhookUrl?: string;
  }): Promise<{ paymentUrl: string; paymentId: string }> {
    const profile = await prisma.trainer_profiles.findUnique({ where: { userId: data.trainerId } });
    const stripeAccountId = (profile?.businessAddress as any)?.stripeAccountId;

    if (!stripeAccountId) {
      throw new Error('Trainer has not set up Stripe payments yet');
    }

    const client = await prisma.users.findUniqueOrThrow({ where: { id: data.clientId } });
    const id = randomUUID();

    // Create record in database
    await prisma.client_payments.create({
      data: {
        id,
        trainerId: data.trainerId,
        clientId: data.clientId,
        amount: data.amount,
        description: data.description,
        type: data.type.toUpperCase() as any,
        relatedId: data.relatedId || null,
        status: 'PENDING',
        dueDate: data.dueDate || null,
        metadata: { stripeAccountId },
        updatedAt: new Date(),
      },
    });

    // Create Stripe Checkout Session
    const session = await createCheckoutSession({
      trainerStripeAccountId: stripeAccountId,
      amount: data.amount,
      description: data.description,
      customerEmail: client.email || undefined,
      successUrl: data.redirectUrl + '?success=true',
      cancelUrl: data.redirectUrl + '?canceled=true',
      metadata: {
        type: data.type,
        clientPaymentId: id,
        trainerId: data.trainerId,
        clientId: data.clientId,
      },
    });

    // Update with Stripe session info
    await prisma.client_payments.update({
      where: { id },
      data: {
        molliePaymentId: session.payment_intent as string || session.id, // reuse column for stripe
        paymentUrl: session.url || null,
        updatedAt: new Date(),
      },
    });

    return {
      paymentUrl: session.url || '',
      paymentId: id,
    };
  }

  static async getClientPayments(trainerId: string, clientId?: string, status?: string): Promise<ClientPayment[]> {
    const payments = await prisma.client_payments.findMany({
      where: {
        trainerId,
        ...(clientId ? { clientId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        users_client_payments_clientIdTousers: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p: any) => ({
      id: p.id,
      trainerId: p.trainerId,
      clientId: p.clientId,
      clientName: p.users_client_payments_clientIdTousers?.name || 'Unknown',
      amount: p.amount,
      description: p.description,
      type: p.type,
      relatedId: p.relatedId ?? undefined,
      status: p.status,
      dueDate: p.dueDate ?? undefined,
      paidAt: p.paidAt ?? undefined,
      molliePaymentId: p.molliePaymentId ?? undefined, // stripe payment id
      mollieCustomerId: p.mollieCustomerId ?? undefined,
      paymentUrl: p.paymentUrl ?? undefined,
      refundAmount: p.refundAmount,
      refundReason: p.refundReason ?? undefined,
      refundedAt: p.refundedAt ?? undefined,
      metadata: p.metadata ?? undefined,
      reminderSentAt: p.reminderSentAt ?? undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  static async markPaymentPaid(paymentId: string, stripePaymentIntentId?: string): Promise<void> {
    await prisma.client_payments.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED' as any,
        paidAt: new Date(),
        ...(stripePaymentIntentId ? { molliePaymentId: stripePaymentIntentId } : {}),
        updatedAt: new Date(),
      },
    });
  }

  static async sendPaymentReminder(paymentId: string): Promise<void> {
    // TODO: Send email reminder via nodemailer
    await prisma.client_payments.update({
      where: { id: paymentId },
      data: { reminderSentAt: new Date(), updatedAt: new Date() },
    });
  }

  static async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<void> {
    const payment = await prisma.client_payments.findUniqueOrThrow({ where: { id: paymentId } });

    // Refund in Stripe if we have a payment intent
    if (payment.molliePaymentId) {
      await createRefund({
        paymentIntentId: payment.molliePaymentId,
        amount: amount || undefined,
        reason: 'requested_by_customer',
      });
    }

    await prisma.client_payments.update({
      where: { id: paymentId },
      data: {
        status: amount && amount < payment.amount ? 'PENDING' as any : 'REFUNDED' as any,
        refundAmount: amount || payment.amount,
        refundReason: reason || null,
        refundedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static async getPaymentHistory(trainerId: string, page = 1, limit = 20, filters?: {
    status?: string;
    type?: string;
    clientId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ payments: ClientPayment[]; total: number }> {
    const where: any = { trainerId };
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type.toUpperCase();
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [payments, total] = await Promise.all([
      prisma.client_payments.findMany({
        where,
        include: {
          users_client_payments_clientIdTousers: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client_payments.count({ where }),
    ]);

    return {
      payments: payments.map((p: any) => ({
        id: p.id,
        trainerId: p.trainerId,
        clientId: p.clientId,
        clientName: p.users_client_payments_clientIdTousers?.name || 'Unknown',
        amount: p.amount,
        description: p.description,
        type: p.type,
        relatedId: p.relatedId ?? undefined,
        status: p.status,
        dueDate: p.dueDate ?? undefined,
        paidAt: p.paidAt ?? undefined,
        molliePaymentId: p.molliePaymentId ?? undefined,
        mollieCustomerId: p.mollieCustomerId ?? undefined,
        paymentUrl: p.paymentUrl ?? undefined,
        refundAmount: p.refundAmount,
        refundReason: p.refundReason ?? undefined,
        refundedAt: p.refundedAt ?? undefined,
        metadata: p.metadata ?? undefined,
        reminderSentAt: p.reminderSentAt ?? undefined,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      total,
    };
  }
}

// ============================================================================
// REVENUE TRACKING & ANALYTICS
// ============================================================================

export class RevenueTrackingService {
  static async recordEarning(data: {
    trainerId: string;
    amount: number;
    type: 'session' | 'package' | 'subscription';
    sourceId: string;
    clientId: string;
    commission?: number;
  }): Promise<TrainerEarning> {
    const commission = data.commission ?? calculateCommission(data.amount);
    const netEarnings = data.amount - commission;
    const id = randomUUID();

    const earning = await prisma.trainer_earnings.create({
      data: {
        id,
        trainerId: data.trainerId,
        amount: data.amount,
        type: data.type.toUpperCase() as any,
        sourceId: data.sourceId,
        clientId: data.clientId,
        platformFee: commission,
        netEarnings,
        status: 'PENDING',
        earnedAt: new Date(),
      },
    });

    return mapEarning(earning);
  }

  static async getTrainerEarnings(trainerId: string, period?: string): Promise<TrainerEarning[]> {
    const { from } = periodToDateRange(period || 'month');
    const earnings = await prisma.trainer_earnings.findMany({
      where: { trainerId, earnedAt: { gte: from } },
      orderBy: { earnedAt: 'desc' },
    });
    return earnings.map(mapEarning);
  }

  static async getRevenueMetrics(trainerId: string, period?: string): Promise<RevenueMetrics> {
    const { from, to } = periodToDateRange(period || 'month');
    const previousFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));

    const [currentEarnings, previousEarnings, activeSubs, packages] = await Promise.all([
      prisma.trainer_earnings.findMany({
        where: { trainerId, earnedAt: { gte: from, lte: to } },
      }),
      prisma.trainer_earnings.findMany({
        where: { trainerId, earnedAt: { gte: previousFrom, lt: from } },
      }),
      prisma.trainer_subscription_active.count({
        where: {
          trainer_subscriptions: { trainerId },
          status: 'ACTIVE',
        },
      }),
      prisma.package_purchases.findMany({
        where: {
          package_deals: { trainerId },
          purchasedAt: { gte: from },
        },
      }),
    ]);

    const totalRevenue = currentEarnings.reduce((s, e) => s + e.amount, 0);
    const commission = currentEarnings.reduce((s, e) => s + e.platformFee, 0);
    const netEarnings = totalRevenue - commission;
    const previousRevenue = previousEarnings.reduce((s, e) => s + e.amount, 0);
    const growth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const sessionEarnings = currentEarnings.filter(e => e.type === 'SESSION');
    const packageEarnings = currentEarnings.filter(e => e.type === 'PACKAGE');
    const subscriptionEarnings = currentEarnings.filter(e => e.type === 'SUBSCRIPTION');

    return {
      totalRevenue,
      netEarnings,
      commission,
      sessionsRevenue: sessionEarnings.reduce((s, e) => s + e.amount, 0),
      packagesRevenue: packageEarnings.reduce((s, e) => s + e.amount, 0),
      subscriptionsRevenue: subscriptionEarnings.reduce((s, e) => s + e.amount, 0),
      previousPeriodRevenue: previousRevenue,
      growth,
      averageSessionPrice: sessionEarnings.length > 0
        ? Math.round(sessionEarnings.reduce((s, e) => s + e.amount, 0) / sessionEarnings.length)
        : 0,
      totalSessions: sessionEarnings.length,
      totalPackagesSold: packages.length,
      activeSubscriptions: activeSubs,
    };
  }

  static async getPaymentAnalytics(trainerId: string, period?: string): Promise<PaymentAnalytics> {
    const { from } = periodToDateRange(period || 'month');

    const payments = await prisma.client_payments.findMany({
      where: { trainerId, createdAt: { gte: from } },
      include: {
        users_client_payments_clientIdTousers: { select: { name: true } },
      },
    });

    const successful = payments.filter(p => p.status === 'COMPLETED');
    const failed = payments.filter(p => p.status === 'FAILED');
    const refunded = payments.filter(p => p.status === 'REFUNDED');

    // Group by client
    const clientMap = new Map<string, { name: string; totalPaid: number; sessions: number; lastPayment: Date }>();
    for (const p of payments) {
      const existing = clientMap.get(p.clientId);
      const clientName = (p as any).users_client_payments_clientIdTousers?.name || 'Unknown';
      if (existing) {
        existing.totalPaid += p.amount;
        existing.sessions += 1;
        if (p.createdAt > existing.lastPayment) existing.lastPayment = p.createdAt;
      } else {
        clientMap.set(p.clientId, {
          name: clientName,
          totalPaid: p.amount,
          sessions: 1,
          lastPayment: p.createdAt,
        });
      }
    }

    // Monthly trends
    const monthlyMap = new Map<string, { revenue: number; count: number }>();
    for (const p of payments) {
      const date = new Date(p.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyMap.get(key) || { revenue: 0, count: 0 };
      existing.revenue += p.amount;
      existing.count += 1;
      monthlyMap.set(key, existing);
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        month: monthNames[parseInt(key.split('-')[1]) - 1],
        revenue: data.revenue,
        payments: data.count,
      }));

    return {
      totalPayments: payments.length,
      successfulPayments: successful.length,
      failedPayments: failed.length,
      refundedPayments: refunded.length,
      averagePaymentAmount: payments.length > 0
        ? Math.round(payments.reduce((s, p) => s + p.amount, 0) / payments.length)
        : 0,
      paymentMethods: [], // Stripe handles this — could query Stripe for breakdown
      monthlyTrends,
      clientAnalytics: Array.from(clientMap.entries()).map(([clientId, data]) => ({
        clientId,
        clientName: data.name,
        totalPaid: data.totalPaid,
        sessionsCount: data.sessions,
        lastPayment: data.lastPayment,
      })),
    };
  }

  static async exportEarningsReport(trainerId: string, format: 'csv' | 'pdf', period?: string): Promise<string> {
    // TODO: Generate actual CSV/PDF file
    const earnings = await RevenueTrackingService.getTrainerEarnings(trainerId, period);

    if (format === 'csv') {
      const header = 'Date,Type,Amount,Commission,Net,Status\n';
      const rows = earnings.map(e =>
        `${e.earnedAt.toISOString()},${e.type},${e.amount},${e.platformFee},${e.netEarnings},${e.status}`
      ).join('\n');
      // In production: upload to S3/Vercel Blob and return URL
      return `data:text/csv;charset=utf-8,${encodeURIComponent(header + rows)}`;
    }

    throw new Error('PDF export not yet implemented');
  }
}

function mapEarning(e: any): TrainerEarning {
  return {
    id: e.id,
    trainerId: e.trainerId,
    amount: e.amount,
    type: e.type,
    sourceId: e.sourceId,
    clientId: e.clientId,
    platformFee: e.platformFee,
    netEarnings: e.netEarnings,
    status: e.status,
    payoutDate: e.payoutDate ?? undefined,
    payoutId: e.payoutId ?? undefined,
    description: e.description ?? undefined,
    earnedAt: e.earnedAt,
    createdAt: e.createdAt,
  };
}

// ============================================================================
// BUSINESS LOGIC & VALIDATION
// ============================================================================

export class PaymentBusinessLogic {
  static validateSubscriptionCreation(data: CreateSubscriptionRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.length < SUBSCRIPTION_VALIDATION_RULES.name.minLength) {
      errors.push(`Name must be at least ${SUBSCRIPTION_VALIDATION_RULES.name.minLength} characters`);
    }
    if (data.name && data.name.length > SUBSCRIPTION_VALIDATION_RULES.name.maxLength) {
      errors.push(`Name must be no more than ${SUBSCRIPTION_VALIDATION_RULES.name.maxLength} characters`);
    }
    if (data.price < SUBSCRIPTION_VALIDATION_RULES.price.min) {
      errors.push(`Price must be at least €${SUBSCRIPTION_VALIDATION_RULES.price.min / 100}`);
    }
    if (data.price > SUBSCRIPTION_VALIDATION_RULES.price.max) {
      errors.push(`Price cannot exceed €${SUBSCRIPTION_VALIDATION_RULES.price.max / 100}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  static validatePackageCreation(data: CreatePackageRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.length < PACKAGE_VALIDATION_RULES.name.minLength) {
      errors.push(`Name must be at least ${PACKAGE_VALIDATION_RULES.name.minLength} characters`);
    }
    if (data.name && data.name.length > PACKAGE_VALIDATION_RULES.name.maxLength) {
      errors.push(`Name must be no more than ${PACKAGE_VALIDATION_RULES.name.maxLength} characters`);
    }
    if (data.price < PACKAGE_VALIDATION_RULES.price.min) {
      errors.push(`Price must be at least €${PACKAGE_VALIDATION_RULES.price.min / 100}`);
    }
    if (data.price > PACKAGE_VALIDATION_RULES.price.max) {
      errors.push(`Price cannot exceed €${PACKAGE_VALIDATION_RULES.price.max / 100}`);
    }
    if (data.sessionsIncluded < PACKAGE_VALIDATION_RULES.sessions.min) {
      errors.push(`Must include at least ${PACKAGE_VALIDATION_RULES.sessions.min} session`);
    }
    if (data.sessionsIncluded > PACKAGE_VALIDATION_RULES.sessions.max) {
      errors.push(`Cannot include more than ${PACKAGE_VALIDATION_RULES.sessions.max} sessions`);
    }

    return { isValid: errors.length === 0, errors };
  }

  static async canTrainerCreateSubscription(trainerId: string): Promise<{ canCreate: boolean; reason?: string }> {
    const count = await prisma.trainer_subscriptions.count({
      where: { trainerId, status: 'ACTIVE' },
    });
    if (count >= MAX_SUBSCRIPTIONS_PER_TRAINER) {
      return { canCreate: false, reason: `Maximum ${MAX_SUBSCRIPTIONS_PER_TRAINER} active subscriptions allowed` };
    }
    return { canCreate: true };
  }

  static async canTrainerCreatePackage(trainerId: string): Promise<{ canCreate: boolean; reason?: string }> {
    const count = await prisma.package_deals.count({
      where: { trainerId, status: 'ACTIVE' },
    });
    if (count >= MAX_PACKAGES_PER_TRAINER) {
      return { canCreate: false, reason: `Maximum ${MAX_PACKAGES_PER_TRAINER} active packages allowed` };
    }
    return { canCreate: true };
  }

  static calculateCommission(amount: number): number {
    return calculateCommission(amount);
  }

  static calculateNetEarnings(grossAmount: number, commission: number): number {
    return grossAmount - commission;
  }
}

// ============================================================================
// STRIPE CONNECT HELPERS
// ============================================================================

export class StripeConnectService {
  /**
   * Get the trainer's Stripe Account ID from their profile
   */
  static async getTrainerStripeAccountId(trainerId: string): Promise<string | null> {
    const profile = await prisma.trainer_profiles.findUnique({ where: { userId: trainerId } });
    if (!profile?.businessAddress || typeof profile.businessAddress !== 'object') return null;
    return (profile.businessAddress as any).stripeAccountId || null;
  }

  /**
   * Save Stripe Account ID to trainer profile
   */
  static async saveStripeAccountId(trainerId: string, stripeAccountId: string): Promise<void> {
    const profile = await prisma.trainer_profiles.findUnique({ where: { userId: trainerId } });
    const existing = (profile?.businessAddress && typeof profile.businessAddress === 'object')
      ? profile.businessAddress as Record<string, any>
      : {};

    await prisma.trainer_profiles.update({
      where: { userId: trainerId },
      data: {
        businessAddress: { ...existing, stripeAccountId },
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Check if trainer has completed Stripe onboarding
   */
  static async isTrainerOnboarded(trainerId: string): Promise<boolean> {
    const accountId = await this.getTrainerStripeAccountId(trainerId);
    if (!accountId) return false;
    const account = await getAccount(accountId);
    return isAccountReady(account);
  }
}

// ============================================================================
// MAIN SERVICE EXPORT
// ============================================================================

export const TrainerPaymentService = {
  // Subscription operations
  createSubscription: TrainerSubscriptionService.createTrainerSubscription,
  getSubscriptions: TrainerSubscriptionService.getTrainerSubscriptions,
  updateSubscription: TrainerSubscriptionService.updateSubscription,
  cancelSubscription: TrainerSubscriptionService.cancelTrainerSubscription,
  renewSubscription: TrainerSubscriptionService.renewSubscription,
  getSubscriptionAnalytics: TrainerSubscriptionService.getSubscriptionAnalytics,

  // Package operations
  createPackage: PackageDealService.createPackage,
  getPackages: PackageDealService.getTrainerPackages,
  updatePackage: PackageDealService.updatePackage,
  deletePackage: PackageDealService.deletePackage,
  purchasePackage: PackageDealService.purchasePackage,
  getPackageSales: PackageDealService.getPackageSales,

  // Client billing operations
  createClientPayment: ClientBillingService.createClientPayment,
  getClientPayments: ClientBillingService.getClientPayments,
  markPaymentPaid: ClientBillingService.markPaymentPaid,
  sendPaymentReminder: ClientBillingService.sendPaymentReminder,
  refundPayment: ClientBillingService.refundPayment,
  getPaymentHistory: ClientBillingService.getPaymentHistory,

  // Revenue operations
  recordEarning: RevenueTrackingService.recordEarning,
  getEarnings: RevenueTrackingService.getTrainerEarnings,
  getRevenueMetrics: RevenueTrackingService.getRevenueMetrics,
  getPaymentAnalytics: RevenueTrackingService.getPaymentAnalytics,
  exportEarningsReport: RevenueTrackingService.exportEarningsReport,

  // Business logic
  validateSubscriptionCreation: PaymentBusinessLogic.validateSubscriptionCreation,
  validatePackageCreation: PaymentBusinessLogic.validatePackageCreation,
  canCreateSubscription: PaymentBusinessLogic.canTrainerCreateSubscription,
  canCreatePackage: PaymentBusinessLogic.canTrainerCreatePackage,
  calculateCommission: PaymentBusinessLogic.calculateCommission,
  calculateNetEarnings: PaymentBusinessLogic.calculateNetEarnings,

  // Stripe Connect
  getTrainerStripeAccountId: StripeConnectService.getTrainerStripeAccountId,
  saveStripeAccountId: StripeConnectService.saveStripeAccountId,
  isTrainerOnboarded: StripeConnectService.isTrainerOnboarded,
};
