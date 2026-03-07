import { Container } from "@/components/layout";

export default function MarketingLoading() {
  return (
    <Container className="py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-deep-slate-blue)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">Loading...</p>
      </div>
    </Container>
  );
}
