/**
 * Unified delivery transport — SMS + email.
 *
 * Each channel has a real provider integration + a console fallback for
 * development (so workflows run end-to-end without external credentials).
 *
 * Providers are activated by env vars:
 *   SMS:   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *   Email: RESEND_API_KEY (or SMTP_*), else console
 */

export interface DeliveryMessage {
  to: string;
  body: string;
  subject?: string;
}

export interface DeliveryResult {
  success: boolean;
  channel: 'sms' | 'email';
  provider: string;
  messageId?: string;
  error?: string;
}

async function sendSmsViaTwilio(msg: DeliveryMessage): Promise<DeliveryResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    // Fallback: log to console
    console.log(`\n📱 SMS (console): to=${msg.to}\n${msg.body}\n`);
    return { success: true, channel: 'sms', provider: 'console' };
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: msg.to,
        From: from,
        Body: msg.body,
      }),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      channel: 'sms',
      provider: 'twilio',
      error: (data as { message?: string }).message || `HTTP ${res.status}`,
    };
  }
  return {
    success: true,
    channel: 'sms',
    provider: 'twilio',
    messageId: (data as { sid?: string }).sid,
  };
}

async function sendEmailViaResend(msg: DeliveryMessage): Promise<DeliveryResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'AiCRM <onboarding@resend.dev>';

  if (!key) {
    // Fallback: log to console
    console.log(`\n📧 Email (console): to=${msg.to} subject=${msg.subject || ''}\n${msg.body}\n`);
    return { success: true, channel: 'email', provider: 'console' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [msg.to],
      subject: msg.subject || 'Message from AiCRM',
      text: msg.body,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      channel: 'email',
      provider: 'resend',
      error: (data as { message?: string }).message || `HTTP ${res.status}`,
    };
  }
  return {
    success: true,
    channel: 'email',
    provider: 'resend',
    messageId: (data as { id?: string }).id,
  };
}

export async function sendMessage(
  msg: DeliveryMessage,
  channel: 'sms' | 'email'
): Promise<DeliveryResult> {
  if (channel === 'sms') return sendSmsViaTwilio(msg);
  return sendEmailViaResend(msg);
}

/**
 * Resolve a contact's destination (phone for SMS, email for email).
 */
export async function resolveDestination(
  contactId: string,
  channel: 'sms' | 'email'
): Promise<string | null> {
  const { default: prisma } = await import('@/lib/db/prisma');
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { phone: true, email: true },
  });
  if (!contact) return null;
  return channel === 'sms' ? contact.phone : contact.email;
}
