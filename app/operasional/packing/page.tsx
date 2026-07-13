"use client"
import React from 'react'
import { Package, ShieldAlert, Archive } from 'lucide-react'

export default function PackingPage() {
  const packs = [
    { id: 'PK-001', destination: 'Zonasi Wonorejo A (SDN 1 Wonorejo)', quantity: '450 Box', status: 'Selesai Packing', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'PK-002', destination: 'Zonasi Wonorejo B (SDN 2 Wonorejo)', quantity: '380 Box', status: 'Sedang Proses', color: 'bg-amber-100 text-amber-700' },
    { id: 'PK-003', destination: 'Zonasi Wonorejo C (SMPN 1 Wonorejo)', quantity: '820 Box', status: 'Antrean', color: 'bg-slate-100 text-slate-600' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Operasional / Packing</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">📦 Packing & Pengemasan</h1>
        <p className="text-slate-500 text-sm mt-1">Pemantauan kualitas, higienitas, dan pelabelan kotak makanan sebelum distribusi.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Archive className="text-indigo-600" size={20} />
            Daftar Batch Packing Hari Ini
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-3 py-1 rounded-full">
            Status Live
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {packs.map((item) => (
            <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 text-slate-600 rounded-xl mt-1">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.id} - {item.destination}</h3>
                  <p className="text-slate-600 font-semibold text-sm mt-1">Jumlah: {item.quantity}</p>
                </div>
              </div>
              <div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${item.color}`}>
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
