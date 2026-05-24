import { NextResponse } from "next/server";
import { hasConfiguredConnectIps, hasConfiguredEsewa, hasConfiguredFonepay, hasConfiguredKhalti, hasConfiguredLocalCards } from "@/lib/payment-config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    methods: {
      COD: true,
      ESEWA: hasConfiguredEsewa(),
      KHALTI: hasConfiguredKhalti(),
      CONNECTIPS: hasConfiguredConnectIps(),
      FONEPAY: hasConfiguredFonepay(),
      LOCAL_CARD: hasConfiguredLocalCards(),
    },
  });
}
