import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { Analytics } from "@vercel/analytics/next"

// Jost is a free, geometric sans very close to Futura (the mmmagasin brand font).
const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jost",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "mr + mrs m mundial",
    template: "%s · mundial"
  },
  description: "Private football prediction pools for friends, families, and teams.",
  applicationName: "mundial",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/mmm-favicon.png?v=3", type: "image/png" }],
    apple: [{ url: "/icons/mmm-favicon.png?v=3" }]
  },
  appleWebApp: {
    capable: true,
    title: "mundial",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#002FA7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jost.variable}>
      <body className="antialiased">
        <Analytics/>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
