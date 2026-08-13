/**
 * Mailer abstraction.
 *
 * In development, emails are logged to the console. For production,
 * set EMAIL_PROVIDER and provide credentials (see .env.example).
 *
 * Supported providers: console (dev), smtp, resend, sendgrid (planned).
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(message: EmailMessage): Promise<{ success: boolean; provider: string }> {
  const provider = process.env.EMAIL_PROVIDER || 'console';

  switch (provider) {
    case 'console':
    default:
      // Development: log to console with a prominent "EMAIL" banner
      console.log('\n📧 ─────────── EMAIL (dev console) ───────────');
      console.log(`To:      ${message.to}`);
      console.log(`Subject: ${message.subject}`);
      console.log('Body:');
      console.log(message.text);
      console.log('───────────────────────────────────────────────\n');
      return { success: true, provider: 'console' };

    case 'smtp':
      // Placeholder for SMTP integration (e.g., nodemailer)
      console.warn('SMTP provider not yet configured — email not sent:', message.to);
      return { success: false, provider: 'smtp' };

    case 'resend':
    case 'sendgrid':
      // Placeholder for HTTP API-based providers
      console.warn(`${provider} provider not yet configured — email not sent:`, message.to);
      return { success: false, provider };
  }
}
