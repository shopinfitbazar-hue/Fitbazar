import { NextResponse } from "next/server";
import { requireMobileCustomer } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const addresses = await prisma.address.findMany({
      where: { userId: auth.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ addresses });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to load addresses." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const body = await request.json().catch(() => ({}));
    const fields = [body.name, body.phone, body.line1, body.zone, body.district];
    if (fields.some((value) => typeof value !== "string" || !value.trim())) {
      return NextResponse.json({ error: "Complete all required address fields." }, { status: 400 });
    }

    const address = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.address.count({ where: { userId: auth.user.id } });
      const isDefault = Boolean(body.isDefault) || existingCount === 0;
      if (isDefault) await tx.address.updateMany({ where: { userId: auth.user.id }, data: { isDefault: false } });
      return tx.address.create({
        data: {
          userId: auth.user.id,
          name: body.name.trim().slice(0, 120),
          phone: body.phone.trim().slice(0, 30),
          line1: body.line1.trim().slice(0, 240),
          zone: body.zone.trim().slice(0, 80),
          district: body.district.trim().slice(0, 80),
          isDefault,
        },
      });
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to save address." }, { status: 500 });
  }
}
