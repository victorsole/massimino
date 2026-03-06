/**
 * Stripe Payment Integration
 * Handles payment processing for trainer business transactions via Stripe Connect
 */

import Stripe from 'stripe';

// ============================================================================
// CLIENT SETUP
// ============================================================================

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: '2026-02-25.clover',
    appInfo: {
      name: 'Massimino',
      version: '1.0.0',
    },
  });

  return stripeInstance;
}

// ============================================================================
// STRIPE CONNECT — TRAINER ONBOARDING
// ============================================================================

/**
 * Create a Stripe Connect account for a trainer
 */
export async function createConnectAccount(data: {
  email: string;
  businessName?: string;
  country?: string;
}): Promise<Stripe.Account> {
  const stripe = getStripe();
  return stripe.accounts.create({
    type: 'express',
    email: data.email,
    business_type: 'individual',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      name: data.businessName || undefined,
      product_description: 'Personal training and fitness coaching services',
      mcc: '7941', // Sports Clubs/Fields
    },
    ...(data.country ? { country: data.country } : {}),
  });
}

/**
 * Create an onboarding link for a trainer to complete Stripe Connect setup
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<Stripe.AccountLink> {
  const stripe = getStripe();
  return stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  });
}

/**
 * Create a login link for a trainer to access their Stripe Express dashboard
 */
export async function createLoginLink(accountId: string): Promise<Stripe.LoginLink> {
  const stripe = getStripe();
  return stripe.accounts.createLoginLink(accountId);
}

/**
 * Get a Connect account's status
 */
export async function getAccount(accountId: string): Promise<Stripe.Account> {
  const stripe = getStripe();
  return stripe.accounts.retrieve(accountId);
}

/**
 * Check if a Connect account is fully onboarded and can accept payments
 */
export function isAccountReady(account: Stripe.Account): boolean {
  return (
    account.charges_enabled === true &&
    account.payouts_enabled === true &&
    account.details_submitted === true
  );
}

// ============================================================================
// PAYMENTS — ONE-TIME (Sessions, Packages)
// ============================================================================

/**
 * Create a Checkout Session for a one-time payment (session or package purchase).
 * Uses Stripe Connect destination charges so the trainer gets paid directly.
 */
export async function createCheckoutSession(data: {
  trainerStripeAccountId: string;
  amount: number; // in cents
  currency?: string;
  description: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  applicationFeePercent?: number;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const feePercent = data.applicationFeePercent ?? 15;
  const applicationFeeAmount = Math.round(data.amount * (feePercent / 100));

  return stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: data.currency || 'eur',
          product_data: {
            name: data.description,
          },
          unit_amount: data.amount,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: data.trainerStripeAccountId,
      },
    },
    ...(data.customerEmail ? { customer_email: data.customerEmail } : {}),
    success_url: data.successUrl,
    cancel_url: data.cancelUrl,
    metadata: data.metadata || {},
  });
}

// ============================================================================
// SUBSCRIPTIONS — RECURRING (Trainer subscription plans)
// ============================================================================

/**
 * Create a Stripe Product for a trainer's subscription plan
 */
