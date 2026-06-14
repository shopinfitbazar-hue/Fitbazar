import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/server-auth";
import { revalidateStorefrontCache } from "@/lib/storefront-cache";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    revalidateStorefrontCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error refreshing storefront cache:", error);
    return NextResponse.json({ error: "Failed to refresh storefront cache" }, { status: 500 });
  }
}
