import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.startsWith("sk_test_dummy")) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only vendors can connect a Stripe account" }, { status: 403 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe Connect is not configured yet. Add STRIPE_SECRET_KEY before enabling payouts." },
        { status: 503 },
      );
    }

    const { accountType } = (await req.json()) as { accountType?: Stripe.AccountCreateParams.Type };
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const account = await stripe.accounts.create({
      type: accountType || "express",
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/vendor/dashboard`,
      return_url: `${baseUrl}/vendor/dashboard`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url, accountId: account.id });
  } catch (error) {
    console.error("SERVER_ERROR_STRIPE_CONNECT", error);
    return NextResponse.json({ error: "Unable to create Stripe onboarding link" }, { status: 500 });
  }
}
