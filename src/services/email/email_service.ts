// src/services/email/email_service.ts

/**
 * Email Service for Massimino
 * Handles email sending using Resend API
 */

import { Resend } from 'resend';

// Initialize Resend client only if API key is present
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/**
 * Email configuration
 */
const EMAIL_CONFIG = {
  // Use Resend's dev sender if no verified domain configured
  from: process.env.EMAIL_FROM || 'Massimino <onboarding@resend.dev>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@massimino.app',
} as const;

/**
 * Send team invitation email
 */
export async function sendTeamInvitationEmail(params: {
  to: string;
  teamName: string;
  trainerName: string;
  inviteToken: string;
  message?: string;
  expiresAt: Date;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured (missing RESEND_API_KEY)' };
    }
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team_invite/${params.inviteToken}`;
    const expiresInDays = Math.ceil(
      (params.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Import the email template dynamically
    const { TeamInvitationEmail } = await import('@/templates/email/team_invitation');

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `You're invited to join ${params.teamName} on Massimino`,
      react: TeamInvitationEmail({
        teamName: params.teamName,
        trainerName: params.trainerName,
        inviteUrl,
        message: params.message ?? undefined,
        expiresInDays,
      }) as any,
    });

    if (error) {
      console.error('[EmailService] Failed to send team invitation:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: any) {
    console.error('[EmailService] Error sending team invitation email:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Send reminder email for pending team invitation
 */
export async function sendInvitationReminderEmail(params: {
  to: string;
  teamName: string;
  trainerName: string;
  inviteToken: string;
  expiresAt: Date;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured (missing RESEND_API_KEY)' };
    }
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team_invite/${params.inviteToken}`;
    const expiresInDays = Math.ceil(
      (params.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const { TeamInvitationReminderEmail } = await import('@/templates/email/team_invitation');

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `Reminder: Join ${params.teamName} on Massimino`,
      react: TeamInvitationReminderEmail({
        teamName: params.teamName,
        trainerName: params.trainerName,
        inviteUrl,
        expiresInDays,
      }),
    });

    if (error) {
      console.error('[EmailService] Failed to send invitation reminder:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: any) {
    console.error('[EmailService] Error sending invitation reminder email:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if Resend is properly configured
 */
export function isEmailServiceConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Send a simple transactional email (generic helper)
 */
export async function sendEmail(params: { to: string; subject: string; text: string; replyTo?: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured (missing RESEND_API_KEY)' };
    }
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.to,
      replyTo: params.replyTo || EMAIL_CONFIG.replyTo,
      subject: params.subject,
      text: params.text,
    });
    if (error) {
      return { success: false, error: error.message || 'Failed to send email' };
    }
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}
