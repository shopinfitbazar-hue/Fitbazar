import { NextResponse } from "next/server";
import { CustomerRegistrationError, registerCustomer } from "@/lib/customer-registration";

export async function POST(req: Request) {
  try {
    const result = await registerCustomer(await req.json());
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerRegistrationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Something went wrong while creating your account." }, { status: 500 });
  }
}
