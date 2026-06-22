import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileCustomer } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireMobileCustomer(request);
    const { id } = await params;
    const wishlistItem = await prisma.wishlist.findFirst({
      where: {
        userId: auth.user.id,
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
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error removing mobile wishlist item:", error);
    return NextResponse.json({ error: "Failed to remove wishlist item." }, { status: 500 });
  }
}
