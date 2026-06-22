import { NextResponse } from "next/server";
import { removeCustomerCartItem, updateCustomerCartItem } from "@/lib/cart-server";
import { requireMobileCustomer } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireMobileCustomer(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await updateCustomerCartItem(auth.user.id, id, Number(body.quantity));

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ item: result.item });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error updating mobile cart item:", error);
    return NextResponse.json({ error: "Failed to update cart item." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireMobileCustomer(request);
    const { id } = await params;
    const result = await removeCustomerCartItem(auth.user.id, id);

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error removing mobile cart item:", error);
    return NextResponse.json({ error: "Failed to remove cart item." }, { status: 500 });
  }
}
