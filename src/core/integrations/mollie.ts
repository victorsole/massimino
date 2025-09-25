/**
 * Mollie Payment Integration
 * Handles payment processing for trainer business transactions
 */

import { createMollieClient, MollieApiError } from '@mollie/api-client';

// ============================================================================
// TYPES
// ============================================================================

export interface MolliePaymentData {
  amount: {
    value: string;
    currency: string;
  };
  description: string;
  redirectUrl: string;
  webhookUrl?: string;
  metadata?: Record<string, any>;
  method?: string[];
}

export interface MollieCustomerData {
  name: string;
  email: string;
  metadata?: Record<string, any>;
}

export interface MollieSubscriptionData {
  amount: {
    value: string;
    currency: string;
  };
  interval: string;
  description: string;
  webhookUrl?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// CLIENT SETUP
// ============================================================================

let mollieClientSingleton: any | null = null;

function getMollieConfigFromEnv() {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    console.warn('Mollie API key not found in environment variables');
    return null;
  }
  return { apiKey };
}

export function getMollieClient() {
  if (mollieClientSingleton) return mollieClientSingleton;

  const config = getMollieConfigFromEnv();
  if (!config) return null;

  try {
    mollieClientSingleton = createMollieClient({
      apiKey: config.apiKey,
      // Mollie expects an array of version strings
      versionStrings: ['massimino/1.0.0']
    });
    console.log('✅ Mollie client initialized successfully');
    return mollieClientSingleton;
  } catch (error) {
    console.error('❌ Failed to initialize Mollie client:', error);
    return null;
  }
}

// ============================================================================
// PAYMENT OPERATIONS
// ============================================================================

/**
 * Create a one-time payment
 */
