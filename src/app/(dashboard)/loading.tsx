export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-80 animate-pulse rounded bg-gray-100" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-[var(--color-border)] bg-white"
          />
        ))}
      </div>

      {/* Content sections skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl border border-[var(--color-border)] bg-white" />
        <div className="h-64 animate-pulse rounded-2xl border border-[var(--color-border)] bg-white" />
      </div>
    </div>
  );
}
