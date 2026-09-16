"use client"
import React from 'react'
import { Tv } from 'lucide-react'

export interface NavbarProps {
  onOpenKiosk?: () => void
}

export function Navbar({ onOpenKiosk }: NavbarProps) {
  const handleLaunchKiosk = () => {
    if (typeof window !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {})
    }
    if (onOpenKiosk) {
      onOpenKiosk()
    }
  }

  return (
    <header className="no-print print:hidden bg-white/60 backdrop-blur-xl border-b border-white/50 h-16 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_20px_0_rgba(31,38,135,0.04)]">
      {/* Left Header Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src="/logo-bgn.png" alt="BGN" className="h-9 w-9 object-contain" onError={(e) => { e.currentTarget.src = '/favicon.ico' }} />
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight text-slate-800">BGN</span>
            <span className="text-[11px] text-slate-500 font-medium">Manajemen Penerima Manfaat</span>
          </div>
        </div>
      </div>

      {/* Right Header Controls */}
      <div className="flex items-center gap-3">
        {/* Kiosk Mode Trigger Button */}
        <button
          type="button"
          onClick={handleLaunchKiosk}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 hover:bg-white/90 border border-white/80 backdrop-blur-md shadow-xs transition-all duration-300 text-slate-800 font-semibold text-xs cursor-pointer active:scale-95"
          title="Buka Mode Presentasi TV Dinding"
        >
          <Tv size={15} className="text-blue-600 animate-pulse" />
          <span>Mode Layar TV</span>
        </button>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2.5 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/70 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-white/80 shadow-xs shrink-0">
            AS
          </div>
          <div className="hidden sm:block text-left">
            <h4 className="text-xs font-bold text-slate-900 leading-tight">AHMAD SAYYIDANI KH...</h4>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">Kepala SPPG | SPPG PASURUAN...</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
