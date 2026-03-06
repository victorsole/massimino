/**
 * Stripe Package Checkout API - Athlete Package Purchase
 * Creates a Stripe Checkout Session for an athlete to purchase a trainer's package deal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { createCheckoutSession } from '@/core/integrations/stripe';

// ============================================================================
// POST - Create package checkout session
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { packageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { redirectUrl } = body;
    const { packageId } = params;

    if (!redirectUrl) {
      return NextResponse.json({ error: 'redirectUrl is required' }, { status: 400 });
    }

    // Look up the package deal
    const pkg = await prisma.package_deals.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    if (pkg.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Package is not active' }, { status: 400 });
    }

    // Look up the trainer's Stripe Connect account
    const trainerProfile = await prisma.trainer_profiles.findUnique({
      where: { userId: pkg.trainerId },
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

    // Create Stripe checkout session with destination charge
    const checkoutSession = await createCheckoutSession({
      trainerStripeAccountId: stripeAccountId,
      amount: pkg.price,
      description: `${pkg.name} — ${pkg.sessionsIncluded} sessions`,
      customerEmail: client?.email || undefined,
      successUrl: `${redirectUrl}?success=true`,
      cancelUrl: `${redirectUrl}?canceled=true`,
      metadata: {
        type: 'package_purchase',
        packageId,
        clientId: session.user.id,
        trainerId: pkg.trainerId,
      },
    });

    return NextResponse.json({
      success: true,
      data: { checkoutUrl: checkoutSession.url },
    });
  } catch (error) {
    console.error('Package checkout API error:', error);
    return NextResponse.json({ error: 'Failed to create package checkout' }, { status: 500 });
  }
}
