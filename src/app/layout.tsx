import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manajemen Dapur SPPG Pasuruan Wonorejo",
  description: "Sistem Manajemen & Monitoring Dapur Satuan Pelayanan Pemenuhan Gizi (SPPG) Pasuruan Wonorejo",
  metadataBase: new URL("https://dapur-sppg.pasuruankab.go.id"),
  keywords: ["SPPG", "Pasuruan", "Wonorejo", "Dapur", "Makanan Bergizi Gratis"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense>
          <AppLayoutWrapper>{children}</AppLayoutWrapper>
        </Suspense>
      </body>
    </html>
  );
}
