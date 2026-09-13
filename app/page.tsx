"use client"
import React from 'react'
import nextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 bg-slate-100 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 h-80 bg-slate-100 rounded-xl" />
        <div className="col-span-7 h-80 bg-slate-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-72 bg-slate-100 rounded-xl" />
        <div className="h-72 bg-slate-100 rounded-xl" />
      </div>
    </div>
  )
}

const DashboardSuperApp = nextDynamic(() => import('./dashboard/penerima-manfaat/page'), { loading: () => <DashboardSkeleton />, ssr: false })

export default function DashboardController() {
  return <DashboardSuperApp />
}