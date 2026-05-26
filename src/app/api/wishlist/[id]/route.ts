import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function authStatus(error: string) {
  return error === "Unauthorized" ? 401 : 403;
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireCustomerSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const { id } = await params;

    const wishlistItem = await prisma.wishlist.findFirst({
      where: {
        userId: auth.session.user.id,
        OR: [{ id }, { productId: id }],
      },
      select: {
        id: true,
      },
    });

    if (!wishlistItem) {
      return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
    }

    await prisma.wishlist.delete({
      where: { id: wishlistItem.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing wishlist item:", error);
    return NextResponse.json({ error: "Failed to remove wishlist item" }, { status: 500 });
  }
}
