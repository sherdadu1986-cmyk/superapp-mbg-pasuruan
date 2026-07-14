"use client"
import React, { useState, useEffect } from 'react'
import {
  Users, CheckCircle2, Clock, Plus, Search, History, ChevronDown, UserCheck, Download
} from 'lucide-react'

interface CheckInRecord {
  name: string;
  masuk: string;  // "HH:MM" or "-"
  pulang: string; // "HH:MM" or "-"
  date: string;
}

export default function KeamananWorkspace() {
  const [selectedVolunteer, setSelectedVolunteer] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [status, setStatus] = useState<'MASUK' | 'PULANG' | null>(null)
  
  const [selectedHour, setSelectedHour] = useState('')
  const [selectedMinute, setSelectedMinute] = useState('')
  
  const [history, setHistory] = useState<CheckInRecord[]>([])
  const [currentTime, setCurrentTime] = useState<string>('')
  
  // Centralized volunteer list loaded from localStorage
  const [volunteersList, setVolunteersList] = useState<string[]>([])

  useEffect(() => {
    // 1. Initialize scrolling select options to current time
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    setSelectedHour(hh)
    setSelectedMinute(mm)

    // 2. Initialize centralized volunteer list database in localStorage if not exists
    const storedVolunteers = localStorage.getItem('sppg_volunteers')
    if (storedVolunteers) {
      setVolunteersList(JSON.parse(storedVolunteers))
    } else {
      const defaultList = [
        'Andi Wijaya', 'Budi Santoso', 'Citra Kirana', 'Dedi Hermawan', 'Eka Saputra',
        'Fitri Handayani', 'Galih Pratama', 'Hadi Sucipto', 'Indah Lestari', 'Joko Susilo'
      ]
      localStorage.setItem('sppg_volunteers', JSON.stringify(defaultList))
      setVolunteersList(defaultList)
    }

    // 3. Load initial attendance history from localStorage
    const savedLogs = localStorage.getItem('sppg_kehadiran_logs')
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs)
        if (parsed.length > 0 && ('masuk' in parsed[0] || 'pulang' in parsed[0])) {
          setHistory(parsed)
        }
      } catch {
        setHistory([])
      }
    }

    // 4. Start Live Clock
    const updateTime = () => {
      const date = new Date()
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      const dateStr = date.toLocaleDateString('id-ID', options)
      const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setCurrentTime(`${dateStr} | ${timeStr} WIB`)
    }

    updateTime()
    const timerId = setInterval(updateTime, 1000)

    return () => clearInterval(timerId)
  }, [])

  const handleSelectVolunteer = (name: string) => {
    setSelectedVolunteer(name)
    setShowDropdown(false)
    setStatus(null)
  }

  // Calculate total work duration dynamically
  const calculateTotalHours = (masuk: string, pulang: string): string => {
    if (masuk === '-' || pulang === '-') return '-'
    try {
      const [h1, m1] = masuk.split(':').map(Number)
      const [h2, m2] = pulang.split(':').map(Number)
      let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1)
      if (diffMinutes < 0) {
        // Handle overnight wrap-around just in case
        diffMinutes += 24 * 60
      }
      const hrs = Math.floor(diffMinutes / 60)
      const mins = diffMinutes % 60
      
      if (mins === 0) return `${hrs} Jam`
      return `${hrs} Jam ${mins} Menit`
    } catch {
      return '-'
    }
  }

  const handleSaveKehadiran = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVolunteer || !status || !selectedHour || !selectedMinute) return

    const now = new Date()
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    const timeStr = `${selectedHour}:${selectedMinute}`

    const existingIndex = history.findIndex(
      (rec) => rec.name === selectedVolunteer && rec.date === dateStr
    )

    let updatedHistory = [...history]

    if (existingIndex !== -1) {
      if (status === 'MASUK') {
        updatedHistory[existingIndex].masuk = timeStr
      } else {
        updatedHistory[existingIndex].pulang = timeStr
      }
    } else {
      const newRecord: CheckInRecord = {
        name: selectedVolunteer,
        masuk: status === 'MASUK' ? timeStr : '-',
        pulang: status === 'PULANG' ? timeStr : '-',
        date: dateStr
      }
      updatedHistory = [newRecord, ...updatedHistory]
    }

    setHistory(updatedHistory)
    localStorage.setItem('sppg_kehadiran_logs', JSON.stringify(updatedHistory))

    const activeVolunteersSaved = localStorage.getItem('sppg_active_volunteers')
    let activeVolunteers: string[] = activeVolunteersSaved ? JSON.parse(activeVolunteersSaved) : []

    if (status === 'MASUK') {
      if (!activeVolunteers.includes(selectedVolunteer)) {
        activeVolunteers.push(selectedVolunteer)
      }
    } else {
      activeVolunteers = activeVolunteers.filter(v => v !== selectedVolunteer)
    }

    localStorage.setItem('sppg_active_volunteers', JSON.stringify(activeVolunteers))

    setSelectedVolunteer('')
    setStatus(null)

    const updatedNow = new Date()
    setSelectedHour(String(updatedNow.getHours()).padStart(2, '0'))
    setSelectedMinute(String(updatedNow.getMinutes()).padStart(2, '0'))
  }

  // Export Table Data to Excel (CSV format)
  const handleExportExcel = () => {
    if (history.length === 0) return

    const headers = ['NO', 'NAMA RELAWAN', 'JAM MASUK', 'JAM PULANG', 'TOTAL JAM KERJA', 'TANGGAL']
    const rows = history.map((rec, i) => [
      `"${i + 1}"`,
      `"${rec.name}"`,
      `"${rec.masuk}"`,
      `"${rec.pulang}"`,
      `"${calculateTotalHours(rec.masuk, rec.pulang)}"`,
      `"${rec.date}"`
    ])

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `log_kehadiran_relawan_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const hours = Array.from({ length: 24 }).map((_, i) => String(i).padStart(2, '0'))
  const minutes = Array.from({ length: 60 }).map((_, i) => String(i).padStart(2, '0'))

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen text-slate-800 font-sans">
      
      {/* Banner / Header */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-900 text-white text-[10px] font-bold rounded uppercase tracking-wider">
              Keamanan
            </span>
            <span className="text-xs text-gray-500 font-medium">Wonorejo · Lembar Kerja</span>
          </div>
          <h1 className="text-xl font-bold text-emerald-950">Pencatatan Kehadiran Relawan Harian</h1>
          
          {/* Live Clock Component */}
          {currentTime && (
            <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 animate-fadeIn">
              <Clock size={13} className="text-emerald-900 animate-pulse" />
              {currentTime}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Step-by-Step Absensi Kehadiran Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 p-5 rounded-lg space-y-5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-150">
              <Users size={16} className="text-emerald-950" /> Absensi Kehadiran Relawan
            </h2>

            <form onSubmit={handleSaveKehadiran} className="space-y-5 text-xs font-semibold">
              
              {/* LANGKAH 1: Pilih Nama Relawan */}
              <div className="space-y-1.5 relative">
                <label className="text-gray-500 block">Langkah 1: Pilih Nama Relawan</label>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full flex items-center justify-between p-2.5 border border-gray-200 rounded bg-white text-gray-700 hover:border-gray-300 transition text-left cursor-pointer"
                >
                  <span className="font-bold truncate">
                    {selectedVolunteer ? selectedVolunteer : 'Pilih Nama Relawan'}
                  </span>
                  <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                </button>

                {showDropdown && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 shadow max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {volunteersList.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleSelectVolunteer(name)}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-50 font-bold transition cursor-pointer flex items-center justify-between ${
                          selectedVolunteer === name ? 'text-emerald-900 bg-emerald-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span>{name}</span>
                        {selectedVolunteer === name && <UserCheck size={12} className="text-emerald-900" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* LANGKAH 2: Pilih Status */}
              {selectedVolunteer && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-gray-500 block">Langkah 2: Tentukan Status Kehadiran</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStatus('MASUK')}
                      className={`py-3 rounded-lg border font-bold text-center transition cursor-pointer ${
                        status === 'MASUK'
                          ? 'bg-emerald-900 border-emerald-950 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      MASUK
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('PULANG')}
                      className={`py-3 rounded-lg border font-bold text-center transition cursor-pointer ${
                        status === 'PULANG'
                          ? 'bg-amber-600 border-amber-700 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      PULANG
                    </button>
                  </div>
                </div>
              )}

              {/* LANGKAH 3: Pilih Jam */}
              {selectedVolunteer && status && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-gray-500 block">Langkah 3: Atur Waktu Absensi</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <select
                        value={selectedHour}
                        onChange={(e) => setSelectedHour(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded bg-white text-gray-700 font-bold outline-none cursor-pointer"
                      >
                        {hours.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <span className="font-extrabold text-slate-400 text-sm">:</span>
                    <div className="flex-1">
                      <select
                        value={selectedMinute}
                        onChange={(e) => setSelectedMinute(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded bg-white text-gray-700 font-bold outline-none cursor-pointer"
                      >
                        {minutes.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {selectedVolunteer && status && selectedHour && selectedMinute && (
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white font-bold uppercase rounded border border-emerald-950 transition cursor-pointer animate-fadeIn"
                >
                  Simpan Kehadiran
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Consolidated Attendance History Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <History size={16} className="text-emerald-950" /> Log Kehadiran Hari Ini
              </h2>
              
              {/* Export to Excel Button */}
              {history.length > 0 && (
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-slate-50 text-slate-700 hover:text-emerald-900 font-bold text-[10px] uppercase rounded transition cursor-pointer"
                >
                  <Download size={12} className="text-emerald-900" />
                  Ekspor Excel
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-semibold text-xs space-y-1">
                <Users className="mx-auto text-gray-300 mb-2" size={32} />
                <p>Belum ada data kehadiran yang tercatat.</p>
                <p className="text-[10px] text-gray-350 font-normal">Ikuti langkah-langkah di sebelah kiri untuk mengabsen.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-gray-200">
                      <th className="px-4 py-2.5 text-center w-12">No</th>
                      <th className="px-4 py-2.5">Nama Relawan</th>
                      <th className="px-4 py-2.5 text-center">Jam Masuk</th>
                      <th className="px-4 py-2.5 text-center">Jam Pulang</th>
                      <th className="px-4 py-2.5 text-center">Total Jam Kerja</th>
                      <th className="px-4 py-2.5 text-center">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 font-semibold text-gray-700">
                    {history.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-50/40">
                        <td className="px-4 py-3 text-center text-slate-400 font-bold">{i + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{rec.name}</td>
                        <td className="px-4 py-3 text-center text-slate-800 font-medium">
                          {rec.masuk}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-800 font-medium">
                          {rec.pulang}
                        </td>
                        <td className="px-4 py-3 text-center text-emerald-950 font-bold">
                          {calculateTotalHours(rec.masuk, rec.pulang)}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">{rec.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
