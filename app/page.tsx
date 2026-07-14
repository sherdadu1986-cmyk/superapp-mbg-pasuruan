"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// ─── Skeleton loader shown while role is being resolved or dashboard loads ───
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 bg-slate-100 rounded-3xl" />
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 h-72 bg-slate-100 rounded-3xl" />
        <div className="h-72 bg-slate-100 rounded-3xl" />
      </div>
    </div>
  )
}

// ─── Dynamic imports — each dashboard is a separate file ────────────────────
const DashboardKepala  = dynamic(() => import('./dashboard/kepala/page'),  { loading: () => <DashboardSkeleton />, ssr: false })
const DashboardAkuntan = dynamic(() => import('./dashboard/akuntan/page'), { loading: () => <DashboardSkeleton />, ssr: false })
const DashboardGizi    = dynamic(() => import('./dashboard/gizi/page'),    { loading: () => <DashboardSkeleton />, ssr: false })
const DashboardAslap   = dynamic(() => import('./dashboard/aslap/page'),   { loading: () => <DashboardSkeleton />, ssr: false })
const DashboardKeamanan = dynamic(() => import('./dashboard/keamanan/page'), { loading: () => <DashboardSkeleton />, ssr: false })

// ─── Controller: reads role from localStorage, renders the right dashboard ──
export default function DashboardController() {
  const router = useRouter()
  const [role, setRole]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('sppg_user')
    if (!stored) {
      router.replace('/login')
      return
    }
    const user = JSON.parse(stored)
    setRole(user.role)
    setLoading(false)
  }, [router])

  if (loading || !role) return <DashboardSkeleton />

  if (role === 'Kepala SPPG') return <DashboardKepala  />
  if (role === 'Akuntan')     return <DashboardAkuntan />
  if (role === 'Ahli Gizi')   return <DashboardGizi    />
  if (role === 'Aslap')       return <DashboardAslap   />
  if (role === 'Keamanan')    return <DashboardKeamanan />

  // Fallback — unknown role
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <p className="text-slate-500 font-semibold">Role tidak dikenali: <strong>{role}</strong></p>
      <button
        onClick={() => { localStorage.removeItem('sppg_user'); router.replace('/login') }}
        className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition cursor-pointer"
      >
        Kembali ke Login
      </button>
    </div>
  )
}