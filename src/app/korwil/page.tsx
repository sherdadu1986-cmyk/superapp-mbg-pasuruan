"use client"
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  BarChart3, LogOut, CheckCircle2, ChevronRight, Settings,
  Utensils, School, Box, Activity, Users, Baby, GraduationCap,
  Clock, MapPin, AlertTriangle, Camera, X, ImageIcon
} from 'lucide-react'

export default function SuperKorwilPage() {
  const router = useRouter()

  // --- VIEW STATE ---
  const [activeView, setActiveView] = useState<'monitoring' | 'galeri'>('monitoring')

  // --- MONITORING STATE ---
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [units, setUnits] = useState<any[]>([])
  const [laporan, setLaporan] = useState<any[]>([])
  const KATEGORI_PM = ["PAUD/KB", "TK/RA", "SD/MI", "SMP/MTS", "SMA/SMK", "SANTRI", "BALITA", "BUMIL", "BUSUI"]
  const [statsPorsi, setStatsPorsi] = useState<Record<string, number>>({})
  const [totalPorsiHarian, setTotalPorsiHarian] = useState(0)

  // --- GALERI STATE ---
  const [galeriData, setGaleriData] = useState<any[]>([])
  const [galeriLoading, setGaleriLoading] = useState(false)
  const [selectedFoto, setSelectedFoto] = useState<any>(null)

  // --- FETCH MONITORING ---
  const fetchData = useCallback(async () => {
    const { data: u } = await supabase.from('daftar_sppg').select('*').order('nama_unit')
    const { data: l } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', tanggal)
    const { data: s } = await supabase.from('daftar_sekolah').select('id, jenjang')

    if (u) setUnits(u)
    if (l && s) {
      setLaporan(l)

      let mapping: Record<string, number> = {}
      KATEGORI_PM.forEach(k => mapping[k] = 0)
      let total = 0

      l.forEach(lap => {
        const realisasi = lap.realisasi_sekolah || {}
        Object.entries(realisasi).forEach(([sekolahId, porsi]) => {
          const porsiNum = Number(porsi) || 0
          total += porsiNum

          const sekolahInfo = s.find(item => item.id === sekolahId)
          if (sekolahInfo) {
            const jenjang = sekolahInfo.jenjang?.toUpperCase() || ''
            const targetKat = KATEGORI_PM.find(k => jenjang.includes(k.split('/')[0]))
            if (targetKat) {
              mapping[targetKat] += porsiNum
            } else {
              mapping["SD/MI"] += porsiNum
            }
          }
        })
      })

      setStatsPorsi(mapping)
      setTotalPorsiHarian(total)
    }
  }, [tanggal])

  // --- FETCH GALERI ---
  const fetchGaleri = useCallback(async () => {
    setGaleriLoading(true)
    const { data } = await supabase
      .from('laporan_harian_final')
      .select('id, foto_url, nama_unit, menu_makanan, tanggal_ops')
      .eq('tanggal_ops', tanggal)
      .not('foto_url', 'is', null)
      .neq('foto_url', '')
      .order('tanggal_ops', { ascending: false })

    setGaleriData(data || [])
    setGaleriLoading(false)
  }, [tanggal])

  // --- EFFECTS (fixed: removed laporan.length to prevent infinite loop) ---
  useEffect(() => { fetchData() }, [tanggal, fetchData])
  useEffect(() => { if (activeView === 'galeri') fetchGaleri() }, [activeView, tanggal, fetchGaleri])

  // --- ESC key to close modal ---
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedFoto(null) }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const progres = units.length > 0 ? Math.round((laporan.length / units.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-indigo-500/30">

      {/* ============================================ */}
      {/* SIDEBAR COMMAND CENTER                      */}
      {/* ============================================ */}
      <aside className="w-24 lg:w-72 bg-[#1E293B]/50 backdrop-blur-xl border-r border-white/5 fixed h-full z-50 transition-all">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
            <Settings size={24} />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-black tracking-tighter text-xl italic text-white uppercase leading-none">KORWIL</h1>
            <p className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase mt-1">Control Panel</p>
          </div>
        </div>

        <nav className="p-6 space-y-3">
          <button
            onClick={() => setActiveView('monitoring')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeView === 'monitoring' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <BarChart3 size={20} />
            <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Monitoring</span>
          </button>
          <button
            onClick={() => setActiveView('galeri')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeView === 'galeri' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Camera size={20} />
            <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Galeri</span>
          </button>
        </nav>

        <div className="absolute bottom-8 w-full px-6">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-xs uppercase tracking-widest">
            <LogOut size={20} />
            <span className="hidden lg:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ============================================ */}
      {/* MAIN CONTENT                                */}
      {/* ============================================ */}
      <main className="pl-24 lg:pl-72 p-8 transition-all">
        <div className="max-w-7xl mx-auto space-y-10">

          {activeView === 'monitoring' ? (
            <>
              {/* ======== MONITORING VIEW ======== */}
              {/* TOP HEADER */}
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Infografis Wilayah</h2>
                  <div className="flex items-center gap-4 mt-4 text-slate-500">
                    <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5">
                      <MapPin size={14} className="text-indigo-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Kab. Pasuruan</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5">
                      <Clock size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Ops Date: {tanggal}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-2xl">
                  <span className="text-[9px] font-black text-slate-500 px-4 uppercase tracking-widest">Filter Laporan</span>
                  <input type="date" className="bg-slate-900 border-none rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer" value={tanggal} onChange={e => setTanggal(e.target.value)} />
                </div>
              </header>

              {/* ROW 1: PROGRES & TOTAL PORSI */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[3rem] shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em] mb-2">Progres Pengiriman SPPG</p>
                        <h3 className="text-6xl font-black italic tracking-tighter text-white">{progres}%</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Status Laporan</p>
                        <p className="text-xl font-black text-white">{laporan.length} / {units.length} UNIT</p>
                      </div>
                    </div>
                    <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
                      <div style={{ width: `${progres}%` }} className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-1000"></div>
                    </div>
                  </div>
                  <BarChart3 className="absolute -right-8 -bottom-8 text-white/5 rotate-12 transition-transform group-hover:scale-110" size={250} />
                </div>

                <div className="bg-[#1E293B] border border-white/5 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-center relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Total Distribusi Hari Ini</p>
                    <h4 className="text-6xl font-black italic tracking-tighter text-white group-hover:text-indigo-400 transition-colors">{totalPorsiHarian.toLocaleString()}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-4 flex items-center gap-2 tracking-widest leading-none">
                      <Box size={14} className="text-indigo-500" /> Paket Porsi Terkirim
                    </p>
                  </div>
                  <Box className="absolute -right-4 -bottom-4 text-white/5 opacity-20" size={120} />
                </div>
              </div>

              {/* ROW 2: GRID KATEGORI DINAMIS */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {KATEGORI_PM.map((kat) => (
                  <div key={kat} className={`p-8 rounded-[2.5rem] border transition-all duration-500 group ${statsPorsi[kat] > 0 ? 'bg-[#1E293B] border-white/10 hover:border-indigo-500/50 shadow-lg' : 'bg-slate-900/50 border-white/5 opacity-40'}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${statsPorsi[kat] > 0 ? 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-slate-800 text-slate-600'}`}>
                      {kat.includes('TK') || kat.includes('PAUD') ? <School size={24} /> :
                        kat.includes('BALITA') || kat.includes('BUMIL') ? <Baby size={24} /> :
                          kat.includes('SMP') || kat.includes('SMA') ? <GraduationCap size={24} /> :
                            kat.includes('SANTRI') ? <Users size={24} /> : <Activity size={24} />}
                    </div>
                    <h5 className="text-3xl font-black text-white leading-none tracking-tighter italic">{statsPorsi[kat]?.toLocaleString() || 0}</h5>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-3">{kat}</p>
                  </div>
                ))}
              </div>

              {/* ROW 3: LIST STATUS UNIT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6">
                {/* UNIT BELUM LAPOR */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                      <AlertTriangle size={18} className="animate-pulse" /> Urgent: Belum Lapor
                    </h3>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{units.length - laporan.length} Unit</span>
                  </div>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {units.filter(u => !laporan.find(l => l.unit_id === u.id)).map(u => (
                      <div key={u.id} onClick={() => router.push(`/korwil/detail/${u.id}`)} className="bg-slate-800/40 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center group cursor-pointer hover:bg-rose-500/5 hover:border-rose-500/30 transition-all">
                        <span className="text-xs font-black text-slate-400 group-hover:text-white uppercase italic transition-colors tracking-tighter">{u.nama_unit}</span>
                        <ChevronRight className="text-slate-700 group-hover:text-rose-500 transition-transform group-hover:translate-x-2" size={20} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* UNIT SUDAH LAPOR */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                      <CheckCircle2 size={18} /> Verified: Laporan Masuk
                    </h3>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{laporan.length} Unit</span>
                  </div>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {laporan.map(l => (
                      <div key={l.id} onClick={() => router.push(`/korwil/detail/${l.unit_id}`)} className="bg-slate-800/40 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center group cursor-pointer hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-5">
                          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                            <Utensils size={18} />
                          </div>
                          <span className="text-xs font-black text-slate-400 group-hover:text-white uppercase italic transition-colors tracking-tighter">{l.nama_unit}</span>
                        </div>
                        <ChevronRight className="text-slate-700 group-hover:text-emerald-500 transition-transform group-hover:translate-x-2" size={20} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ======== GALERI VIEW ======== */}
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Galeri Dokumentasi</h2>
                  <div className="flex items-center gap-4 mt-4 text-slate-500">
                    <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5">
                      <Camera size={14} className="text-indigo-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Bukti Operasional Harian</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5">
                      <Clock size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{tanggal}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-2xl">
                  <span className="text-[9px] font-black text-slate-500 px-4 uppercase tracking-widest">Filter Tanggal</span>
                  <input type="date" className="bg-slate-900 border-none rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer" value={tanggal} onChange={e => setTanggal(e.target.value)} />
                </div>
              </header>

              {/* GALLERY COUNTER */}
              <div className="flex items-center gap-4">
                <div className="bg-[#1E293B] border border-white/5 px-8 py-4 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white italic tracking-tighter leading-none">{galeriData.length}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Foto Masuk</p>
                  </div>
                </div>
              </div>

              {/* PHOTO GRID */}
              {galeriLoading ? (
                <div className="text-center py-32 font-bold text-slate-500 animate-pulse uppercase tracking-[0.3em] text-xs">Memuat Galeri...</div>
              ) : galeriData.length === 0 ? (
                <div className="bg-[#1E293B] border border-white/5 rounded-[3rem] p-24 text-center">
                  <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                    <Camera size={48} className="text-slate-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-400 uppercase italic tracking-tighter">Belum Ada Dokumentasi</h3>
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] mt-3">Tidak ada foto operasional untuk tanggal {tanggal}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {galeriData.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedFoto(item)}
                      className="bg-[#1E293B] border border-white/5 rounded-[2.5rem] overflow-hidden group cursor-pointer hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
                    >
                      {/* Photo Area */}
                      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-900">
                        <Image
                          src={item.foto_url}
                          alt={`Dokumentasi ${item.nama_unit}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/20">Klik untuk Perbesar</span>
                        </div>
                      </div>

                      {/* Info Area */}
                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Utensils size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-black text-white uppercase italic tracking-tighter leading-none truncate group-hover:text-indigo-400 transition-colors">{item.nama_unit}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 truncate">&quot;{item.menu_makanan}&quot;</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <Clock size={12} className="text-slate-600 shrink-0" />
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{item.tanggal_ops}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* ============================================ */}
      {/* MODAL ENLARGE FOTO                          */}
      {/* ============================================ */}
      {selectedFoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={() => setSelectedFoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#1E293B] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedFoto(null)}
              className="absolute top-6 right-6 z-10 p-3 bg-black/40 backdrop-blur-md text-white/70 hover:text-white hover:bg-black/60 rounded-2xl transition-all border border-white/10"
            >
              <X size={22} />
            </button>

            {/* Large Image */}
            <div className="relative w-full aspect-[16/10] bg-slate-900">
              <Image
                src={selectedFoto.foto_url}
                alt={`Dokumentasi ${selectedFoto.nama_unit}`}
                fill
                sizes="(max-width: 768px) 100vw, 900px"
                className="object-contain"
                priority
              />
            </div>

            {/* Caption */}
            <div className="p-8 flex items-center gap-6 border-t border-white/5">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                <Utensils size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-white uppercase italic tracking-tighter leading-none truncate">{selectedFoto.nama_unit}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 truncate">Menu: &quot;{selectedFoto.menu_makanan}&quot;</p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Tanggal Ops</p>
                <p className="text-sm font-black text-indigo-400 italic tracking-tighter mt-1">{selectedFoto.tanggal_ops}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}