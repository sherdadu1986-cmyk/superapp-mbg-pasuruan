"use client"
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

// Role slug → display role mapping
const roleMap: Record<string, string> = {
  kepalasppg: 'Kepala SPPG',
  akuntan:    'Akuntan',
  ahligizi:   'Ahli Gizi',
  aslap:      'Aslap',
  keamanan:   'Keamanan',
}

export default function RoleEntryPage() {
  const router = useRouter()
  const params = useParams()
  const roleSlug = params?.role as string

  useEffect(() => {
    // Confirm session exists and role matches, then redirect to main dashboard
    const stored = localStorage.getItem('sppg_user')
    if (!stored) {
      // No session — send back to login
      router.replace('/login')
      return
    }
    const user = JSON.parse(stored)
    const expectedRole = roleMap[roleSlug]
    if (!expectedRole || user.role !== expectedRole) {
      // Role mismatch — send back to login
      router.replace('/login')
      return
    }
    // Session valid — proceed to main dashboard
    router.replace('/')
  }, [router, roleSlug])

  // Minimal loading screen while redirect fires
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 font-sans">
      <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-2xl shadow">
        🍽️
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500 font-semibold">
        <span className="inline-block w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        Memuat dashboard {roleMap[roleSlug] ?? ''}...
      </div>
    </div>
  )
}
