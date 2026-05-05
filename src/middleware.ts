import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Ambil cookie session
  const sessionCookie = request.cookies.get('mbg_session')?.value
  
  // Jika tidak ada session, redirect ke login dengan error
  if (!sessionCookie) {
    const loginUrl = new URL('/?denied=1', request.url)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'))
    const { role, unit_id } = session

    // RBAC: Cek akses berdasarkan role
    if (pathname.startsWith('/korwil')) {
      if (role !== 'korwil' && role !== 'it') {
        const redirectUrl = role === 'sppg' ? `/sppg/dashboard/${unit_id}` : '/'
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
    }

    if (pathname.startsWith('/sppg')) {
      if (role !== 'sppg' && role !== 'it') {
        const redirectUrl = role === 'korwil' ? '/korwil' : '/'
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
    }

    if (pathname.startsWith('/it') || pathname.startsWith('/admin')) {
      if (role !== 'it') {
        const redirectUrl = role === 'korwil' ? '/korwil' : role === 'sppg' ? `/sppg/dashboard/${unit_id}` : '/'
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    // Jika cookie invalid/corrupt
    const loginUrl = new URL('/?denied=1', request.url)
    // Hapus cookie yang corrupt
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('mbg_session')
    return response
  }
}

export const config = {
  matcher: [
    '/korwil/:path*',
    '/sppg/:path*',
    '/it/:path*',
    '/admin/:path*'
  ]
}
