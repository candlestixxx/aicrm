import { Resend } from "resend";

export async function sendEmail(to: string, subject: string, html: string, brokerageId: string) {
  // Mock implementation
  console.log(\Sending Email to \ (Subject: \) on behalf of \\);
  
  // const apiKey = getSecret(brokerageId, "RESEND_API_KEY");
  // const resend = new Resend(apiKey);
  // return resend.emails.send({ from: 'onboarding@resend.dev', to, subject, html });

  return { success: true, messageId: "mock_email_id" };
}
