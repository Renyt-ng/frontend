import { Navbar } from "@/components/layout";
import { Footer } from "@/components/layout";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      <Footer />
    </div>
  );
}
