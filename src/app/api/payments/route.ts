/**
 * Payments API - Stripe Integration for Trainer Business
 * Handles payment creation and analytics
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { createCheckoutSession, formatAmount } from '@/core/integrations/stripe';

// ============================================================================
// GET - Fetch trainer payment analytics
// ============================================================================

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'week' | 'month' | 'year' || 'month';
    const trainerId = searchParams.get('trainerId');

    if (!trainerId) {
      return NextResponse.json({ error: 'Trainer ID required' }, { status: 400 });
    }

    if (session.user.role !== 'ADMIN' && session.user.id !== trainerId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get earnings for the period
    const now = new Date();
    let from: Date;
    switch (period) {
      case 'week':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const earnings = await prisma.trainer_earnings.findMany({
      where: { trainerId, earnedAt: { gte: from } },
    });

    const totalRevenue = earnings.reduce((s, e) => s + e.amount, 0);
    const totalFees = earnings.reduce((s, e) => s + e.platformFee, 0);
    const netEarnings = totalRevenue - totalFees;

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        netEarnings,
        platformFees: totalFees,
        transactionCount: earnings.length,
        period,
      },
    });
  } catch (error) {
    console.error('Payment analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment analytics' }, { status: 500 });
  }
}

// ============================================================================
// POST - Create new payment via Stripe Checkout
// ============================================================================

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      trainerId,
      clientId,
      appointmentId,
      packageId,
      amount,
      currency = 'EUR',
      description,
      redirectUrl,
    } = body;

    if (!type || !trainerId || !clientId || !amount || !description || !redirectUrl) {
      return NextResponse.json({
        error: 'Missing required fields: type, trainerId, clientId, amount, description, redirectUrl',
      }, { status: 400 });
    }

    if (session.user.id !== clientId && session.user.id !== trainerId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get trainer's Stripe Connect account
    const trainerProfile = await prisma.trainer_profiles.findUnique({ where: { userId: trainerId } });
    const stripeAccountId = (trainerProfile?.businessAddress as any)?.stripeAccountId;

    if (!stripeAccountId || !trainerProfile) {
      return NextResponse.json({ error: 'Trainer has not set up Stripe payments' }, { status: 400 });
    }

    const client = await prisma.users.findUnique({ where: { id: clientId } });
    const amountInCents = Math.round(amount * 100);
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/payments/webhook`;

    // Create Stripe Checkout Session
    const checkoutSession = await createCheckoutSession({
      trainerStripeAccountId: stripeAccountId,
      amount: amountInCents,
      currency: currency.toLowerCase(),
      description,
      customerEmail: client?.email || undefined,
      successUrl: redirectUrl + '?success=true',
      cancelUrl: redirectUrl + '?canceled=true',
      metadata: {
        type: type.toUpperCase(),
        trainerId,
        clientId,
        ...(appointmentId ? { appointmentId } : {}),
        ...(packageId ? { packageId } : {}),
      },
    });

    // Calculate platform fee (15%)
    const platformFee = Math.round(amountInCents * 0.15);
    const trainerEarnings = amountInCents - platformFee;

    // Save payment to database
    const payment = await prisma.payments.create({
      data: {
        id: crypto.randomUUID(),
        trainerId: trainerProfile.id,
        clientId,
        amount: amountInCents,
        currency: currency.toUpperCase(),
        type: type.toUpperCase() as any,
        status: 'PENDING' as any,
        method: 'MOLLIE' as any, // reusing enum value — represents Stripe now
        description,
        molliePaymentId: checkoutSession.payment_intent as string || checkoutSession.id,
        ...(appointmentId ? { sessionDate: new Date() } : {}),
        ...(packageId ? { packageId } : {}),
        platformFee,
        trainerEarnings,
        metadata: {
          type,
          appointmentId,
          packageId,
          stripeSessionId: checkoutSession.id,
          platformFeeRate: 0.15,
          trainerEarnings,
        },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        stripeSessionId: checkoutSession.id,
        checkoutUrl: checkoutSession.url,
        status: 'pending',
        amount: formatAmount(amountInCents, currency),
        currency,
        description,
      },
    });
  } catch (error) {
    console.error('Payment creation API error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
