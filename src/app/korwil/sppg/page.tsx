"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  BarChart3, LogOut, Settings, Map, Camera, Users, Database,
  Search, ChevronRight, MapPin, Building2, Loader2, ArrowLeft
} from 'lucide-react'

export default function KorwilSPPGListPage() {
  const router = useRouter()
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchUnits = async () => {
      setLoading(true)
      const { data } = await supabase.from('daftar_sppg').select('*').order('nama_unit')
      if (data) setUnits(data)
      setLoading(false)
    }
    fetchUnits()
  }, [])

  const filtered = units.filter(u =>
    u.nama_unit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.kecamatan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.kepala_unit?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-800 font-sans relative overflow-hidden">

      {/* DECORATIVE BLOBS */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-400/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-[-80px] left-[-60px] w-[400px] h-[400px] bg-emerald-400/15 rounded-full blur-3xl pointer-events-none z-0" />

      {/* SIDEBAR */}
      <aside className="w-24 lg:w-72 bg-white/40 backdrop-blur-xl border-r border-white/50 fixed h-full z-50 transition-all" style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(255,255,255,0.3), 0 10px 40px -10px rgba(0,0,0,0.08)' }}>
        <div className="p-8 border-b border-white/20 flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
            <Settings size={24} />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-black tracking-tighter text-xl italic text-slate-900 uppercase leading-none">KORWIL</h1>
            <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase mt-1">Control Panel</p>
          </div>
        </div>

        <nav className="p-6 space-y-3">
          <button onClick={() => router.push('/korwil')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-slate-500 hover:bg-white/50 hover:text-slate-800">
            <BarChart3 size={20} />
            <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Monitoring</span>
          </button>
          <button onClick={() => router.push('/korwil/monitoring-wilayah')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-slate-500 hover:bg-white/50 hover:text-slate-800">
            <Map size={20} />
            <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Peta Wilayah</span>
          </button>
          <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 bg-indigo-600 text-white shadow-xl shadow-indigo-600/10">
            <Database size={20} />
            <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Data SPPG</span>
          </button>
          <button onClick={() => router.push('/korwil')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-slate-500 hover:bg-white/50 hover:text-slate-800">
            <Camera size={20} />
            <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Galeri</span>
          </button>
          <button onClick={() => router.push('/korwil/akun')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-slate-500 hover:bg-white/50 hover:text-slate-800">
            <Users size={20} />
            <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Akun Pengguna</span>
          </button>
        </nav>

        <div className="absolute bottom-8 w-full px-6">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-xs uppercase tracking-widest">
            <LogOut size={20} />
            <span className="hidden lg:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="pl-24 lg:pl-72 p-6 transition-all">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* HEADER */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Data SPPG</h2>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <Database size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{units.length} Unit Terdaftar</span>
                </div>
              </div>
            </div>

            {/* SEARCH */}
            <div className="w-full md:w-80 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama SPPG, kecamatan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 placeholder:text-slate-400"
              />
            </div>
          </header>

          {/* TABLE */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest animate-pulse">Memuat data SPPG...</p>
            </div>
          ) : (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm overflow-hidden" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">No</th>
                      <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama SPPG</th>
                      <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kecamatan</th>
                      <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kepala Dapur</th>
                      <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</th>
                      <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, index) => (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors group">
                        <td className="py-3 px-5 text-sm text-slate-400 font-medium">{index + 1}</td>
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <Building2 size={14} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{u.nama_unit}</span>
                          </div>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-slate-300" />
                            <span className="text-sm text-slate-500 font-medium">{u.kecamatan || '—'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-sm text-slate-600 font-medium">{u.kepala_unit || '—'}</td>
                        <td className="py-3 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            Aktif
                          </span>
                        </td>
                        <td className="py-3 px-5 text-center">
                          <button
                            onClick={() => router.push(`/korwil/sppg/${u.id}`)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                          >
                            Lihat Detail <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="py-16 text-center text-xs text-slate-300 font-medium">Tidak ditemukan unit SPPG yang sesuai</div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
