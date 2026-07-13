"use client"
import React from 'react'
import { Inbox, AlertTriangle } from 'lucide-react'

export default function StokPage() {
  const stockItems = [
    { name: 'Beras C4 Pasuruan', quantity: '120 Kg', status: 'Kritis', limit: 'Batas aman: 500 Kg', color: 'bg-rose-50 text-rose-700 border-rose-100' },
    { name: 'Ayam Fillet Broiler', quantity: '15 Kg', status: 'Kritis', limit: 'Batas aman: 200 Kg', color: 'bg-rose-50 text-rose-700 border-rose-100' },
    { name: 'Susu Cair UHT', quantity: '50 Liter', status: 'Kritis', limit: 'Batas aman: 300 Liter', color: 'bg-rose-50 text-rose-700 border-rose-100' },
    { name: 'Minyak Goreng Sania', quantity: '420 Liter', status: 'Aman', limit: 'Batas aman: 100 Liter', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { name: 'Bumbu Dapur Lengkap', quantity: '45 Kg', status: 'Aman', limit: 'Batas aman: 20 Kg', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Gudang / Stok</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">📦 Stok Bahan</h1>
        <p className="text-slate-500 text-sm mt-1">Daftar inventori bahan pangan dapur SPPG Wonorejo Pasuruan.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Inbox className="text-indigo-600" size={20} />
            Daftar Stok Bahan
          </h2>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full flex items-center gap-1">
            <AlertTriangle size={12} /> 3 Bahan Kritis
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {stockItems.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                <p className="text-slate-500 text-xs mt-1">{item.limit}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-extrabold text-slate-800">{item.quantity}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.color}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
