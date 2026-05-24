import nodemailer from "nodemailer";

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function normalizeSmtpPassword(value?: string) {
  return value?.replace(/\s+/g, "") || "";
}

function hasConfiguredValue(value?: string) {
  return Boolean(value && !value.startsWith("your-") && value !== "placeholder");
}

export function hasConfiguredMailTransport() {
  return (
    hasConfiguredValue(process.env.SMTP_HOST) &&
    hasConfiguredValue(process.env.SMTP_USER) &&
    hasConfiguredValue(process.env.SMTP_PASS) &&
    hasConfiguredValue(process.env.SMTP_FROM)
  );
}

export async function sendMail(payload: MailPayload) {
  if (!hasConfiguredMailTransport()) {
    return {
      delivered: false,
      reason: "Mail transport is not configured.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: normalizeSmtpPassword(process.env.SMTP_PASS),
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  return {
    delivered: true,
  };
}
