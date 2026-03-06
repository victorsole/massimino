/**
 * Stripe Webhook Handler
 * Processes payment events from Stripe platform and Connect accounts.
 *
 * Two webhook secrets:
 *  - STRIPE_WEBHOOK_SECRET         → platform events (charges, refunds, account.updated)
 *  - STRIPE_CONNECT_WEBHOOK_SECRET → events from connected accounts (subscriptions, invoices)
 *
 * If only one secret is configured the handler falls back to that single secret.
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent } from '@/core/integrations/stripe';
import { prisma } from '@/core/database';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const PLATFORM_FEE_RATE = 0.15;

// ============================================================================
// POST - Handle Stripe webhook
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const platformSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const connectSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

    if (!platformSecret && !connectSecret) {
      console.error('No webhook secrets configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Try to verify with both secrets — Connect events may arrive on either endpoint
    let event: Stripe.Event | null = null;

    for (const secret of [platformSecret, connectSecret].filter(Boolean) as string[]) {
      try {
        event = constructWebhookEvent(body, signature, secret);
        break;
      } catch {
        // try next secret
      }
    }

    if (!event) {
      console.error('Webhook signature verification failed with all configured secrets');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Connect events include event.account
    const connectedAccountId = (event as any).account as string | undefined;
    console.log('Stripe webhook received:', event.type, event.id, connectedAccountId ? `(connect: ${connectedAccountId})` : '(platform)');

    switch (event.type) {
      // ── Checkout ──────────────────────────────────────────────
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // ── One-time payments ─────────────────────────────────────
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      // ── Invoices (subscription renewals on connected accounts) ─
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      // ── Refunds ───────────────────────────────────────────────
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      // ── Connect account status ────────────────────────────────
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      // ── Subscription lifecycle ────────────────────────────────
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to prevent Stripe from retrying for unrecoverable errors
    return NextResponse.json({ error: 'Processing failed' }, { status: 200 });
  }
}

// ============================================================================
// CHECKOUT COMPLETED
// ============================================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const type = metadata.type;

  console.log('Checkout completed:', { type, sessionId: session.id, mode: session.mode });

  // ── Package purchase ─────────────────────────────────────────
  if (type === 'package_purchase') {
    const { packageId, clientId, trainerId } = metadata;
    if (packageId && clientId) {
      const pkg = await prisma.package_deals.findUnique({ where: { id: packageId } });
      if (pkg) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);

        await prisma.package_purchases.upsert({
          where: { packageId_clientId: { packageId, clientId } },
          create: {
            id: crypto.randomUUID(),
            packageId,
            clientId,
            pricePaid: pkg.price,
            sessionsRemaining: pkg.sessionsIncluded,
            expiresAt,
            status: 'ACTIVE',
            molliePaymentId: session.payment_intent as string || session.id,
            updatedAt: new Date(),
          },
          update: {
            pricePaid: pkg.price,
            sessionsRemaining: pkg.sessionsIncluded,
            expiresAt,
            status: 'ACTIVE',
            molliePaymentId: session.payment_intent as string || session.id,
            updatedAt: new Date(),
          },
        });

        await prisma.package_deals.update({
          where: { id: packageId },
          data: {
            totalSold: { increment: 1 },
            totalRevenue: { increment: pkg.price },
            updatedAt: new Date(),
          },
        });

        if (trainerId) {
          const platformFee = Math.round(pkg.price * PLATFORM_FEE_RATE);
          await prisma.trainer_earnings.create({
            data: {
              id: crypto.randomUUID(),
              trainerId,
              amount: pkg.price,
              type: 'PACKAGE',
              sourceId: packageId,
              clientId,
              platformFee,
              netEarnings: pkg.price - platformFee,
              status: 'APPROVED',
              earnedAt: new Date(),
            },
          });
        }
      }
    }
  }

  // ── Subscription checkout (first payment) ────────────────────
  if (type === 'subscription' && session.mode === 'subscription') {
    const { subscriptionId, trainerId, clientId } = metadata;
    const stripeSubscriptionId = session.subscription as string;

    if (subscriptionId && clientId && stripeSubscriptionId) {
      // Create active subscription record
      await prisma.trainer_subscription_active.create({
        data: {
          id: crypto.randomUUID(),
          subscriptionId,
          clientId,
          status: 'ACTIVE',
          startDate: new Date(),
          mollieSubscriptionId: stripeSubscriptionId, // reuse column for Stripe subscription ID
          mollieCustomerId: session.customer as string || null,
          updatedAt: new Date(),
        },
      });

      // Increment subscriber count
      await prisma.trainer_subscriptions.update({
        where: { id: subscriptionId },
        data: {
          activeSubscribers: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      // Record first earning
      if (trainerId && session.amount_total) {
        const platformFee = Math.round(session.amount_total * PLATFORM_FEE_RATE);
        await prisma.trainer_earnings.create({
          data: {
            id: crypto.randomUUID(),
            trainerId,
            amount: session.amount_total,
            type: 'SUBSCRIPTION',
            sourceId: subscriptionId,
            clientId,
            platformFee,
            netEarnings: session.amount_total - platformFee,
            status: 'APPROVED',
            earnedAt: new Date(),
          },
        });

        // Update subscription total revenue
        await prisma.trainer_subscriptions.update({
          where: { id: subscriptionId },
          data: {
            totalRevenue: { increment: session.amount_total },
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  // ── Client payment (invoice/custom) ──────────────────────────
  if (metadata.clientPaymentId) {
    await prisma.client_payments.update({
      where: { id: metadata.clientPaymentId },
      data: {
        status: 'COMPLETED' as any,
        paidAt: new Date(),
        molliePaymentId: session.payment_intent as string || session.id,
        updatedAt: new Date(),
      },
    });

    if (metadata.trainerId && metadata.clientId) {
      const payment = await prisma.client_payments.findUnique({ where: { id: metadata.clientPaymentId } });
      if (payment) {
        const platformFee = Math.round(payment.amount * PLATFORM_FEE_RATE);
        await prisma.trainer_earnings.create({
          data: {
            id: crypto.randomUUID(),
            trainerId: metadata.trainerId,
            amount: payment.amount,
            type: metadata.type === 'session' ? 'SESSION' : metadata.type === 'subscription' ? 'SUBSCRIPTION' : 'PACKAGE',
            sourceId: metadata.clientPaymentId,
            clientId: metadata.clientId,
            platformFee,
            netEarnings: payment.amount - platformFee,
            status: 'APPROVED',
            earnedAt: new Date(),
          },
        });
      }
    }
  }
}

// ============================================================================
// INVOICE EVENTS — Subscription renewals on connected accounts
// ============================================================================

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Only handle subscription renewal invoices (first payment handled by checkout)
  const subDetails = invoice.parent?.subscription_details;
  if (!subDetails?.subscription || invoice.billing_reason === 'subscription_create') return;

  const stripeSubscriptionId = typeof subDetails.subscription === 'string'
    ? subDetails.subscription
    : subDetails.subscription.id;

  console.log('Invoice payment succeeded:', invoice.id, 'subscription:', stripeSubscriptionId);

  const activeSub = await prisma.trainer_subscription_active.findFirst({
    where: { mollieSubscriptionId: stripeSubscriptionId, status: 'ACTIVE' },
    include: { trainer_subscriptions: true },
  });

  if (!activeSub || !activeSub.trainer_subscriptions) return;

  const trainerId = activeSub.trainer_subscriptions.trainerId;
  const amount = invoice.amount_paid || 0;

  if (amount > 0) {
    const platformFee = Math.round(amount * PLATFORM_FEE_RATE);
    await prisma.trainer_earnings.create({
      data: {
        id: crypto.randomUUID(),
        trainerId,
        amount,
        type: 'SUBSCRIPTION',
        sourceId: activeSub.subscriptionId,
        clientId: activeSub.clientId,
        platformFee,
        netEarnings: amount - platformFee,
        status: 'APPROVED',
        earnedAt: new Date(),
      },
    });

    // Update subscription total revenue
    await prisma.trainer_subscriptions.update({
      where: { id: activeSub.subscriptionId },
      data: {
        totalRevenue: { increment: amount },
        updatedAt: new Date(),
      },
    });

    // Update trainer profile earnings
    const trainerEarnings = amount - platformFee;
    await prisma.trainer_profiles.update({
      where: { userId: trainerId },
      data: {
        totalEarnings: { increment: trainerEarnings },
        monthlyEarnings: { increment: trainerEarnings },
      },
    });
  }

  // Update billing dates
  const periodEnd = invoice.lines?.data?.[0]?.period?.end;
  await prisma.trainer_subscription_active.update({
    where: { id: activeSub.id },
    data: {
      lastBillingDate: new Date(),
      ...(periodEnd ? { nextBillingDate: new Date(periodEnd * 1000) } : {}),
      updatedAt: new Date(),
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subDetails = invoice.parent?.subscription_details;
  if (!subDetails?.subscription) return;

  const stripeSubscriptionId = typeof subDetails.subscription === 'string'
    ? subDetails.subscription
    : subDetails.subscription.id;

  console.log('Invoice payment failed:', invoice.id, 'subscription:', stripeSubscriptionId);

  const activeSub = await prisma.trainer_subscription_active.findFirst({
    where: { mollieSubscriptionId: stripeSubscriptionId },
  });

  if (activeSub) {
    await prisma.trainer_subscription_active.update({
      where: { id: activeSub.id },
      data: {
        status: 'PAST_DUE',
        updatedAt: new Date(),
      },
    });
  }
}

// ============================================================================
// ONE-TIME PAYMENT EVENTS
// ============================================================================

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  const payment = await prisma.payments.findFirst({
    where: { molliePaymentId: paymentIntent.id },
  });

  if (payment) {
    const platformFee = Math.round(payment.amount * PLATFORM_FEE_RATE);
    const trainerEarnings = payment.amount - platformFee;

    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED' as any,
        paymentDate: new Date(),
        trainerEarnings,
        platformFee,
      },
    });

    await prisma.trainer_profiles.update({
      where: { id: payment.trainerId },
      data: {
        totalEarnings: { increment: trainerEarnings },
        monthlyEarnings: { increment: trainerEarnings },
      },
    });
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  const payment = await prisma.payments.findFirst({
    where: { molliePaymentId: paymentIntent.id },
  });

  if (payment) {
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED' as any,
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      },
    });
  }

  const clientPayment = await prisma.client_payments.findFirst({
    where: { molliePaymentId: paymentIntent.id },
  });

  if (clientPayment) {
    await prisma.client_payments.update({
      where: { id: clientPayment.id },
      data: {
        status: 'FAILED' as any,
        updatedAt: new Date(),
      },
    });
  }
}

// ============================================================================
// REFUNDS
// ============================================================================

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id, 'amount refunded:', charge.amount_refunded);

  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (paymentIntentId) {
    const payment = await prisma.client_payments.findFirst({
      where: { molliePaymentId: paymentIntentId },
    });

    if (payment) {
      await prisma.client_payments.update({
        where: { id: payment.id },
        data: {
          status: charge.amount_refunded >= charge.amount ? 'REFUNDED' as any : 'PENDING' as any,
          refundAmount: charge.amount_refunded,
          refundedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  }
}

// ============================================================================
// CONNECT ACCOUNT
// ============================================================================

async function handleAccountUpdated(account: Stripe.Account) {
  console.log('Connect account updated:', account.id, {
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
  });
  // Account status is checked in real-time via getAccount() — no DB update needed
}

// ============================================================================
// SUBSCRIPTION LIFECYCLE
// ============================================================================

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id, 'status:', subscription.status);
  // Initial creation is handled by checkout.session.completed
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id, 'status:', subscription.status);

  const activeSub = await prisma.trainer_subscription_active.findFirst({
    where: { mollieSubscriptionId: subscription.id },
  });

  if (activeSub) {
    const statusMap: Record<string, string> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      unpaid: 'UNPAID',
      canceled: 'CANCELLED',
      incomplete: 'PAST_DUE',
      incomplete_expired: 'EXPIRED',
      trialing: 'TRIAL',
      paused: 'EXPIRED',
    };

    const newStatus = statusMap[subscription.status] || 'ACTIVE';

    await prisma.trainer_subscription_active.update({
      where: { id: activeSub.id },
      data: {
        status: newStatus as any,
        ...(subscription.cancel_at
          ? { endDate: new Date(subscription.cancel_at * 1000) }
          : {}),
        updatedAt: new Date(),
      },
    });
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  console.log('Subscription cancelled:', subscription.id);

  const activeSub = await prisma.trainer_subscription_active.findFirst({
    where: { mollieSubscriptionId: subscription.id },
  });

  if (activeSub) {
    await prisma.trainer_subscription_active.update({
      where: { id: activeSub.id },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.trainer_subscriptions.update({
      where: { id: activeSub.subscriptionId },
      data: {
        activeSubscribers: { decrement: 1 },
        updatedAt: new Date(),
      },
    });
  }
}

// ============================================================================
// GET - Health check
// ============================================================================

export async function GET() {
  return NextResponse.json({
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
