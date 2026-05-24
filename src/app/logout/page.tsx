"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    signOut({ redirect: false }).then(() => {
      router.replace("/");
    });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-6 text-center">
      <div className="max-w-md rounded-[8px] bg-card p-8 shadow-[var(--shadow-md)]">
        <h1 className="text-[24px] font-bold text-text-primary">Signing you out...</h1>
        <p className="mt-2 text-[14px] text-text-muted">
          Please wait while we close your session and take you back home.
        </p>
      </div>
    </main>
  );
}
