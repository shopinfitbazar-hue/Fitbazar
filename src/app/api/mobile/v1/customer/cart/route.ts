import { NextResponse } from "next/server";
import { addCustomerCartItem, clearCustomerCart, getCustomerCartItems } from "@/lib/cart-server";
import { requireMobileCustomer } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const items = await getCustomerCartItems(auth.user.id);

    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error fetching mobile cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const result = await addCustomerCartItem(auth.user.id, await request.json());

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ item: result.item }, { status: result.status });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error adding mobile cart item:", error);
    return NextResponse.json({ error: "Failed to add cart item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    await clearCustomerCart(auth.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error clearing mobile cart:", error);
    return NextResponse.json({ error: "Failed to clear cart." }, { status: 500 });
  }
}
