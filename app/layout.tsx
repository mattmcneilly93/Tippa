import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Tippa",
    template: "%s | Tippa"
  },
  description: "A private family football tournament prediction game.",
  applicationName: "Tippa",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Tippa",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#101827",
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
    <html lang="en">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
