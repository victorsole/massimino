import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  const { to } = await req.json().catch(() => ({})) as { to?: string }
  const recipient = to || 'hello@beresol.eu'

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Massimino Fitness'}" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject: 'Test Email from Massimino Fitness',
      text: 'This is a test email sent from Massimino Fitness via Gmail SMTP. If you received this, the email configuration is working correctly.',
      html: `
        <div style="font-family: 'Nunito Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://massimino.fitness/massimino_logo.png" alt="Massimino Fitness" width="64" height="64" style="display: block; margin: 0 auto 12px;" />
            <h1 style="color: #2b5069; font-size: 24px; margin: 0;">Massimino Fitness</h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Safe Workouts for Everyone</p>
          </div>
          <div style="background: #fcfaf5; border-radius: 12px; padding: 30px; border: 1px solid #e5e7eb;">
            <h2 style="color: #2b5069; font-size: 18px; margin-top: 0;">Email Configuration Test</h2>
            <p style="color: #374151; line-height: 1.6;">
              This is a test email sent from <strong>Massimino Fitness</strong> via Gmail SMTP (Google Workspace).
            </p>
            <p style="color: #374151; line-height: 1.6;">
              If you received this, the email configuration is working correctly.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #9ca3af; font-size: 12px;">Safe Workouts for Everyone &mdash; <a href="https://massimino.fitness" style="color: #2b5069; text-decoration: none;">massimino.fitness</a></p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error: any) {
    console.error('[SMTP Test] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