export async function createPayment(paymentData: MolliePaymentData) {
  const client = getMollieClient();
  if (!client) {
    throw new Error('Mollie client not available');
  }

  try {
    const payment = await client.payments.create(paymentData);
    console.log('💳 Payment created:', payment.id);
    return payment;
  } catch (error) {
    console.error('❌ Payment creation failed:', error);
    if (error instanceof MollieApiError) {
      throw new Error(`Mollie API Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get payment details
 */
export async function getPayment(paymentId: string) {
  const client = getMollieClient();
  if (!client) {
    throw new Error('Mollie client not available');
  }

  try {
    const payment = await client.payments.get(paymentId);
    return payment;
  } catch (error) {
    console.error('❌ Failed to get payment:', error);
    if (error instanceof MollieApiError) {
      throw new Error(`Mollie API Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Cancel a payment
 */
export async function cancelPayment(paymentId: string) {
  const client = getMollieClient();
  if (!client) {
    throw new Error('Mollie client not available');
  }

  try {
    const payment = await client.payments.cancel(paymentId);
    console.log('🚫 Payment cancelled:', paymentId);
    return payment;
  } catch (error) {
    console.error('❌ Failed to cancel payment:', error);
    if (error instanceof MollieApiError) {
      throw new Error(`Mollie API Error: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// CUSTOMER OPERATIONS
// ============================================================================

/**
 * Create a customer for recurring payments
 */
export async function createCustomer(customerData: MollieCustomerData) {
  const client = getMollieClient();
  if (!client) {
    throw new Error('Mollie client not available');
  }

  try {
    const customer = await client.customers.create(customerData);
    console.log('👤 Customer created:', customer.id);
    return customer;
  } catch (error) {
    console.error('❌ Customer creation failed:', error);
    if (error instanceof MollieApiError) {
      throw new Error(`Mollie API Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get customer details
 */
export async function getCustomer(customerId: string) {
  const client = getMollieClient();
  if (!client) {
    throw new Error('Mollie client not available');
  }

  try {
    const customer = await client.customers.get(customerId);
    return customer;
  } catch (error) {
    console.error('❌ Failed to get customer:', error);
    if (error instanceof MollieApiError) {
      throw new Error(`Mollie API Error: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// SUBSCRIPTION OPERATIONS
// ============================================================================

/**
 * Create a subscription for recurring payments
 */
export async function createSubscription(
  customerId: string,
  subscriptionData: MollieSubscriptionData
) {
  const client = getMollieClient();
  if (!client) {
    throw new Error('Mollie client not available');
  }

  try {
    const subscription = await client.customerSubscriptions.create({
      customerId,
      ...subscriptionData
    });
    console.log('🔄 Subscription created:', subscription.id);
    return subscription;
  } catch (error) {
    console.error('❌ Subscription creation failed:', error);
    if (error instanceof MollieApiError) {
      throw new Error(`Mollie API Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(customerId: string, subscriptionId: string) {
  const client = getMollieClient();
  if (!client) {
    throw new Error('Mollie client not available');
  }

  try {
    const subscription = await client.customerSubscriptions.cancel({
      customerId,
      id: subscriptionId
    });
    console.log('🚫 Subscription cancelled:', subscriptionId);
    return subscription;
  } catch (error) {
    console.error('❌ Failed to cancel subscription:', error);
    if (error instanceof MollieApiError) {
      throw new Error(`Mollie API Error: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// WEBHOOK VERIFICATION
// ============================================================================

/**
 * Verify webhook signature (implement if using webhook signatures)
 */
export function verifyWebhookSignature(
  _payload: string,
  _signature: string,
  _secret: string
): boolean {
  // Implementation depends on your webhook setup
  // Mollie typically uses simple ID-based verification
  return true; // Placeholder
}

/**
 * Process webhook payload
 */
export async function processWebhook(paymentId: string) {
  try {
    const payment = await getPayment(paymentId);

    console.log('🔔 Webhook processed for payment:', paymentId, 'Status:', payment.status);

    return {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      description: payment.description,
      metadata: payment.metadata
    };
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format amount for Mollie (requires string with 2 decimals)
 */
export function formatAmount(amount: number): string {
  return (amount / 100).toFixed(2);
}

/**
 * Parse amount from Mollie (returns cents as integer)
 */
export function parseAmount(amount: string): number {
  return Math.round(parseFloat(amount) * 100);
}

/**
 * Validate payment status
 */
export function isPaymentSuccessful(status: string): boolean {
  return status === 'paid';
}

export function isPaymentPending(status: string): boolean {
  return ['open', 'pending'].includes(status);
}

export function isPaymentFailed(status: string): boolean {
  return ['failed', 'canceled', 'expired'].includes(status);
}

// ============================================================================
// TRAINER-SPECIFIC FUNCTIONS
// ============================================================================

/**
 * Create payment for trainer session
 */
export async function createSessionPayment(data: {
  trainerId: string;
  clientId: string;
  appointmentId: string;
  amount: number;
  currency: string;
  description: string;
  redirectUrl: string;
  webhookUrl?: string;
}) {
  const paymentData: MolliePaymentData = {
    amount: {
      value: formatAmount(data.amount),
      currency: data.currency
    },
    description: data.description,
    redirectUrl: data.redirectUrl,
    ...(data.webhookUrl ? { webhookUrl: data.webhookUrl } : {}),
    metadata: {
      type: 'session_payment',
      trainerId: data.trainerId,
      clientId: data.clientId,
      appointmentId: data.appointmentId
    }
  };

  return await createPayment(paymentData);
}

/**
 * Create payment for trainer package
 */
export async function createPackagePayment(data: {
  trainerId: string;
  clientId: string;
  packageId: string;
  amount: number;
  currency: string;
  description: string;
  redirectUrl: string;
  webhookUrl?: string;
}) {
  const paymentData: MolliePaymentData = {
    amount: {
      value: formatAmount(data.amount),
      currency: data.currency
    },
    description: data.description,
    redirectUrl: data.redirectUrl,
    ...(data.webhookUrl ? { webhookUrl: data.webhookUrl } : {}),
    metadata: {
      type: 'package_payment',
      trainerId: data.trainerId,
      clientId: data.clientId,
      packageId: data.packageId
    }
  };

  return await createPayment(paymentData);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  createMollieClient,
  MollieApiError
};
