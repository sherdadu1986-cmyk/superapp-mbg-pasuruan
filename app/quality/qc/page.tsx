"use client"
import React from 'react'
import { Sparkles, Check } from 'lucide-react'

export default function QCPage() {
  const qcLogs = [
    { id: 'QC-B1', test: 'Uji Organoleptik (Rasa, Aroma, Warna) Nasi Kuning', result: 'Lulus (Sempurna)', tester: 'Siti Aminah', time: '06:15 AM' },
    { id: 'QC-B2', test: 'Uji Organoleptik Ayam Goreng Lengkuas', result: 'Lulus (Kematangan Sesuai)', tester: 'Siti Aminah', time: '06:30 AM' },
    { id: 'QC-B3', test: 'Uji Kebocoran & Penutupan Susu Kotak', result: 'Lulus (Tidak Ada Bocor)', tester: 'Rahmat Hidayat', time: '07:15 AM' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Quality / QC</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">🔬 Quality Control (QC)</h1>
        <p className="text-slate-500 text-sm mt-1">Laporan pengujian kualitas rasa, aroma, kebersihan, dan kelayakan makanan.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={20} />
            Catatan Quality Control Hari Ini
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {qcLogs.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mt-1">
                  <Check size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.test}</h3>
                  <p className="text-slate-600 font-semibold text-sm mt-1">ID Pengujian: {item.id} • Penguji: {item.tester}</p>
                  <p className="text-slate-500 text-xs mt-1">Waktu: {item.time}</p>
                </div>
              </div>
              <div>
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                  {item.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
