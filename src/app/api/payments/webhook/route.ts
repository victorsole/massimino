/**
 * Mollie Webhook Handler
 * Processes payment status updates from Mollie
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  updatePaymentFromMollie,
  getPaymentByMollieId,
  updateAppointmentStatus
} from '@/core/database';
import {
  getPayment,
  isPaymentSuccessful,
  isPaymentFailed
} from '@/core/integrations/mollie';

// ============================================================================
// POST - Handle Mollie webhook
// ============================================================================

export async function POST(request: Request) {
  try {
    // headers() available if signature verification is implemented later
    headers();
    const body = await request.text();

    // Parse form data from Mollie
    const formData = new URLSearchParams(body);
    const paymentId = formData.get('id');

    if (!paymentId) {
      console.error('No payment ID in webhook payload');
      return NextResponse.json({ error: 'No payment ID provided' }, { status: 400 });
    }

    console.log('Processing Mollie webhook for payment:', paymentId);

    // Get payment details from Mollie
    const molliePayment = await getPayment(paymentId);
    if (!molliePayment) {
      console.error('Payment not found in Mollie:', paymentId);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Get our payment record
    const payment = await getPaymentByMollieId(paymentId);
    if (!payment) {
      console.error('Payment not found in database:', paymentId);
      return NextResponse.json({ error: 'Payment not found in database' }, { status: 404 });
    }

    // Map Mollie status to our status
    let status: string;
    let paymentDate: Date | undefined;
    let failureReason: string | undefined;
    let trainerEarnings: number | undefined;
    let platformFee: number | undefined;

    if (isPaymentSuccessful(molliePayment.status)) {
      status = 'COMPLETED';
      paymentDate = new Date();

      // Calculate earnings from metadata
      const metadata = payment.metadata as any;
      const te = metadata?.trainerEarnings as number | undefined;
      if (typeof te === 'number') {
        trainerEarnings = te;
        platformFee = payment.amount - te;
      } else {
        // Fallback calculation (85/15 coach/platform split)
        const platformFeeRate = 0.15;
        platformFee = Math.round(payment.amount * platformFeeRate);
        trainerEarnings = payment.amount - platformFee;
      }

      console.log('Payment completed successfully:', {
        paymentId: payment.id,
        trainerEarnings,
        platformFee
      });

    } else if (isPaymentFailed(molliePayment.status)) {
      status = 'FAILED';
      failureReason = `Payment ${molliePayment.status}`;

      console.log('Payment failed:', {
        paymentId: payment.id,
        status: molliePayment.status,
        reason: failureReason
      });

    } else {
      status = 'PROCESSING';
      console.log('Payment still processing:', {
        paymentId: payment.id,
        status: molliePayment.status
      });
    }

    // Update payment in database
    const updateData: any = { status };
    if (paymentDate) updateData.paymentDate = paymentDate;
    if (failureReason) updateData.failureReason = failureReason;
    if (typeof trainerEarnings === 'number') updateData.trainerEarnings = trainerEarnings;
    if (typeof platformFee === 'number') updateData.platformFee = platformFee;

    await updatePaymentFromMollie(paymentId, updateData);

    // Update related appointment if this was a session payment
    const metadata = payment.metadata as any;
    if (metadata?.appointmentId && status === 'COMPLETED') {
      try {
        await updateAppointmentStatus(metadata.appointmentId, 'CONFIRMED', {
          trainerNotes: 'Payment completed successfully'
        });
        console.log('Appointment confirmed after payment:', metadata.appointmentId);
      } catch (error) {
        console.error('Failed to update appointment:', error);
        // Don't fail the webhook for this
      }
    }

    // Send notification to trainer (implement later)
    if (status === 'COMPLETED' && trainerEarnings) {
      // TODO: Send notification to trainer about payment
      console.log('TODO: Send payment notification to trainer:', payment.trainerId);
    }

    // Send notification to client (implement later)
    if (status === 'COMPLETED') {
      // TODO: Send payment confirmation to client
      console.log('TODO: Send payment confirmation to client:', payment.clientId);
    }

    console.log('Webhook processed successfully:', {
      molliePaymentId: paymentId,
      status,
      amount: molliePayment.amount?.value,
      currency: molliePayment.amount?.currency
    });

    return NextResponse.json({
      success: true,
      status,
      paymentId: payment.id
    });

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Return 200 to prevent Mollie from retrying, but log the error
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 } // Return 200 to acknowledge receipt
    );
  }
}

// ============================================================================
// GET - Webhook verification endpoint (for testing)
// ============================================================================

export async function GET() {
  return NextResponse.json({
    message: 'Mollie webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
