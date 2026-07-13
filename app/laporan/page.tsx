"use client"
import React from 'react'
import { FileBarChart2, Download } from 'lucide-react'

export default function LaporanPage() {
  const reports = [
    { title: 'Laporan Distribusi Porsi Makanan Harian', date: 'Juli 2026', type: 'PDF / Excel' },
    { title: 'Laporan Stok & Keluar Masuk Gudang', date: 'Juni 2026', type: 'Excel' },
    { title: 'Laporan Kehadiran & Shift Relawan', date: 'Juli 2026', type: 'PDF' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">📊 Laporan</h1>
        <p className="text-slate-500 text-sm mt-1">Unduh dan tinjau laporan operasional dapur dan logistik SPPG Pasuruan Wonorejo.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <FileBarChart2 className="text-indigo-600" size={20} />
            Daftar Laporan Bulanan
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {reports.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
                <p className="text-slate-500 text-xs mt-1">Periode: {item.date} • Format: {item.type}</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl transition duration-150 w-fit">
                <Download size={16} />
                Unduh Laporan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
