import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Renyt — Housing, Powered by Technology",
    template: "%s | Renyt",
  },
  description:
    "Lagos' trust-first property marketplace. Verified agents, Verified listings and transparent pricing.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://renyt.ng"),
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "Renyt",
    title: "Renyt — Housing, Powered by Technology",
    description:
      "Lagos' trust-first property marketplace. Verified agents, Verified listings and transparent pricing.",
    images: [{ url: "/logo-primary.png" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/logo-primary.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1E3A5F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
