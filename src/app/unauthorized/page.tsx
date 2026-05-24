import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function UnauthorizedPage() {
  return (
    <main className="bg-page">
      <Header />
      <div className="container py-12">
        <div className="mx-auto max-w-[560px] rounded-[8px] bg-card p-10 text-center shadow-[var(--shadow-sm)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-fb-pink-bg text-[28px] font-bold text-fb-pink">
            403
          </div>
          <h1 className="mt-5">Access Denied</h1>
          <p className="mt-3 text-[14px] text-text-muted">
            You don&apos;t have permission to access this page. Please sign in with the correct account and try again.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login" className="btn-primary">
              Login
            </Link>
            <Link href="/" className="btn-ghost">
              Go Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
