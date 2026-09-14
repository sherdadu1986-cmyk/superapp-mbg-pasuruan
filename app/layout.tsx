import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast";
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
  title: 'SPPG Pasuruan - Sistem Operasional BGN Kiduldalem',
  description: 'Sistem operasional dan manajemen penerima manfaat MBG SPPG Wonorejo Pasuruan',
  metadataBase: new URL('https://dapur-sppg.pasuruankab.go.id'),
  keywords: ['SPPG', 'Super App', 'Kiduldalem', 'Penerima Manfaat', 'Makanan Bergizi Gratis', 'Pasuruan', 'BGN'],
  icons: {
    icon: [
      { url: '/logo-bgn.png', href: '/logo-bgn.png' },
      { url: '/favicon.ico', href: '/favicon.ico' }
    ],
    apple: '/logo-bgn.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <AppLayoutWrapper>{children}</AppLayoutWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}

