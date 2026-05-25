import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const FESTIVAL_CONFIG_ID = "festival-config";

export async function GET() {
  try {
    const festival = (await prisma.festivalConfig.findUnique({
      where: { id: FESTIVAL_CONFIG_ID },
    })) || (await prisma.festivalConfig.findFirst({
      where: { isActive: true },
    }));
    return NextResponse.json(festival);
  } catch (error) {
    console.error("Error fetching festival config:", error);
    return NextResponse.json({ error: "Failed to fetch festival config" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const endDate = body.endDate ? new Date(body.endDate) : null;

    if (!body.name?.trim() || !body.nameNp?.trim() || !endDate || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Festival name, Nepali name, and valid end date are required." }, { status: 400 });
    }

    const data = {
      name: body.name.trim(),
      nameNp: body.nameNp.trim(),
      endDate,
      isActive: Boolean(body.isActive),
    };
    
    const festival = await prisma.festivalConfig.upsert({
      where: { id: FESTIVAL_CONFIG_ID },
      update: data,
      create: {
        id: FESTIVAL_CONFIG_ID,
        ...data,
      },
    });
    
    return NextResponse.json(festival);
  } catch (error) {
    console.error("Error updating festival config:", error);
    return NextResponse.json({ error: "Failed to update festival config" }, { status: 500 });
  }
}
