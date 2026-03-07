import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-bg)] px-4 text-center">
      <div className="mb-8">
        <p className="text-7xl font-extrabold text-[var(--color-deep-slate-blue)]">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">
          Page Not Found
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been
          moved.
        </p>
      </div>

      <div className="flex gap-3">
        <Link href="/">
          <Button>
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
        <Link href="/search">
          <Button variant="secondary">Browse Properties</Button>
        </Link>
      </div>
    </div>
  );
}
