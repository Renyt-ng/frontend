export default function AuthLoading() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8">
        <div className="space-y-4">
          <div className="mx-auto h-7 w-32 animate-pulse rounded bg-gray-100" />
          <div className="mx-auto h-4 w-48 animate-pulse rounded bg-gray-100" />
          <div className="space-y-3 pt-4">
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
