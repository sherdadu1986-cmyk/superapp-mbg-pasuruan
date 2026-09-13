"use client"
import React from 'react'
import dynamic from 'next/dynamic'

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 bg-slate-100 rounded-xl" />
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-xl" />
        ))}
      </div>
      <div className="h-24 bg-emerald-100/50 rounded-xl" />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 h-72 bg-slate-100 rounded-xl" />
        <div className="h-72 bg-slate-100 rounded-xl" />
      </div>
    </div>
  )
}

const DashboardSuperApp = dynamic(() => import('./dashboard/penerima-manfaat/page'), { loading: () => <DashboardSkeleton />, ssr: false })

export default function DashboardController() {
  return <DashboardSuperApp />
}