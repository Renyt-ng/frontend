import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center">
        <Image
          src="/logo-primary.png"
          alt="Renyt"
          width={176}
          height={40}
          className="h-auto w-[68px]"
          unoptimized
          priority
        />
      </Link>

      <div className="w-full max-w-md">{children}</div>

      <p className="mt-8 text-center text-xs text-[var(--color-text-secondary)]">
        &copy; {new Date().getFullYear()} Renyt.ng &mdash; Rent Smarter, Own Smarter.
      </p>
    </div>
  );
}
