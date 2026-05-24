import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buildAppUrl, createOpaqueToken, hashOpaqueToken } from "@/lib/tokens";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { renderEmailVerificationEmail } from "@/lib/email-templates";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const password = body.password;
    const confirmPassword = body.confirmPassword;

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: "All required fields must be filled." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const shouldRequireVerification = hasConfiguredMailTransport();
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        emailVerified: shouldRequireVerification ? null : new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (shouldRequireVerification) {
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: `email-verification:${email}`,
        },
      });

      const rawToken = createOpaqueToken();
      const hashedToken = hashOpaqueToken(rawToken);
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

      await prisma.verificationToken.create({
        data: {
          identifier: `email-verification:${email}`,
          token: hashedToken,
          expires,
        },
      });

      const verificationUrl = buildAppUrl(`/verify-email?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`);
      await sendMail({
        to: email,
        subject: "Verify your Fit Bazar account",
        text: `Verify your Fit Bazar account using this link: ${verificationUrl}`,
        html: renderEmailVerificationEmail(name, verificationUrl),
      }).catch(() => undefined);
    }

    return NextResponse.json({ user, verificationRequired: shouldRequireVerification }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Something went wrong while creating your account." }, { status: 500 });
  }
}
