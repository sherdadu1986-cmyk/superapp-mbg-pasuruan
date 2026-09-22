import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto_Condensed, Inter } from "next/font/google";
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

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin"],
  weight: ["700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Condensed:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${robotoCondensed.variable} ${inter.variable} antialiased`}
      >
        <ToastProvider>
          <AppLayoutWrapper>{children}</AppLayoutWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}

