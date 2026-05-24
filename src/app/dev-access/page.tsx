"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DevAccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <h1 className="font-heading text-3xl mb-4">Access Denied</h1>
          <p className="text-muted">This page is only available in development mode.</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (role: "CUSTOMER" | "VENDOR" | "ADMIN") => {
    setLoading(role);
    try {
      // In development, we use credentials to sign in
      // This is a simplified version - in production you'd use proper credentials
      const result = await signIn("credentials", {
        email: `${role.toLowerCase()}@fitbazar.com`,
        password: `${role}@123`,
        redirect: false,
      });

      if (result?.ok) {
        router.push(role === "ADMIN" ? "/admin" : role === "VENDOR" ? "/vendor" : "/");
      } else {
        alert(`Failed to login as ${role}. Make sure you've run the seed.`);
      }
    } catch (error) {
      console.error(error);
      alert(`Error logging in as ${role}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl mb-2 text-dark">
            Developer Access
          </h1>
          <p className="text-muted">
            One-click login for testing different user roles
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
            ⚠️ This page is only visible in development mode
          </div>
        </div>

        <div className="grid gap-4">
          {/* Customer Card */}
          <button
            onClick={() => handleLogin("CUSTOMER")}
            disabled={loading !== null}
            className="card p-6 flex items-center gap-4 hover:border-primary transition-colors text-left disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-xl font-semibold">Login as Customer</h3>
              <p className="text-muted text-sm">Browse products, place orders, manage account</p>
            </div>
            {loading === "CUSTOMER" && (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </button>

          {/* Vendor Card */}
          <button
            onClick={() => handleLogin("VENDOR")}
            disabled={loading !== null}
            className="card p-6 flex items-center gap-4 hover:border-primary transition-colors text-left disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-xl font-semibold">Login as Vendor</h3>
              <p className="text-muted text-sm">Manage products, view orders, track payouts</p>
            </div>
            {loading === "VENDOR" && (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </button>

          {/* Admin Card */}
          <button
            onClick={() => handleLogin("ADMIN")}
            disabled={loading !== null}
            className="card p-6 flex items-center gap-4 hover:border-primary transition-colors text-left disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-xl font-semibold">Login as Admin</h3>
              <p className="text-muted text-sm">Full platform control, analytics, user management</p>
            </div>
            {loading === "ADMIN" && (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-muted">
          <p>Make sure to run <code className="bg-gray-100 px-2 py-1 rounded">npm run seed</code> first to create test accounts.</p>
        </div>
      </div>
    </div>
  );
}
