/**
 * Stripe Connect API - Trainer Onboarding
 * Handles creating Connect accounts and onboarding links for trainers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { isTrainer } from '@/types/auth';
import {
  createConnectAccount,
  createAccountLink,
  createLoginLink,
  getAccount,
  isAccountReady,
} from '@/core/integrations/stripe';
import { StripeConnectService } from '@/services/payments/trainer_payment_service';

// ============================================================================
// GET - Get trainer's Stripe Connect status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainer(session.user as any)) {
      return NextResponse.json({ error: 'Only trainers can access Connect' }, { status: 403 });
    }

    const accountId = await StripeConnectService.getTrainerStripeAccountId(session.user.id);

    if (!accountId) {
      return NextResponse.json({
        success: true,
        data: {
          hasAccount: false,
          isOnboarded: false,
          chargesEnabled: false,
          payoutsEnabled: false,
        },
      });
    }

    const account = await getAccount(accountId);

    return NextResponse.json({
      success: true,
      data: {
        hasAccount: true,
        accountId: account.id,
        isOnboarded: isAccountReady(account),
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      },
    });
  } catch (error) {
    console.error('Connect status error:', error);
    return NextResponse.json({ error: 'Failed to get Connect status' }, { status: 500 });
  }
}

// ============================================================================
// POST - Create Connect account or onboarding/login link
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainer(session.user as any)) {
      return NextResponse.json({ error: 'Only trainers can access Connect' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;
    const baseUrl = process.env.NEXTAUTH_URL || 'https://massimino.fitness';

    switch (action) {
      case 'create-account': {
        // Check if trainer already has an account
        const existingId = await StripeConnectService.getTrainerStripeAccountId(session.user.id);
        if (existingId) {
          return NextResponse.json({ error: 'Stripe account already exists' }, { status: 400 });
        }

        const account = await createConnectAccount({
          email: session.user.email || '',
          businessName: session.user.name || undefined,
          country: body.country || 'BE', // Default to Belgium
        });

        // Save account ID to trainer profile
        await StripeConnectService.saveStripeAccountId(session.user.id, account.id);

        // Create onboarding link
        const accountLink = await createAccountLink(
          account.id,
          `${baseUrl}/dashboard/business?stripe=return`,
          `${baseUrl}/dashboard/business?stripe=refresh`
        );

        return NextResponse.json({
          success: true,
          data: {
            accountId: account.id,
            onboardingUrl: accountLink.url,
          },
        });
      }

      case 'onboarding-link': {
        const accountId = await StripeConnectService.getTrainerStripeAccountId(session.user.id);
        if (!accountId) {
          return NextResponse.json({ error: 'No Stripe account found. Create one first.' }, { status: 400 });
        }

        const accountLink = await createAccountLink(
          accountId,
          `${baseUrl}/dashboard/business?stripe=return`,
          `${baseUrl}/dashboard/business?stripe=refresh`
        );

        return NextResponse.json({
          success: true,
          data: { onboardingUrl: accountLink.url },
        });
      }

      case 'login-link': {
        const accountId = await StripeConnectService.getTrainerStripeAccountId(session.user.id);
        if (!accountId) {
          return NextResponse.json({ error: 'No Stripe account found' }, { status: 400 });
        }

        const loginLink = await createLoginLink(accountId);

        return NextResponse.json({
          success: true,
          data: { loginUrl: loginLink.url },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Connect API error:', error);
    return NextResponse.json({ error: 'Failed to process Connect request' }, { status: 500 });
  }
}
