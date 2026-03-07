import { Container } from "@/components/layout";

export default function PropertyDetailLoading() {
  return (
    <div className="pb-16">
      {/* Breadcrumb skeleton */}
      <div className="border-b border-[var(--color-border)] bg-white py-3">
        <Container>
          <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
        </Container>
      </div>

      <Container className="mt-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-8 lg:col-span-2">
            {/* Gallery skeleton */}
            <div className="aspect-[16/9] animate-pulse rounded-2xl bg-gray-100" />

            {/* Title skeleton */}
            <div className="space-y-3">
              <div className="h-7 w-3/4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>

            {/* Specs skeleton */}
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-gray-100" />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      </Container>
    </div>
  );
}
