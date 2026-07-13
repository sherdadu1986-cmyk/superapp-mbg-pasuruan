"use client"
import React from 'react'
import { FileSpreadsheet, CheckCircle, Clock } from 'lucide-react'

export default function AbsensiPage() {
  const records = [
    { name: 'Siti Aminah', timeIn: '03:45 AM', status: 'Tepat Waktu' },
    { name: 'Rahmat Hidayat', timeIn: '03:52 AM', status: 'Tepat Waktu' },
    { name: 'Ahmad Yunus', timeIn: '04:10 AM', status: 'Terlambat 10 Menit' },
    { name: 'Slamet Rahardjo', timeIn: '05:00 AM', status: 'Tepat Waktu (Shift Distribusi)' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">SDM / Absensi</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">📝 Absensi Relawan</h1>
        <p className="text-slate-500 text-sm mt-1">Pencatatan kehadiran relawan dapur secara real-time.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-600" size={20} />
            Log Kehadiran Masuk Hari Ini
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {records.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mt-1">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                  <p className="text-slate-500 font-semibold text-sm mt-1">Jam Masuk: {item.timeIn}</p>
                </div>
              </div>
              <div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${item.status.includes('Terlambat') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
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
