import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const festival = (await prisma.festivalConfig.findUnique({
      where: { id: "festival-config" },
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
    
    const festival = await prisma.festivalConfig.upsert({
      where: { id: "festival-config" },
      update: body,
      create: {
        id: "festival-config",
        ...body,
      },
    });
    
    return NextResponse.json(festival);
  } catch (error) {
    console.error("Error updating festival config:", error);
    return NextResponse.json({ error: "Failed to update festival config" }, { status: 500 });
  }
}
