import { NextResponse } from "next/server";
import { requireMobileCustomer } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireMobileCustomer(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const existing = await prisma.address.findFirst({ where: { id, userId: auth.user.id } });
    if (!existing) return NextResponse.json({ error: "Address not found." }, { status: 404 });

    const address = await prisma.$transaction(async (tx) => {
      if (body.isDefault) await tx.address.updateMany({ where: { userId: auth.user.id }, data: { isDefault: false } });
      return tx.address.update({
        where: { id },
        data: {
          ...(typeof body.name === "string" ? { name: body.name.trim().slice(0, 120) } : {}),
          ...(typeof body.phone === "string" ? { phone: body.phone.trim().slice(0, 30) } : {}),
          ...(typeof body.line1 === "string" ? { line1: body.line1.trim().slice(0, 240) } : {}),
          ...(typeof body.zone === "string" ? { zone: body.zone.trim().slice(0, 80) } : {}),
          ...(typeof body.district === "string" ? { district: body.district.trim().slice(0, 80) } : {}),
          ...(typeof body.isDefault === "boolean" ? { isDefault: body.isDefault } : {}),
        },
      });
    });
    return NextResponse.json({ address });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to update address." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireMobileCustomer(request);
    const { id } = await params;
    const deleted = await prisma.address.deleteMany({ where: { id, userId: auth.user.id } });
    if (!deleted.count) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to delete address." }, { status: 500 });
  }
}
