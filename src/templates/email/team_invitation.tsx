// src/templates/email/team_invitation.tsx

/**
 * Email Templates for Team Invitations
 * Using React Email components with Massimino branding
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface TeamInvitationEmailProps {
  teamName: string;
  trainerName: string;
  inviteUrl: string;
  message?: string;
  expiresInDays: number;
}

/**
 * Main team invitation email
 */
export function TeamInvitationEmail({
  teamName = 'Awesome Fitness Team',
  trainerName = 'Coach Victor',
  inviteUrl = 'https://massimino.app/team_invite/abc123',
  message,
  expiresInDays = 7,
}: TeamInvitationEmailProps) {
  const previewText = `${trainerName} has invited you to join ${teamName} on Massimino`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Massimino Logo/Header */}
          <Section style={header}>
            <Heading style={logoText}>Massimino</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>You're Invited! 🎉</Heading>

            <Text style={text}>
              <strong>{trainerName}</strong> has invited you to join <strong>{teamName}</strong> on Massimino.
            </Text>

            {message && (
              <Section style={messageBox}>
                <Text style={messageText}>"{message}"</Text>
              </Section>
            )}

            <Text style={text}>
              Massimino is a fitness platform where you can track workouts, connect with trainers,
              and achieve your fitness goals together with your team.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={inviteUrl}>
                Accept Invitation
              </Button>
            </Section>

            <Text style={smallText}>
              This invitation will expire in <strong>{expiresInDays} days</strong>.
            </Text>

            <Text style={smallText}>
              If the button doesn't work, copy and paste this link into your browser:
            </Text>
            <Text style={linkText}>{inviteUrl}</Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Massimino. All rights reserved.
            </Text>
            <Text style={footerText}>
              If you didn't expect this invitation, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

interface TeamInvitationReminderEmailProps {
  teamName: string;
  trainerName: string;
  inviteUrl: string;
  expiresInDays: number;
}

/**
 * Reminder email for pending invitation
 */
export function TeamInvitationReminderEmail({
  teamName = 'Awesome Fitness Team',
  trainerName = 'Coach Victor',
  inviteUrl = 'https://massimino.app/team_invite/abc123',
  expiresInDays = 3,
}: TeamInvitationReminderEmailProps) {
  const previewText = `Reminder: Join ${teamName} on Massimino`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Massimino Logo/Header */}
          <Section style={header}>
            <Heading style={logoText}>Massimino</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>Don't Miss Out! ⏰</Heading>

            <Text style={text}>
              <strong>{trainerName}</strong> is still waiting for you to join <strong>{teamName}</strong>.
            </Text>

            <Text style={text}>
              Your invitation is about to expire. Accept now to start your fitness journey with the team!
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={inviteUrl}>
                Join {teamName}
              </Button>
            </Section>

            <Text style={smallText}>
              This invitation will expire in <strong>{expiresInDays} days</strong>.
            </Text>

            <Text style={smallText}>
              If the button doesn't work, copy and paste this link into your browser:
            </Text>
            <Text style={linkText}>{inviteUrl}</Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Massimino. All rights reserved.
            </Text>
            <Text style={footerText}>
              If you're no longer interested, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================================
// STYLES - Using Massimino Brand Colors
// ============================================================================

const main = {
  backgroundColor: '#fcf8f2', // Massimino secondary (warm cream)
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 24px',
  backgroundColor: '#254967', // Massimino primary (deep blue)
  textAlign: 'center' as const,
};

const logoText = {
  color: '#fcf8f2',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '-0.5px',
};

const content = {
  padding: '24px',
};

const h1 = {
  color: '#254967', // Massimino primary
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const messageBox = {
  backgroundColor: '#fcf8f2', // Massimino secondary
  borderLeft: '4px solid #254967', // Massimino primary
  padding: '16px 20px',
  margin: '24px 0',
};

const messageText = {
  color: '#254967', // Massimino primary
  fontSize: '16px',
  fontStyle: 'italic',
  lineHeight: '24px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#254967', // Massimino primary
  borderRadius: '8px',
  color: '#fcf8f2', // Massimino secondary
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  transition: 'background-color 0.2s',
};

const smallText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '12px 0',
};

const linkText = {
  color: '#254967', // Massimino primary
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
  wordBreak: 'break-all' as const,
};

const footer = {
  padding: '24px',
  backgroundColor: '#f5f5f5',
  borderTop: '1px solid #e0e0e0',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '8px 0',
};
