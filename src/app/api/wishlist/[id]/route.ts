import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const wishlistItem = await prisma.wishlist.findFirst({
      where: {
        userId: session.user.id,
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
