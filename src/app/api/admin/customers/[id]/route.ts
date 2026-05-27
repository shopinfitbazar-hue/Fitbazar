import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as { isBanned?: boolean };

    if (typeof body.isBanned !== "boolean") {
      return NextResponse.json({ error: "isBanned is required" }, { status: 400 });
    }

    const existingCustomer = await prisma.user.findFirst({
      where: {
        id,
        role: "CUSTOMER",
      },
      select: {
        id: true,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customer = await prisma.user.update({
      where: { id: existingCustomer.id },
      data: { isBanned: body.isBanned },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        emailVerified: true,
        isBanned: true,
        createdAt: true,
        accounts: {
          select: {
            provider: true,
          },
        },
        _count: {
          select: {
            orders: true,
            wishlist: true,
            supportTickets: true,
          },
        },
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
