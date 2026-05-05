import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// GLOBAL METADATA & OPEN GRAPH CONFIG
export const metadata: Metadata = {
  title: "Sistem Monitoring Pemberian Makanan Bergizi Gratis - Kab. Pasuruan",
  description: "Aplikasi resmi pelaporan harian Satuan Pelayanan Pemenuhan Gizi Kabupaten Pasuruan",
  metadataBase: new URL("https://mbg.pasuruankab.go.id"), // Placeholder URL, sesuaikan jika sudah deploy
  keywords: ["MBG", "Pasuruan", "Makanan Bergizi Gratis", "SPPG", "Monitoring"],
  authors: [{ name: "IT Pasuruan" }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png' }
    ]
  },
  openGraph: {
    title: "Sistem Monitoring Pemberian Makanan Bergizi Gratis - Kab. Pasuruan",
    description: "Aplikasi resmi pelaporan harian Satuan Pelayanan Pemenuhan Gizi Kabupaten Pasuruan",
    url: "https://mbg.pasuruankab.go.id",
    siteName: "MBG Pasuruan",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "MBG Pasuruan Banner"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "MBG Kab. Pasuruan",
    description: "Monitoring Makanan Bergizi Gratis",
    images: ["/opengraph-image.png"],
  },
  manifest: '/manifest.json'
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
