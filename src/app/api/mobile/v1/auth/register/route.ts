import { NextResponse } from "next/server";
import { CustomerRegistrationError, registerCustomer } from "@/lib/customer-registration";
import { createMobileCustomerSession, MobileAuthError } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const registration = await registerCustomer(body);
    const session = await createMobileCustomerSession(registration.user.id, body.deviceId);
    return NextResponse.json({ ...session, verificationRequired: registration.verificationRequired }, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerRegistrationError || error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Mobile registration error:", error);
    return NextResponse.json({ error: "Unable to create your account right now." }, { status: 500 });
  }
}
