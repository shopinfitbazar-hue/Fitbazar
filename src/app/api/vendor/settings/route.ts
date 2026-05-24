import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireVendorSession({ allowPending: true });
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { vendor, session } = auth;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    const fullVendor = await prisma.vendor.findUnique({
      where: { id: vendor.id },
      select: {
        id: true,
        shopName: true,
        slug: true,
        logo: true,
        banner: true,
        description: true,
        category: true,
        phone: true,
        panNumber: true,
        bankAccount: true,
        isApproved: true,
        isSuspended: true,
        commissionPct: true,
      },
    });

    return NextResponse.json({
      vendor: fullVendor,
      owner: user,
    });
  } catch (error) {
    console.error("Error fetching vendor settings:", error);
    return NextResponse.json({ error: "Failed to fetch vendor settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireVendorSession({ allowPending: true });
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { vendor, session } = auth;
    const body = (await request.json()) as {
      ownerName?: string;
      ownerPhone?: string;
      shopName?: string;
      description?: string;
      category?: string;
      logo?: string;
      banner?: string;
      phone?: string;
      panNumber?: string;
      bankAccount?: string;
    };

    const shopName = body.shopName?.trim();
    if (!shopName) {
      return NextResponse.json({ error: "Shop name is required." }, { status: 400 });
    }

    const [updatedUser, updatedVendor] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          ...(body.ownerName !== undefined ? { name: body.ownerName.trim() } : {}),
          ...(body.ownerPhone !== undefined ? { phone: body.ownerPhone.trim() } : {}),
        },
      }),
      prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          shopName,
          description: body.description?.trim() || "",
          category: body.category?.trim() || "",
          logo: body.logo?.trim() || null,
          banner: body.banner?.trim() || null,
          phone: body.phone?.trim() || null,
          panNumber: body.panNumber?.trim() || null,
          bankAccount: body.bankAccount?.trim() || null,
        },
      }),
    ]);

    return NextResponse.json({
      vendor: updatedVendor,
      owner: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    console.error("Error updating vendor settings:", error);
    return NextResponse.json({ error: "Failed to update vendor settings" }, { status: 500 });
  }
}
