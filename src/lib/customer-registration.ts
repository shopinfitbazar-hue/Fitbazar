import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buildAppUrl, createOpaqueToken, hashOpaqueToken } from "@/lib/tokens";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { renderCustomerWelcomeEmail, renderEmailVerificationEmail } from "@/lib/email-templates";

export class CustomerRegistrationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CustomerRegistrationError";
    this.status = status;
  }
}

export async function registerCustomer(input: {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
}) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const confirmPassword = typeof input.confirmPassword === "string" ? input.confirmPassword : "";

  if (!name || !email || !password || !confirmPassword) {
    throw new CustomerRegistrationError("All required fields must be filled.");
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new CustomerRegistrationError("Please enter a valid email address.");
  }
  if (password !== confirmPassword) {
    throw new CustomerRegistrationError("Passwords do not match.");
  }
  if (password.length < 8) {
    throw new CustomerRegistrationError("Password must be at least 8 characters long.");
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    throw new CustomerRegistrationError("An account with this email already exists.", 409);
  }

  const shouldRequireVerification = hasConfiguredMailTransport();
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      password: await bcrypt.hash(password, 10),
      emailVerified: shouldRequireVerification ? null : new Date(),
    },
    select: { id: true, email: true, name: true },
  });

  if (shouldRequireVerification) {
    await prisma.verificationToken.deleteMany({ where: { identifier: `email-verification:${email}` } });
    const rawToken = createOpaqueToken();
    await prisma.verificationToken.create({
      data: {
        identifier: `email-verification:${email}`,
        token: hashOpaqueToken(rawToken),
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    const verificationUrl = buildAppUrl(`/verify-email?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`);
    await sendMail({
      to: email,
      subject: "Verify your Fit Bazar account",
      text: `Verify your Fit Bazar account using this link: ${verificationUrl}`,
      html: renderEmailVerificationEmail(name, verificationUrl),
    }).catch(() => undefined);

    await sendMail({
      to: email,
      subject: "Welcome to Fit Bazar",
      text: `Hello ${name}, thank you for creating your Fit Bazar account.`,
      html: renderCustomerWelcomeEmail(name, buildAppUrl("/products")),
    }).catch(() => undefined);
  }

  return { user, verificationRequired: shouldRequireVerification };
}
