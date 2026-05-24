import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAppUrl, createOpaqueToken, hashOpaqueToken } from "@/lib/tokens";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { renderPasswordResetEmail } from "@/lib/email-templates";

const TOKEN_TTL_MS = 1000 * 60 * 60;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "No account found with that email." }, { status: 404 });
    }

    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `password-reset:${email}`,
      },
    });

    const rawToken = createOpaqueToken();
    const hashedToken = hashOpaqueToken(rawToken);
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.verificationToken.create({
      data: {
        identifier: `password-reset:${email}`,
        token: hashedToken,
        expires,
      },
    });

    const resetUrl = buildAppUrl(`/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`);
    if (!hasConfiguredMailTransport()) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Password reset email service is not configured." }, { status: 503 });
      }

      return NextResponse.json({
        success: true,
        message: "Password reset link prepared for local development.",
        emailSent: false,
        resetUrl,
      });
    }

    const emailState = await sendMail({
      to: email,
      subject: "Reset your Fit Bazar password",
      text: `Reset your password using this link: ${resetUrl}`,
      html: renderPasswordResetEmail(user.name || "there", resetUrl),
    });

    return NextResponse.json({
      success: true,
      message: emailState.delivered ? "Password reset link sent." : "Password reset email could not be sent.",
      emailSent: emailState.delivered,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Unable to process password reset." }, { status: 500 });
  }
}
