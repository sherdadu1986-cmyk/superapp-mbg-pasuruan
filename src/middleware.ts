import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { proxy } from './proxy'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent') || ''

  // LIST BOT / CRAWLER UNTUK BYPASS (WhatsApp, FB, Twitter, dll)
  const isCrawler = /WhatsApp|WhatsAppBot|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|googlebot|bingbot/i.test(userAgent)

  // LOGIKA BYPASS UNTUK CRAWLER
  // Agar link preview tetap muncul meski halaman di-protect
  if (isCrawler) {
    return NextResponse.next()
  }

  // Jika bukan crawler, jalankan proteksi RBAC dari proxy.ts
  return proxy(request)
}

// Konfigurasi Matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - opengraph-image.png (OG Image)
     * - logo.png (App Logo)
     */
    '/korwil/:path*',
    '/sppg/:path*',
    '/it/:path*',
    '/admin/:path*',
  ],
}
