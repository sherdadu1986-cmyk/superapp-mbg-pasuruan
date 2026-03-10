"use client"
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest animate-pulse">
        Memuat data...
      </p>
    </div>
  )
}
