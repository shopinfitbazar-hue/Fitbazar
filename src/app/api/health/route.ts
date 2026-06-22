import { NextResponse } from "next/server";
import { privateNoStoreHeaders } from "@/lib/cache-control";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "fit-bazar",
      timestamp: new Date().toISOString(),
    },
    { headers: privateNoStoreHeaders() },
  );
}
