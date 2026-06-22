import { NextResponse } from "next/server";
import { addCustomerCartItem, clearCustomerCart, getCustomerCartItems } from "@/lib/cart-server";
import { requireCustomerSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function authStatus(error: string) {
  return error === "Unauthorized" ? 401 : 403;
}

export async function GET() {
  try {
    const auth = await requireCustomerSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const items = await getCustomerCartItems(auth.session.user.id);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireCustomerSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const result = await addCustomerCartItem(auth.session.user.id, await request.json());

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ item: result.item }, { status: result.status });
  } catch (error) {
    console.error("Error adding cart item:", error);
    return NextResponse.json({ error: "Failed to add cart item" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await requireCustomerSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    await clearCustomerCart(auth.session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 });
  }
}
