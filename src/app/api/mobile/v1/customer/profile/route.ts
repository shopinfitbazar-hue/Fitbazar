import { NextResponse } from "next/server";
import { requireMobileCustomer } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, name: true, email: true, phone: true, image: true, role: true, createdAt: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to load profile." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const body = await request.json().catch(() => ({}));
    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        ...(typeof body.name === "string" ? { name: body.name.trim().slice(0, 120) } : {}),
        ...(typeof body.phone === "string" ? { phone: body.phone.trim().slice(0, 30) } : {}),
        ...(typeof body.image === "string" ? { image: body.image.trim().slice(0, 500) } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, image: true, role: true, createdAt: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
