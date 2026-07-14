"use client"
import React, { useState, useEffect } from 'react'
import {
  Users, CheckCircle2, LogOut, Clock, Plus, Search, HelpCircle, History
} from 'lucide-react'

interface CheckInRecord {
  name: string;
  type: 'MASUK' | 'PULANG';
  time: string;
  date: string;
}

export default function KeamananWorkspace() {
  const [search, setSearch] = useState('')
  const [selectedVolunteer, setSelectedVolunteer] = useState('')
  const [status, setStatus] = useState<'MASUK' | 'PULANG'>('MASUK')
  const [timeInput, setTimeInput] = useState('')
  const [history, setHistory] = useState<CheckInRecord[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  // Volunteers sample list
  const volunteersList = [
    'Andi Wijaya', 'Budi Santoso', 'Citra Kirana', 'Dedi Hermawan', 'Eka Saputra',
    'Fitri Handayani', 'Galih Pratama', 'Hadi Sucipto', 'Indah Lestari', 'Joko Susilo'
  ]

  // Filter volunteers based on search query
  const filteredVolunteers = volunteersList.filter(v =>
    v.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    // Initialize time input to current time HH:MM
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    setTimeInput(`${hh}:${mm}`)

    // Load initial attendance history from localStorage
    const savedLogs = localStorage.getItem('sppg_kehadiran_logs')
    if (savedLogs) {
      setHistory(JSON.parse(savedLogs))
    }
  }, [])

  const handleSelectVolunteer = (name: string) => {
    setSelectedVolunteer(name)
    setSearch(name)
    setShowDropdown(false)
  }

  const handleSaveKehadiran = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVolunteer) return

    const now = new Date()
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

    const newRecord: CheckInRecord = {
      name: selectedVolunteer,
      type: status,
      time: timeInput,
      date: dateStr
    }

    const updatedHistory = [newRecord, ...history]
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

    // Clear form
    setSelectedVolunteer('')
    setSearch('')
    
    // Auto-update time
    const updatedNow = new Date()
    const hh = String(updatedNow.getHours()).padStart(2, '0')
    const mm = String(updatedNow.getMinutes()).padStart(2, '0')
    setTimeInput(`${hh}:${mm}`)
  }

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
            Catat jam masuk dan pulang relawan dapur secara real-time untuk audit operasional.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Kehadiran */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 p-5 rounded-lg space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-150">
              <Plus size={16} className="text-emerald-950" /> Log Kehadiran Baru
            </h2>

            <form onSubmit={handleSaveKehadiran} className="space-y-4 text-xs font-semibold">
              
              {/* Search Dropdown */}
              <div className="space-y-1 relative">
                <label className="text-gray-600">Cari Nama Relawan</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setShowDropdown(true)
                      if (!e.target.value) setSelectedVolunteer('')
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Ketik nama relawan..."
                    className="w-full p-2 pl-8 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>
                
                {showDropdown && filteredVolunteers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 shadow-sm max-h-40 overflow-y-auto divide-y divide-gray-100">
                    {filteredVolunteers.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleSelectVolunteer(name)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Radio */}
              <div className="space-y-1">
                <label className="text-gray-600 block mb-1">Status Kehadiran</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'MASUK'}
                      onChange={() => setStatus('MASUK')}
                      className="cursor-pointer"
                    />
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded font-bold text-[10px]">
                      MASUK
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'PULANG'}
                      onChange={() => setStatus('PULANG')}
                      className="cursor-pointer"
                    />
                    <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-bold text-[10px]">
                      PULANG
                    </span>
                  </label>
                </div>
              </div>

              {/* Time Input */}
              <div className="space-y-1">
                <label className="text-gray-600">Waktu / Jam (HH:MM)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    placeholder="Contoh: 07:30"
                    className="w-full p-2 pl-8 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                  />
                  <Clock size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedVolunteer}
                className={`w-full py-2.5 font-bold uppercase rounded border transition ${
                  selectedVolunteer
                    ? 'bg-emerald-900 hover:bg-emerald-950 text-white border-emerald-950 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                Simpan Kehadiran
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Attendance History */}
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
                <p className="text-[10px] text-gray-350 font-normal">Gunakan form di sebelah kiri untuk menambah record.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-gray-200">
                      <th className="px-4 py-2.5">Nama Relawan</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5 text-center">Jam</th>
                      <th className="px-4 py-2.5 text-center">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 font-semibold text-gray-700">
                    {history.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-50/40">
                        <td className="px-4 py-3 font-bold text-slate-800">{rec.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                            rec.type === 'MASUK' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {rec.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400 font-medium">Pukul {rec.time}</td>
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
