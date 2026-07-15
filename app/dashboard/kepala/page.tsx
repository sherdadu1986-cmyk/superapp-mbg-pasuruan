"use client"
import React, { useState, useEffect } from 'react'
import { Users, Clock, Calendar, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'

interface VolunteerDetail {
  name: string;
  jabatan: string;
  divisi: string;
  nik: string;
  status: string;
  noHp: string;
}

interface ActiveVolunteer {
  name: string;
  jamMasuk: string;
  divisi: string;
  jabatan: string;
}

interface CheckInRecord {
  name: string;
  masuk: string;
  pulang: string;
  date: string;
}

// 1. Standardized Date Formatter (locale-independent)
export function getIndonesianDateStr(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${date.getDate()} ${months[date.getMonth()]}`
}

// 2. Live Clock Date & Time Formatter
export function getIndonesianDateTimeStr(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  
  const dayName = days[date.getDay()]
  const day = date.getDate()
  const monthName = months[date.getMonth()]
  const year = date.getFullYear()
  
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  
  return `${dayName}, ${day} ${monthName} ${year} | ${hh}:${mm}:${ss} WIB`
}

export default function DashboardKepala() {
  const [mounted, setMounted] = useState(false)
  const [volunteersCount, setVolunteersCount] = useState(0)
  const [totalVolunteersCount, setTotalVolunteersCount] = useState(0)
  const [activeVolunteers, setActiveVolunteers] = useState<ActiveVolunteer[]>([])
  const [timeStr, setTimeStr] = useState('')

  const updateStats = () => {
    // 1. Get total registered volunteers
    const storedVolunteers = localStorage.getItem('sppg_volunteers')
    let totalCount = 0
    if (storedVolunteers) {
      try {
        totalCount = JSON.parse(storedVolunteers).length
      } catch {}
    }
    setTotalVolunteersCount(totalCount)

    // 2. Load detail mapping to resolve division/position
    const storedDetails = localStorage.getItem('sppg_volunteers_details')
    let detailsMap: Record<string, VolunteerDetail> = {}
    if (storedDetails) {
      try {
        const detailsList: VolunteerDetail[] = JSON.parse(storedDetails)
        detailsList.forEach(v => {
          detailsMap[v.name] = v
        })
      } catch {}
    }

    // 3. Count active present volunteers and build list
    const savedLogs = localStorage.getItem('sppg_kehadiran_logs')
    let presentCount = 0
    const activeList: ActiveVolunteer[] = []

    if (savedLogs) {
      try {
        const logs: CheckInRecord[] = JSON.parse(savedLogs)
        if (Array.isArray(logs)) {
          const todayStr = getIndonesianDateStr(new Date())
          
          logs.forEach((rec: CheckInRecord) => {
            if (rec.date === todayStr && rec.masuk && rec.masuk !== '-' && rec.pulang === '-') {
              presentCount++
              const detail = detailsMap[rec.name]
              activeList.push({
                name: rec.name,
                jamMasuk: rec.masuk,
                divisi: detail?.divisi || 'Tim Dapur',
                jabatan: detail?.jabatan || 'Relawan Dapur'
              })
            }
          })
        }
      } catch {}
    }
    
    setVolunteersCount(presentCount)
    setActiveVolunteers(activeList)
  }

  useEffect(() => { 
    setMounted(true) 
    updateStats()

    // 1. Storage Event Listener (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sppg_kehadiran_logs' || e.key === 'sppg_volunteers' || e.key === 'sppg_volunteers_details') {
        updateStats()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // 2. Short Polling fallback (same-tab updates)
    const pollId = setInterval(updateStats, 2000)

    // 3. Live Clock ticking every second
    const tickClock = () => {
      setTimeStr(getIndonesianDateTimeStr(new Date()))
    }
    tickClock()
    const clockId = setInterval(tickClock, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(pollId)
      clearInterval(clockId)
    }
  }, [])

  const percent = totalVolunteersCount > 0 ? Math.round((volunteersCount / totalVolunteersCount) * 100) : 0

  // Weekly attendance chart data using the today's dynamic percentage
  const chartData = [
    { name: 'Senin', Presentase: 80 },
    { name: 'Selasa', Presentase: 85 },
    { name: 'Rabu', Presentase: 90 },
    { name: 'Kamis', Presentase: 88 },
    { name: 'Jumat', Presentase: 95 },
    { name: 'Sabtu', Presentase: 75 },
    { name: 'Minggu (Hari Ini)', Presentase: percent }
  ]

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen text-slate-800 font-sans">
      {/* Welcome Banner Flat */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-900 text-white text-[10px] font-bold rounded uppercase tracking-wider">
              Kepala SPPG
            </span>
            <span className="text-xs text-gray-500 font-medium">Wonorejo · Live Monitoring Kehadiran</span>
          </div>
          <h1 className="text-xl font-bold text-emerald-950">Dashboard Monitoring Kehadiran Relawan</h1>
          <p className="text-gray-600 text-xs font-semibold mt-1">
            Sugeng Rawuh, Ahmad Sayyidani Haqiqi, S.Pd. | <span className="text-emerald-750 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold ml-1">{timeStr || 'Memuat waktu...'}</span>
          </p>
        </div>
      </div>

      {/* METRIC CARD: RELAWAN HADIR */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-100 flex-shrink-0">
            <Users size={32} />
          </div>
          <div>
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block">Relawan Hadir Saat Ini</span>
            <span className="text-4xl font-extrabold text-slate-900 mt-1 block tracking-tight">
              {volunteersCount} <span className="text-slate-400 text-xl font-semibold">/ {totalVolunteersCount} Orang</span>
            </span>
          </div>
        </div>
        
        <div className="w-full md:w-80 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Rasio Kehadiran</span>
            <span className="text-emerald-700">{percent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column Left: Weekly Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6 rounded-lg flex flex-col justify-between shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={16} className="text-emerald-900" /> Grafik Tren Kehadiran Relawan Mingguan
              </h3>
              <p className="text-xs text-gray-400">Rasio persentase kehadiran relawan dapur per hari.</p>
            </div>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">Mingguan</span>
          </div>
          
          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPresentase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }} formatter={(value) => [`${value}%`, 'Kehadiran']} />
                  <Area type="monotone" dataKey="Presentase" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPresentase)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">Memuat visualisasi...</div>
            )}
          </div>
        </div>

        {/* Column Right: Active Roster Table */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg flex flex-col shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-1.5">
            <Clock size={16} className="text-emerald-900" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Relawan Dapur Aktif Saat Ini</h3>
          </div>

          <div className="flex-1 overflow-y-auto max-h-72">
            {activeVolunteers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-semibold text-xs space-y-1 h-full flex flex-col items-center justify-center">
                <Calendar className="text-gray-300 mb-2" size={32} />
                <p>Tidak ada relawan aktif di dapur saat ini.</p>
                <p className="text-[10px] text-gray-350 font-normal">Menunggu absensi MASUK dari Pos Keamanan.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-gray-150">
                    <th className="px-4 py-2.5">Nama</th>
                    <th className="px-4 py-2.5 text-center">Masuk</th>
                    <th className="px-4 py-2.5">Divisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                  {activeVolunteers.map((vol, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-850">{vol.name}</td>
                      <td className="px-4 py-3 text-center text-emerald-700 font-bold">{vol.jamMasuk}</td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{vol.divisi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
