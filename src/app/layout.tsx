import type { Metadata, Viewport } from "next";
import { Lexend, Inter } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-lexend",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TerraFlow Ops",
    template: "%s · TerraFlow Ops",
  },
  description: "Internal operations console for TerraFlow.Studio.",
  applicationName: "TerraFlow Ops",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg text-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
