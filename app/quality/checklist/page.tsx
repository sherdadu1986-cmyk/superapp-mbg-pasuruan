"use client"
import React from 'react'
import { CheckSquare, ShieldCheck } from 'lucide-react'

export default function ChecklistPage() {
  const checklists = [
    { task: 'Sanitasi Area Masak Sebelum Produksi', category: 'Kebersihan', inspector: 'Siti Aminah', time: '04:00 AM', status: 'Lolos' },
    { task: 'Pengecekan Suhu Daging Ayam Masuk', category: 'Bahan Baku', inspector: 'Slamet Rahardjo', time: '05:30 AM', status: 'Lolos' },
    { task: 'Pengecekan Rasa & Kematangan Makanan', category: 'Hasil Masakan', inspector: 'Siti Aminah', time: '07:00 AM', status: 'Lolos' },
    { task: 'Higienitas Wadah Box & Labeling', category: 'Packing', inspector: 'Rahmat Hidayat', time: '07:30 AM', status: 'Lolos' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Quality / Checklist</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">🛡 Checklist Harian</h1>
        <p className="text-slate-500 text-sm mt-1">Daftar pemeriksaan standar prosedur (SOP) harian untuk menjamin mutu.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="text-indigo-600" size={20} />
            Checklist SOP Operasional Hari Ini
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {checklists.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mt-1">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.task}</h3>
                  <p className="text-slate-600 font-semibold text-sm mt-1">Kategori: {item.category} • Pemeriksa: {item.inspector}</p>
                  <p className="text-slate-500 text-xs mt-1">Waktu: {item.time}</p>
                </div>
              </div>
              <div>
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
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
