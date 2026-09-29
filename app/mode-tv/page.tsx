"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import KioskModeDisplay from '@/components/KioskModeDisplay'

export const dynamic = 'force-dynamic'

export default function ModeTvPage() {
  const router = useRouter()

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard/penerima-manfaat')
    }
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950 z-50">
      <KioskModeDisplay
        isOpen={true}
        onClose={handleClose}
      />
    </div>
  )
}
