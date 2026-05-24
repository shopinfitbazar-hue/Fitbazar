import { Resend } from "resend";

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function hasConfiguredValue(value?: string) {
  return Boolean(value && !value.startsWith("your-") && value !== "placeholder");
}

export function hasConfiguredMailTransport() {
  return hasConfiguredValue(process.env.RESEND_API_KEY);
}

export async function sendMail(payload: MailPayload) {
  if (!hasConfiguredMailTransport()) {
    return { delivered: false, reason: "Resend API key is not configured." };
  }

  const from = process.env.EMAIL_FROM || "noreply@fit-bazar.com";

  try {
    const { error } = await getResendClient().emails.send({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    if (error) {
      console.error("[mailer] Resend send error:", error);
      return { delivered: false, reason: error.message };
    }

    return { delivered: true };
  } catch (err) {
    console.error("[mailer] Resend exception:", err);
    return { delivered: false, reason: err instanceof Error ? err.message : "Unknown error" };
  }
}
