export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function ProductCardSkeleton() {
  return (
    <div className="product-skeleton-card flex h-full flex-col">
      <Skeleton className="skeleton-image" />
      <div className="skeleton-body flex flex-1 flex-col">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="mt-3 h-4 w-full rounded-full" />
        <Skeleton className="mt-2 h-4 w-3/4 rounded-full" />
        <Skeleton className="mt-4 h-5 w-2/5 rounded-full" />
        <Skeleton className="mt-3 h-3 w-3/5 rounded-full" />
        <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
          <Skeleton className="h-9 rounded-full" />
          <Skeleton className="h-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </>
  );
}
