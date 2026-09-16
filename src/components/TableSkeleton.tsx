import React from 'react'

export function TableSkeleton() {
  return (
    <div className="w-full space-y-3 p-4">
      {/* Top bar loading indicator */}
      <div className="flex items-center justify-between pb-2">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          Sinkronisasi data BGN...
        </div>
      </div>

      {/* Skeleton rows */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-3 p-3.5 border-b border-slate-100 items-center animate-pulse odd:bg-white even:bg-slate-50/60"
          >
            <div className="col-span-1 h-3.5 bg-slate-200 rounded w-6" />
            <div className="col-span-4 h-3.5 bg-slate-200 rounded w-4/5" />
            <div className="col-span-2 h-6 bg-slate-200 rounded-md w-24" />
            <div className="col-span-2 h-3.5 bg-slate-200 rounded w-20" />
            <div className="col-span-1 h-3.5 bg-slate-200 rounded w-10 mx-auto" />
            <div className="col-span-1 h-3.5 bg-slate-200 rounded w-10 mx-auto" />
            <div className="col-span-1 h-3.5 bg-slate-200 rounded w-10 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
