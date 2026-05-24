import { ProductGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="bg-page">
      <div className="container py-6">
        <div className="hero-skeleton rounded-[32px] p-6 md:p-10">
          <div className="skeleton h-4 w-28 rounded-full" />
          <div className="mt-5 skeleton h-12 w-full max-w-[26rem] rounded-[20px]" />
          <div className="mt-3 skeleton h-5 w-full max-w-[34rem] rounded-full" />
          <div className="mt-8 grid grid-cols-2 gap-3 max-w-[18rem]">
            <div className="skeleton h-12 rounded-full" />
            <div className="skeleton h-12 rounded-full" />
          </div>
        </div>

        <section className="section-shell mt-6">
          <div className="mb-5 skeleton h-10 w-56 rounded-full" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <ProductGridSkeleton />
          </div>
        </section>
      </div>
    </main>
  );
}
