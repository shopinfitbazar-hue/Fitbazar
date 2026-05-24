import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      token?: string;
      password?: string;
      confirmPassword?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const token = body.token?.trim();
    const password = body.password;
    const confirmPassword = body.confirmPassword;

    if (!email || !token || !password || !confirmPassword) {
      return NextResponse.json({ error: "Reset request is incomplete." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const storedToken = await prisma.verificationToken.findUnique({
      where: {
        token: hashOpaqueToken(token),
      },
    });

    if (!storedToken || storedToken.identifier !== `password-reset:${email}`) {
      return NextResponse.json({ error: "This password reset link is invalid." }, { status: 400 });
    }

    if (storedToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          token: storedToken.token,
        },
      }).catch(() => undefined);

      return NextResponse.json({ error: "This password reset link has expired." }, { status: 410 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        emailVerified: {
          set: new Date(),
        },
      },
    });

    await prisma.verificationToken.delete({
      where: {
        token: storedToken.token,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
  }
}
