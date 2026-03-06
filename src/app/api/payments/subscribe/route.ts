/**
 * Stripe Subscribe API - Athlete Subscription Checkout
 * Creates a Stripe Checkout Session for an athlete to subscribe to a trainer's plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { createSubscriptionCheckout } from '@/core/integrations/stripe';

// ============================================================================
// POST - Create subscription checkout session
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, redirectUrl } = body;

    if (!subscriptionId || !redirectUrl) {
      return NextResponse.json(
        { error: 'subscriptionId and redirectUrl are required' },
        { status: 400 }
      );
    }

    // Look up the trainer subscription plan
    const subscription = await prisma.trainer_subscriptions.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    if (subscription.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Subscription plan is not active' }, { status: 400 });
    }

    if (!subscription.molliePriceId) {
      return NextResponse.json(
        { error: 'Subscription plan has no Stripe price configured' },
        { status: 400 }
      );
    }

    // Look up the trainer's Stripe Connect account
    const trainerProfile = await prisma.trainer_profiles.findUnique({
      where: { userId: subscription.trainerId },
    });

    const stripeAccountId = (trainerProfile?.businessAddress as any)?.stripeAccountId;

    if (!stripeAccountId) {
      return NextResponse.json(
        { error: 'Trainer has not set up Stripe payments' },
        { status: 400 }
      );
    }

    // Get client email
    const client = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    // Create Stripe subscription checkout session
    const checkoutSession = await createSubscriptionCheckout({
      priceId: subscription.molliePriceId,
      trainerStripeAccountId: stripeAccountId,
      customerEmail: client?.email || undefined,
      successUrl: `${redirectUrl}?success=true`,
      cancelUrl: `${redirectUrl}?canceled=true`,
      metadata: {
        type: 'subscription',
        subscriptionId,
        trainerId: subscription.trainerId,
        clientId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: { checkoutUrl: checkoutSession.url },
    });
  } catch (error) {
    console.error('Subscribe API error:', error);
    return NextResponse.json({ error: 'Failed to create subscription checkout' }, { status: 500 });
  }
}
