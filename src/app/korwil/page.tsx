"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, LogOut, CheckCircle2, XCircle, ChevronRight, Settings,
  Utensils, School, Box, Activity, Users, Baby, GraduationCap,
  Clock, MapPin, AlertTriangle
} from 'lucide-react'

export default function SuperKorwilPage() {
  const router = useRouter()
  
  // --- STATE DATA ---
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [units, setUnits] = useState<any[]>([])
  const [laporan, setLaporan] = useState<any[]>([])
  
  // --- KATEGORI LENGKAP (Item Penerima Manfaat) ---
  const KATEGORI_PM = ["PAUD/KB", "TK/RA", "SD/MI", "SMP/MTS", "SMA/SMK", "SANTRI", "BALITA", "BUMIL", "BUSUI"]
  const [statsPorsi, setStatsPorsi] = useState<Record<string, number>>({})
  const [totalPorsiHarian, setTotalPorsiHarian] = useState(0)

  const fetchData = async () => {
    // 1. Ambil Data Unit, Laporan, dan Master Sekolah
    const { data: u } = await supabase.from('daftar_sppg').select('*').order('nama_unit')
    const { data: l } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', tanggal)
    const { data: s } = await supabase.from('daftar_sekolah').select('id, jenjang')

    if(u) setUnits(u)
    if(l && s) {
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
          if(sekolahInfo) {
            const jenjang = sekolahInfo.jenjang?.toUpperCase() || ''
            const targetKat = KATEGORI_PM.find(k => jenjang.includes(k.split('/')[0]))
            if(targetKat) {
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
  }

  useEffect(() => { fetchData() }, [tanggal, laporan.length])

  const progres = units.length > 0 ? Math.round((laporan.length / units.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* SIDEBAR COMMAND CENTER */}
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
        
        <nav className="p-6 space-y-4">
          <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/10">
            <BarChart3 size={20} /> 
            <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Monitoring</span>
          </button>
        </nav>

        <div className="absolute bottom-8 w-full px-6">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-xs uppercase tracking-widest">
            <LogOut size={20} /> 
            <span className="hidden lg:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="pl-24 lg:pl-72 p-8 transition-all">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* TOP HEADER */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Infografis Wilayah</h2>
              <div className="flex items-center gap-4 mt-4 text-slate-500">
                <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5">
                  <MapPin size={14} className="text-indigo-400"/>
                  <span className="text-[10px] font-black uppercase tracking-widest">Kab. Pasuruan</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5">
                  <Clock size={14} className="text-emerald-400"/>
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
                          <Utensils size={18}/>
                        </div>
                        <span className="text-xs font-black text-slate-400 group-hover:text-white uppercase italic transition-colors tracking-tighter">{l.nama_unit}</span>
                     </div>
                     <ChevronRight className="text-slate-700 group-hover:text-emerald-500 transition-transform group-hover:translate-x-2" size={20} />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}