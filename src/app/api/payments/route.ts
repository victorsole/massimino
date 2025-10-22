/**
 * Payments API - Mollie Integration for Trainer Business
 * Handles payment creation, processing, and webhook management
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import {
  createMolliePayment,
  getTrainerPaymentAnalytics
} from '@/core/database';
import {
  createSessionPayment,
  createPackagePayment,
  formatAmount
} from '@/core/integrations/mollie';

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

    // Verify user has access to this trainer's data
    if (session.user.role !== 'ADMIN' && session.user.id !== trainerId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const analytics = await getTrainerPaymentAnalytics(trainerId, period);

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Payment analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment analytics' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create new payment
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
      redirectUrl
    } = body;

    // Validate required fields
    if (!type || !trainerId || !clientId || !amount || !description || !redirectUrl) {
      return NextResponse.json({
        error: 'Missing required fields: type, trainerId, clientId, amount, description, redirectUrl'
      }, { status: 400 });
    }

    // Verify user authorization (client can pay for their own sessions, trainers can create payments)
    if (session.user.id !== clientId && session.user.id !== trainerId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/payments/webhook`;
    let molliePayment;

    // Create payment based on type
    if (type === 'session' && appointmentId) {
      molliePayment = await createSessionPayment({
        trainerId,
        clientId,
        appointmentId,
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        description,
        redirectUrl,
        webhookUrl
      });
    } else if (type === 'package' && packageId) {
      molliePayment = await createPackagePayment({
        trainerId,
        clientId,
        packageId,
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        description,
        redirectUrl,
        webhookUrl
      });
    } else if (type === 'tip') {
      // Create a tip payment (one-off)
      const { createPayment } = await import('@/core/integrations/mollie');
      molliePayment = await createPayment({
        amount: {
          value: formatAmount(Math.round(amount * 100)),
          currency
        },
        description: description || 'Massimino Tip',
        redirectUrl,
        webhookUrl,
        metadata: {
          type: 'TIP',
          trainerId,
          clientId
        }
      });
    } else {
      return NextResponse.json({
        error: 'Invalid payment type or missing required IDs'
      }, { status: 400 });
    }

    if (!molliePayment) {
      return NextResponse.json({
        error: 'Failed to create Mollie payment'
      }, { status: 500 });
    }

    // Calculate platform fee (85/15 coach/platform split)
    const platformFeeRate = 0.15;
    const platformFee = Math.round(amount * 100 * platformFeeRate);
    const trainerEarnings = Math.round(amount * 100) - platformFee;

    // Save payment to database
    const payment = await createMolliePayment({
      trainerId,
      clientId,
      ...(appointmentId ? {} : (packageId ? { trainerClientId: packageId } : {})),
      amount: Math.round(amount * 100),
      currency,
      type: type.toUpperCase(),
      description,
      molliePaymentId: molliePayment.id,
      ...(appointmentId ? { sessionDate: new Date() } : {}),
      ...(packageId ? { packageId } : {}),
      metadata: {
        type,
        appointmentId,
        packageId,
        platformFeeRate,
        trainerEarnings
      }
    });

    console.log('Payment created successfully:', {
      paymentId: payment.id,
      molliePaymentId: molliePayment.id,
      amount: amount,
      type
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        molliePaymentId: molliePayment.id,
        checkoutUrl: molliePayment.getCheckoutUrl(),
        status: molliePayment.status,
        amount: formatAmount(Math.round(amount * 100)),
        currency,
        description
      }
    });

  } catch (error) {
    console.error('Payment creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
