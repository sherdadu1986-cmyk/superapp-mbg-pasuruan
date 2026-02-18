"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, 
  LogOut, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  Settings,
  Users,
  Utensils,
  GraduationCap,
  School,
  Box
} from 'lucide-react'

export default function SuperKorwilPage() {
  const router = useRouter()
  
  // --- STATE DATA ---
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [units, setUnits] = useState<any[]>([])
  const [laporan, setLaporan] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'monitor' | 'control'>('monitor')

  // --- STATISTIK PORSI ---
  const [stats, setStats] = useState({
    totalPorsi: 0,
    porsiSD: 0,
    porsiMenengah: 0 // SMP, SMA, SMK
  })

  const fetchData = async () => {
    // 1. Ambil Data Unit & Laporan
    const { data: u } = await supabase.from('daftar_sppg').select('*').order('nama_unit')
    const { data: l } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', tanggal)
    
    // 2. Ambil Detail Sekolah untuk hitung porsi per jenjang
    const { data: s } = await supabase.from('daftar_sekolah').select('jenjang, target_porsi, sppg_id')

    if(u) setUnits(u)
    if(l) {
      setLaporan(l)
      
      // Hitung Infografis Porsi hanya dari unit yang SUDAH lapor
      let total = 0
      let sd = 0
      let menengah = 0

      l.forEach(lap => {
        const sekolahUnit = s?.filter(sekolah => sekolah.sppg_id === lap.unit_id)
        sekolahUnit?.forEach(sekolah => {
          const porsi = Number(sekolah.target_porsi) || 0
          total += porsi
          if(sekolah.jenjang?.toUpperCase().includes('SD') || sekolah.jenjang?.toUpperCase().includes('MI')) {
            sd += porsi
          } else {
            menengah += porsi
          }
        })
      })

      setStats({ totalPorsi: total, porsiSD: sd, porsiMenengah: menengah })
    }
  }

  useEffect(() => { fetchData() }, [tanggal])

  const sudahCount = laporan.length
  const progres = units.length > 0 ? Math.round((sudahCount / units.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F2650] text-white flex flex-col shrink-0 fixed h-full">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="p-2 bg-yellow-400 rounded-lg text-[#0F2650] shadow-lg shadow-yellow-400/20">
            <Settings size={20} />
          </div>
          <span className="font-black tracking-tighter text-lg uppercase italic">SUPER KORWIL</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('monitor')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'monitor' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:bg-white/5'}`}>
            <BarChart3 size={18} /> Monitoring
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-red-400 hover:bg-red-500/10 rounded-xl transition-all uppercase tracking-widest">
            <LogOut size={16} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <header className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-[#0F2650] uppercase tracking-tighter italic">Infografis Wilayah</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Monitoring Distribusi Porsi Kab. Pasuruan</p>
            </div>
            <input type="date" className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold" value={tanggal} onChange={e => setTanggal(e.target.value)} />
          </header>

          {/* ROW 1: PROGRES & TOTAL PORSI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                <div className="flex justify-between items-end mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Progres Pengiriman Laporan SPPG</p>
                  <span className="text-3xl font-black text-[#0F2650]">{progres}%</span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${progres}%` }} className="h-full bg-blue-600 rounded-full transition-all duration-1000"></div>
                </div>
            </div>

            <div className="bg-[#0F2650] p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                <Box className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform" size={120} />
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1 relative z-10">Total Distribusi Hari Ini</p>
                <h4 className="text-5xl font-black italic relative z-10">{stats.totalPorsi.toLocaleString()}</h4>
                <p className="text-[10px] font-bold opacity-60 mt-2 relative z-10 uppercase">Paket Porsi Terkirim</p>
            </div>
          </div>

          {/* ROW 2: DETAIL JENJANG (INFOGRAFIS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-8">
                <div className="p-6 bg-orange-50 text-orange-500 rounded-3xl">
                   <School size={40} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenjang SD / MI</p>
                   <h3 className="text-4xl font-black text-slate-800">{stats.porsiSD.toLocaleString()}</h3>
                   <p className="text-[9px] font-bold text-orange-600 uppercase italic mt-1">Total Porsi Anak Sekolah Dasar</p>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-8">
                <div className="p-6 bg-indigo-50 text-indigo-500 rounded-3xl">
                   <GraduationCap size={40} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenjang SMP / SMA / SMK</p>
                   <h3 className="text-4xl font-black text-slate-800">{stats.porsiMenengah.toLocaleString()}</h3>
                   <p className="text-[9px] font-bold text-indigo-600 uppercase italic mt-1">Total Porsi Pendidikan Menengah</p>
                </div>
             </div>
          </div>

          {/* ROW 3: LIST STATUS UNIT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2 italic"><XCircle size={16}/> Belum Mengirim Laporan</h3>
              <div className="space-y-2">
                {units.filter(u => !laporan.find(l => l.unit_id === u.id)).map(u => (
                  <div key={u.id} onClick={() => router.push(`/korwil/detail/${u.id}`)} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center group cursor-pointer hover:border-red-300 transition-all shadow-sm">
                     <span className="text-xs font-black text-slate-700 uppercase">{u.nama_unit}</span>
                     <ChevronRight className="text-slate-200 group-hover:text-red-500" size={20} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 italic"><CheckCircle2 size={16}/> Laporan Sudah Masuk</h3>
              <div className="space-y-2">
                {laporan.map(l => (
                  <div key={l.id} onClick={() => router.push(`/korwil/detail/${l.unit_id}`)} className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex justify-between items-center group cursor-pointer hover:border-emerald-500 transition-all">
                     <div className="flex items-center gap-3">
                        <Utensils size={16} className="text-emerald-500"/>
                        <span className="text-xs font-black text-[#0F2650] uppercase">{l.nama_unit}</span>
                     </div>
                     <ChevronRight className="text-emerald-100 group-hover:text-emerald-500" size={20} />
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