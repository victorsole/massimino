/**
 * Trainer Payments API - Phase 3 Implementation
 * All trainer payment operations: subscriptions, packages, billing, analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { TrainerPaymentService } from '@/services/payments/trainer_payment_service';
import { CreateSubscriptionRequest, CreatePackageRequest } from '@/types/payments';
import { isTrainer, isActiveUser } from '@/types/auth';

// ============================================================================
// GET - Payment Data Retrieval
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isActiveUser(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Account not in good standing' },
        { status: 403 }
      );
    }

    if (!isTrainer(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Only trainers can access payment data' },
        { status: 403 }
      );
    }

    const action = searchParams.get('action') || 'dashboard';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const period = searchParams.get('period') || 'month';

    switch (action) {
      case 'dashboard':
        // Get complete business dashboard data
        const [subscriptions, packages, revenueMetrics, paymentAnalytics] = await Promise.all([
          TrainerPaymentService.getSubscriptions(session.user.id),
          TrainerPaymentService.getPackages(session.user.id),
          TrainerPaymentService.getRevenueMetrics(session.user.id, period),
          TrainerPaymentService.getPaymentAnalytics(session.user.id, period)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            subscriptions,
            packages,
            revenueMetrics,
            paymentAnalytics,
            period
          }
        });

      case 'subscriptions':
        const subscriptionData = await TrainerPaymentService.getSubscriptions(session.user.id);
        const subscriptionAnalytics = await TrainerPaymentService.getSubscriptionAnalytics(session.user.id, period);

        return NextResponse.json({
          success: true,
          data: {
            subscriptions: subscriptionData,
            analytics: subscriptionAnalytics
          }
        });

      case 'packages':
        const packageData = await TrainerPaymentService.getPackages(session.user.id);
        const packageSales = await TrainerPaymentService.getPackageSales(session.user.id, period);

        return NextResponse.json({
          success: true,
          data: {
            packages: packageData,
            sales: packageSales
          }
        });

      case 'payments':
        const clientId = searchParams.get('clientId') ?? undefined;
        const status = searchParams.get('status') ?? undefined;
        const type = searchParams.get('type') ?? undefined;
        const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
        const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;

        const filters: any = {};
        if (clientId) filters.clientId = clientId;
        if (status) filters.status = status;
        if (type) filters.type = type;
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;

        const { payments, total } = await TrainerPaymentService.getPaymentHistory(
          session.user.id,
          page,
          limit,
          filters
        );

        return NextResponse.json({
          success: true,
          data: {
            payments,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(total / limit),
              totalItems: total,
              hasNextPage: page < Math.ceil(total / limit),
              hasPreviousPage: page > 1
            }
          }
        });

      case 'earnings':
        const earnings = await TrainerPaymentService.getEarnings(session.user.id, period);
        const revenue = await TrainerPaymentService.getRevenueMetrics(session.user.id, period);

        return NextResponse.json({
          success: true,
          data: {
            earnings,
            revenue,
            period
          }
        });

      case 'analytics':
        const analytics = await TrainerPaymentService.getPaymentAnalytics(session.user.id, period);
        const revenueData = await TrainerPaymentService.getRevenueMetrics(session.user.id, period);

        return NextResponse.json({
          success: true,
          data: {
            ...analytics,
            revenue: revenueData,
            period
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Trainer Payments GET API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Payment Creation and Actions
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isActiveUser(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Account not in good standing' },
        { status: 403 }
      );
    }

    if (!isTrainer(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Only trainers can perform payment actions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create-subscription':
        const { name, description: subscriptionDescription, price, interval, features } = body;

        if (!name || !price || !interval) {
          return NextResponse.json(
            { success: false, error: 'Name, price, and interval are required' },
            { status: 400 }
          );
        }

        const subscriptionRequest: CreateSubscriptionRequest = {
          name,
          description: subscriptionDescription,
          price,
          interval,
          features: features || []
        };

        const subscriptionValidation = TrainerPaymentService.validateSubscriptionCreation(subscriptionRequest);
        if (!subscriptionValidation.isValid) {
          return NextResponse.json(
            { success: false, error: subscriptionValidation.errors.join(', ') },
            { status: 400 }
          );
        }

        const canCreateSub = await TrainerPaymentService.canCreateSubscription(session.user.id);
        if (!canCreateSub.canCreate) {
          return NextResponse.json(
            { success: false, error: canCreateSub.reason },
            { status: 400 }
          );
        }

        const subscription = await TrainerPaymentService.createSubscription(session.user.id, subscriptionRequest);

        return NextResponse.json({
          success: true,
          data: subscription,
          message: 'Subscription created successfully'
        }, { status: 201 });

      case 'create-package':
        const { name: pkgName, description: packageDescription, price: pkgPrice, sessionsIncluded, validityDays, features: pkgFeatures } = body;

        if (!pkgName || !pkgPrice || !sessionsIncluded) {
          return NextResponse.json(
            { success: false, error: 'Name, price, and sessions included are required' },
            { status: 400 }
          );
        }

        const packageRequest: CreatePackageRequest = {
          name: pkgName,
          description: packageDescription,
          price: pkgPrice,
          sessionsIncluded,
          validityDays: validityDays || 90,
          features: pkgFeatures || []
        };

        const packageValidation = TrainerPaymentService.validatePackageCreation(packageRequest);
        if (!packageValidation.isValid) {
          return NextResponse.json(
            { success: false, error: packageValidation.errors.join(', ') },
            { status: 400 }
          );
        }

        const canCreatePkg = await TrainerPaymentService.canCreatePackage(session.user.id);
        if (!canCreatePkg.canCreate) {
          return NextResponse.json(
            { success: false, error: canCreatePkg.reason },
            { status: 400 }
          );
        }

        const packageDeal = await TrainerPaymentService.createPackage(session.user.id, packageRequest);

        return NextResponse.json({
          success: true,
          data: packageDeal,
          message: 'Package created successfully'
        }, { status: 201 });

      case 'create-payment':
        const { clientId, amount, description: paymentDescription, type, relatedId, dueDate, redirectUrl, webhookUrl } = body;

        if (!clientId || !amount || !paymentDescription || !type || !redirectUrl) {
          return NextResponse.json(
            { success: false, error: 'Client ID, amount, description, type, and redirect URL are required' },
            { status: 400 }
          );
        }

        const paymentLink = await TrainerPaymentService.createClientPayment({
          trainerId: session.user.id,
          clientId,
          amount,
          description: paymentDescription,
          type,
          relatedId,
          ...(dueDate && { dueDate: new Date(dueDate) }),
          redirectUrl,
          webhookUrl
        });

        return NextResponse.json({
          success: true,
          data: paymentLink,
          message: 'Payment link created successfully'
        });

      case 'send-reminder':
        const { paymentId } = body;

        if (!paymentId) {
          return NextResponse.json(
            { success: false, error: 'Payment ID is required' },
            { status: 400 }
          );
        }

        await TrainerPaymentService.sendPaymentReminder(paymentId);

        return NextResponse.json({
          success: true,
          message: 'Payment reminder sent successfully'
        });

      case 'refund-payment':
        const { paymentId: refundPaymentId, amount: refundAmount, reason } = body;

        if (!refundPaymentId) {
          return NextResponse.json(
            { success: false, error: 'Payment ID is required' },
            { status: 400 }
          );
        }

        await TrainerPaymentService.refundPayment(refundPaymentId, refundAmount, reason);

        return NextResponse.json({
          success: true,
          message: 'Payment refunded successfully'
        });

      case 'export-report':
        const { format, period: reportPeriod } = body;

        if (!format || !['csv', 'pdf'].includes(format)) {
          return NextResponse.json(
            { success: false, error: 'Valid format (csv or pdf) is required' },
            { status: 400 }
          );
        }

        const reportUrl = await TrainerPaymentService.exportEarningsReport(session.user.id, format, reportPeriod);

        return NextResponse.json({
          success: true,
          data: { reportUrl },
          message: 'Report generated successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Trainer Payments POST API error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not available until database migration')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 503 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Payment Updates
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isActiveUser(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Account not in good standing' },
        { status: 403 }
      );
    }

    if (!isTrainer(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Only trainers can update payments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required for updates' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update-subscription':
        const { name, description, price, interval, features } = body;
        const subscriptionUpdates: Partial<CreateSubscriptionRequest> = {};

        if (name) subscriptionUpdates.name = name;
        if (description) subscriptionUpdates.description = description;
        if (price) subscriptionUpdates.price = price;
        if (interval) subscriptionUpdates.interval = interval;
        if (features) subscriptionUpdates.features = features;

        const updatedSubscription = await TrainerPaymentService.updateSubscription(id, subscriptionUpdates);

        return NextResponse.json({
          success: true,
          data: updatedSubscription,
          message: 'Subscription updated successfully'
        });

      case 'update-package':
        const { name: pkgName, description: pkgDesc, price: pkgPrice, sessionsIncluded, validityDays, features: pkgFeatures } = body;
        const packageUpdates: Partial<CreatePackageRequest> = {};

        if (pkgName) packageUpdates.name = pkgName;
        if (pkgDesc) packageUpdates.description = pkgDesc;
        if (pkgPrice) packageUpdates.price = pkgPrice;
        if (sessionsIncluded) packageUpdates.sessionsIncluded = sessionsIncluded;
        if (validityDays) packageUpdates.validityDays = validityDays;
        if (pkgFeatures) packageUpdates.features = pkgFeatures;

        const updatedPackage = await TrainerPaymentService.updatePackage(id, packageUpdates);

        return NextResponse.json({
          success: true,
          data: updatedPackage,
          message: 'Package updated successfully'
        });

      case 'mark-paid':
        const { molliePaymentId } = body;
        await TrainerPaymentService.markPaymentPaid(id, molliePaymentId);

        return NextResponse.json({
          success: true,
          message: 'Payment marked as paid successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Trainer Payments PUT API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Payment Deletion
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isActiveUser(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Account not in good standing' },
        { status: 403 }
      );
    }

    if (!isTrainer(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Only trainers can delete payments' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required for deletion' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'cancel-subscription':
        const reason = searchParams.get('reason');
        await TrainerPaymentService.cancelSubscription(id, reason ?? undefined);

        return NextResponse.json({
          success: true,
          message: 'Subscription cancelled successfully'
        });

      case 'delete-package':
        await TrainerPaymentService.deletePackage(id);

        return NextResponse.json({
          success: true,
          message: 'Package deleted successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Trainer Payments DELETE API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}