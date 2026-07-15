"use client"
import React, { useState, useEffect } from 'react'
import { FileSpreadsheet, CheckCircle, Clock } from 'lucide-react'

interface CheckInRecord {
  name: string;
  masuk: string;  // "HH:MM" or "-"
  pulang: string; // "HH:MM" or "-"
  date: string;
}

export default function AbsensiPage() {
  const [records, setRecords] = useState<CheckInRecord[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedLogs = localStorage.getItem('sppg_kehadiran_logs')
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs)
        if (Array.isArray(parsed)) {
          const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
          // Filter logs for today
          const todayLogs = parsed.filter((rec: any) => rec.date === todayStr)
          setRecords(todayLogs)
        }
      } catch {
        setRecords([])
      }
    }
  }, [])

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
          {!mounted ? (
            <div className="p-8 text-center text-slate-400 text-sm font-semibold">
              Memuat data absensi...
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-semibold">
              Belum ada data absensi masuk hari ini.
            </div>
          ) : (
            records.map((item, index) => {
              const isActive = item.masuk !== '-' && item.pulang === '-'
              const statusText = isActive ? 'Aktif Bekerja (Di Dapur)' : 'Selesai Shift (Sudah Pulang)'
              return (
                <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl mt-1 ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-slate-500 font-semibold text-sm">
                        <span>Jam Masuk: {item.masuk}</span>
                        {item.pulang !== '-' && (
                          <span className="hidden sm:inline text-slate-300">|</span>
                        )}
                        <span>Jam Pulang: {item.pulang === '-' ? 'Belum Pulang' : item.pulang}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                      {statusText}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
