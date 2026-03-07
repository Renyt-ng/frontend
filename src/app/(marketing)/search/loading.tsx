import { Container } from "@/components/layout";

export default function SearchLoading() {
  return (
    <div className="pb-16">
      {/* Fake search header */}
      <div className="border-b border-[var(--color-border)] bg-white py-6">
        <Container>
          <div className="mx-auto max-w-2xl">
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
          </div>
        </Container>
      </div>

      <Container className="mt-6">
        {/* Fake area tags */}
        <div className="mb-6 flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-gray-100"
            />
          ))}
        </div>

        {/* Fake property grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white"
            >
              <div className="aspect-[4/3] animate-pulse bg-gray-100" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="h-5 w-1/3 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
