import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      token?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const token = body.token?.trim();

    if (!email || !token) {
      return NextResponse.json({ error: "Verification request is incomplete." }, { status: 400 });
    }

    const storedToken = await prisma.verificationToken.findUnique({
      where: {
        token: hashOpaqueToken(token),
      },
    });

    if (!storedToken || storedToken.identifier !== `email-verification:${email}` || storedToken.expires < new Date()) {
      return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    });

    await prisma.verificationToken.delete({
      where: {
        token: storedToken.token,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Unable to verify email." }, { status: 500 });
  }
}
