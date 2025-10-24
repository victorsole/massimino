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
 * Send email verification email
 */
export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  verificationToken: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!resend) {
      console.warn('Email service not configured - verification email not sent');
      return { success: false, error: 'Email service not configured (missing RESEND_API_KEY)' };
    }

    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${params.verificationToken}`;

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Verify your Massimino account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to Massimino!</h1>
              <p style="font-size: 18px; color: #4b5563;">Hi ${params.name},</p>
            </div>

            <div style="padding: 30px 20px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for signing up for Massimino, your safety-first fitness community platform.
              </p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                To complete your registration and start your fitness journey, please verify your email address by clicking the button below:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}"
                   style="background-color: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                This verification link will expire in 24 hours. If you didn't create an account with Massimino, you can safely ignore this email.
              </p>

              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 10px; margin-top: 30px; text-align: center;">
              <p style="font-size: 14px; color: #6b7280; margin: 0;">
                Safe Workouts for Everyone<br>
                <a href="${process.env.NEXTAUTH_URL}" style="color: #2563eb; text-decoration: none;">massimino.fitness</a>
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[EmailService] Failed to send verification email:', error);
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
    console.error('[EmailService] Error sending verification email:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
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
