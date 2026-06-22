import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/tokens";

const APP_REDIRECT = "fitbazar://auth/google";
const CODE_TTL_MS = 5 * 60 * 1000;

function redirectToApp(params: Record<string, string>) {
  const url = new URL(APP_REDIRECT);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return new Response(null, { status: 302, headers: { Location: url.toString(), "Cache-Control": "no-store" } });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirectToApp({ error: "Google sign-in was not completed." });

  const code = createOpaqueToken();
  await prisma.$transaction([
    prisma.mobileAuthCode.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.mobileAuthCode.create({
      data: {
        userId: session.user.id,
        tokenHash: hashOpaqueToken(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    }),
  ]);

  return redirectToApp({ code });
}
