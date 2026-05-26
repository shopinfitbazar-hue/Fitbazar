import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function authStatus(error: string) {
  return error === "Unauthorized" ? 401 : 403;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireCustomerSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const { id } = await params;
    const body = (await request.json()) as { quantity?: number };
    const quantity = Number(body.quantity);

    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
    }

    const existing = await prisma.cartItem.findFirst({
      where: {
        id,
        userId: auth.session.user.id,
      },
      select: {
        id: true,
        productId: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    const product = await prisma.product.findUnique({
      where: { id: existing.productId },
      select: {
        stock: true,
      },
    });

    if (product?.stock && quantity > product.stock) {
      return NextResponse.json({ error: "Requested quantity exceeds stock" }, { status: 400 });
    }

    const item = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireCustomerSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const { id } = await params;
    const existing = await prisma.cartItem.findFirst({
      where: {
        id,
        userId: auth.session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return NextResponse.json({ error: "Failed to remove cart item" }, { status: 500 });
  }
}
