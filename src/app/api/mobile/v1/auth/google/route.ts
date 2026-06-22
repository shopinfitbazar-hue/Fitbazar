import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createMobileCustomerSession, MobileAuthError } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

type GoogleTokenPayload = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
};

function configuredGoogleAudiences() {
  return [process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_ANDROID_CLIENT_ID, process.env.GOOGLE_IOS_CLIENT_ID]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value && !value.startsWith("your-") && !value.startsWith("your_")));
}

async function verifyGoogleIdToken(idToken: string) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new MobileAuthError("Google sign-in could not be verified.", 401);

  const payload = (await response.json()) as GoogleTokenPayload;
  const audiences = configuredGoogleAudiences();
  if (!payload.aud || !audiences.includes(payload.aud)) {
    throw new MobileAuthError("Google sign-in is not configured for this app.", 401);
  }
  if (!payload.sub || !payload.email || ![true, "true"].includes(payload.email_verified as true | "true")) {
    throw new MobileAuthError("Google account email is not verified.", 401);
  }
  return payload as Required<Pick<GoogleTokenPayload, "sub" | "email">> & GoogleTokenPayload;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.idToken !== "string" || !body.idToken.trim()) {
      return NextResponse.json({ error: "Google ID token is required." }, { status: 400 });
    }

    const google = await verifyGoogleIdToken(body.idToken.trim());
    const email = google.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.role !== Role.CUSTOMER) {
      throw new MobileAuthError("This Google account cannot use the customer app.", 403);
    }
    if (existing?.isBanned) throw new MobileAuthError("Your account has been suspended.", 403);

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            emailVerified: existing.emailVerified || new Date(),
            name: existing.name || google.name || null,
            image: existing.image || google.picture || null,
          },
        })
      : await prisma.user.create({
          data: {
            email,
            name: google.name || email.split("@")[0],
            image: google.picture || null,
            emailVerified: new Date(),
            role: Role.CUSTOMER,
          },
        });

    await prisma.account.upsert({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: google.sub } },
      update: { userId: user.id, id_token: body.idToken },
      create: {
        userId: user.id,
        type: "oauth",
        provider: "google",
        providerAccountId: google.sub,
        id_token: body.idToken,
      },
    });

    return NextResponse.json(await createMobileCustomerSession(user.id, body.deviceId));
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Mobile Google sign-in error:", error);
    return NextResponse.json({ error: "Unable to sign in with Google right now." }, { status: 500 });
  }
}
