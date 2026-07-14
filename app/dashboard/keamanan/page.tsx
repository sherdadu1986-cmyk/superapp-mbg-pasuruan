"use client"
import React, { useState, useEffect } from 'react'
import {
  Users, CheckCircle2, Clock, Plus, Search, History, ChevronDown, UserCheck
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

  // Volunteers sample list
  const volunteersList = [
    'Andi Wijaya', 'Budi Santoso', 'Citra Kirana', 'Dedi Hermawan', 'Eka Saputra',
    'Fitri Handayani', 'Galih Pratama', 'Hadi Sucipto', 'Indah Lestari', 'Joko Susilo'
  ]

  useEffect(() => {
    // Initialize scrolling select options to current time
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    setSelectedHour(hh)
    setSelectedMinute(mm)

    // Load initial attendance history from localStorage
    const savedLogs = localStorage.getItem('sppg_kehadiran_logs')
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs)
        // Ensure backward compatibility or clean start with the new schema
        if (parsed.length > 0 && ('masuk' in parsed[0] || 'pulang' in parsed[0])) {
          setHistory(parsed)
        } else {
          setHistory([])
        }
      } catch {
        setHistory([])
      }
    }
  }, [])

  const handleSelectVolunteer = (name: string) => {
    setSelectedVolunteer(name)
    setShowDropdown(false)
    setStatus(null)
  }

  const handleSaveKehadiran = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVolunteer || !status || !selectedHour || !selectedMinute) return

    const now = new Date()
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    const timeStr = `${selectedHour}:${selectedMinute}`

    // Check if there is an existing record for the same volunteer and date
    const existingIndex = history.findIndex(
      (rec) => rec.name === selectedVolunteer && rec.date === dateStr
    )

    let updatedHistory = [...history]

    if (existingIndex !== -1) {
      // Update existing record
      if (status === 'MASUK') {
        updatedHistory[existingIndex].masuk = timeStr
      } else {
        updatedHistory[existingIndex].pulang = timeStr
      }
    } else {
      // Create a new record
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

    // Manage active checked-in volunteers in localStorage
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

    // Clear / Reset form steps
    setSelectedVolunteer('')
    setStatus(null)

    // Reset clock to current time
    const updatedNow = new Date()
    setSelectedHour(String(updatedNow.getHours()).padStart(2, '0'))
    setSelectedMinute(String(updatedNow.getMinutes()).padStart(2, '0'))
  }

  // Generate options for jam (00-23) & menit (00-59)
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
          <p className="text-gray-500 text-xs font-medium">
            Alur absensi relawan masuk dan pulang tanpa ketik, terintegrasi reaktif dengan Dapur Wonorejo.
          </p>
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
                      <th className="px-4 py-2.5">Nama Relawan</th>
                      <th className="px-4 py-2.5 text-center">Jam Masuk</th>
                      <th className="px-4 py-2.5 text-center">Jam Pulang</th>
                      <th className="px-4 py-2.5 text-center">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 font-semibold text-gray-700">
                    {history.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-50/40">
                        <td className="px-4 py-3 font-bold text-slate-800">{rec.name}</td>
                        <td className="px-4 py-3 text-center text-slate-800 font-medium">
                          {rec.masuk}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-800 font-medium">
                          {rec.pulang}
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