export async function createProduct(data: {
  name: string;
  description?: string;
  trainerStripeAccountId: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Product> {
  const stripe = getStripe();
  return stripe.products.create(
    {
      name: data.name,
      description: data.description || undefined,
      metadata: data.metadata || {},
    },
    { stripeAccount: data.trainerStripeAccountId }
  );
}

/**
 * Create a Price for a trainer's subscription plan
 */
export async function createPrice(data: {
  productId: string;
  amount: number; // in cents
  currency?: string;
  interval: 'week' | 'month' | 'quarter' | 'year';
  trainerStripeAccountId: string;
}): Promise<Stripe.Price> {
  const stripe = getStripe();

  const isQuarter = data.interval === 'quarter';
  const intervalLookup: Record<string, Stripe.PriceCreateParams.Recurring.Interval> = {
    week: 'week', month: 'month', quarter: 'month', year: 'year',
  };
  const stripeInterval = intervalLookup[data.interval] || 'month';

  return stripe.prices.create(
    {
      product: data.productId,
      unit_amount: data.amount,
      currency: data.currency || 'eur',
      recurring: {
        interval: stripeInterval,
        ...(isQuarter ? { interval_count: 3 } : {}),
      },
    },
    { stripeAccount: data.trainerStripeAccountId }
  );
}

/**
 * Create a subscription Checkout Session on the trainer's connected account
 * with an application fee
 */
export async function createSubscriptionCheckout(data: {
  priceId: string;
  trainerStripeAccountId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  applicationFeePercent?: number;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const feePercent = data.applicationFeePercent ?? 15;

  return stripe.checkout.sessions.create(
    {
      mode: 'subscription',
      line_items: [{ price: data.priceId, quantity: 1 }],
      subscription_data: {
        application_fee_percent: feePercent,
        metadata: data.metadata || {},
      },
      ...(data.customerEmail ? { customer_email: data.customerEmail } : {}),
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: data.metadata || {},
    },
    { stripeAccount: data.trainerStripeAccountId }
  );
}

/**
 * Cancel a subscription on a connected account
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  stripeAccountId: string,
  cancelImmediately = false
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  if (cancelImmediately) {
    return stripe.subscriptions.cancel(subscriptionId, {}, { stripeAccount: stripeAccountId });
  }
  return stripe.subscriptions.update(
    subscriptionId,
    { cancel_at_period_end: true },
    { stripeAccount: stripeAccountId }
  );
}

// ============================================================================
// WEBHOOKS
// ============================================================================

/**
 * Verify and construct a Stripe webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Verify and construct a Connect webhook event
 */
export function constructConnectWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return constructWebhookEvent(payload, signature, secret);
}

// ============================================================================
// REFUNDS
// ============================================================================

/**
 * Create a refund for a payment intent
 */
export async function createRefund(data: {
  paymentIntentId: string;
  amount?: number; // partial refund in cents, omit for full
  reason?: Stripe.RefundCreateParams.Reason;
}): Promise<Stripe.Refund> {
  const stripe = getStripe();
  return stripe.refunds.create({
    payment_intent: data.paymentIntentId,
    ...(data.amount ? { amount: data.amount } : {}),
    ...(data.reason ? { reason: data.reason } : {}),
  });
}

// ============================================================================
// BALANCE & PAYOUTS
// ============================================================================

/**
 * Get the balance for a connected account
 */
export async function getAccountBalance(stripeAccountId: string): Promise<Stripe.Balance> {
  const stripe = getStripe();
  return stripe.balance.retrieve({ stripeAccount: stripeAccountId });
}

// ============================================================================
// UTILITY
// ============================================================================

// ============================================================================
// GENERIC PAYMENTS (Platform-level, non-Connect)
// ============================================================================

/**
 * Create a generic one-time payment (for challenge entries, team memberships, etc.)
 * Returns an object compatible with the old Mollie createPayment shape.
 */
export async function createPayment(data: {
  amount: { value: string; currency: string };
  description: string;
  redirectUrl: string;
  webhookUrl?: string;
  metadata?: Record<string, string>;
}): Promise<{ id: string; getCheckoutUrl: () => string | null }> {
  const stripe = getStripe();
  const amountInCents = Math.round(parseFloat(data.amount.value) * 100);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: data.amount.currency.toLowerCase(),
          product_data: { name: data.description },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    success_url: data.redirectUrl + '?success=true',
    cancel_url: data.redirectUrl + '?canceled=true',
    metadata: data.metadata || {},
  });

  return {
    id: session.id,
    getCheckoutUrl: () => session.url,
  };
}

/**
 * Format cents to display string
 */
export function formatAmount(amountInCents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
}

/**
 * Check if a payment intent is successful
 */
export function isPaymentSuccessful(status: string): boolean {
  return status === 'succeeded';
}

export function isPaymentFailed(status: string): boolean {
  return ['failed', 'canceled'].includes(status);
}
