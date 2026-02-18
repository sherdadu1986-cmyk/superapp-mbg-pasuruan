"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Users, 
  Search,
  ChevronRight,
  LogOut,
  Bell,
  Moon,
  School,
  GraduationCap,
  ArrowUpRight,
  Box
} from 'lucide-react'

export default function ElegantKorwilDashboard() {
  const router = useRouter()
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [units, setUnits] = useState<any[]>([])
  const [laporan, setLaporan] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, porsiSD: 0, porsiMenengah: 0 })

  const fetchData = async () => {
    const { data: u } = await supabase.from('daftar_sppg').select('*').order('nama_unit')
    const { data: l } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', tanggal)
    const { data: s } = await supabase.from('daftar_sekolah').select('jenjang, target_porsi, sppg_id')

    if(u) setUnits(u)
    if(l) {
      setLaporan(l)
      let t = 0, sd = 0, m = 0
      l.forEach(lap => {
        const sekolahUnit = s?.filter(sekolah => sekolah.sppg_id === lap.unit_id)
        sekolahUnit?.forEach(sekolah => {
          const porsi = Number(sekolah.target_porsi) || 0
          t += porsi
          if(sekolah.jenjang?.toUpperCase().includes('SD') || sekolah.jenjang?.toUpperCase().includes('MI')) sd += porsi
          else m += porsi
        })
      })
      setStats({ total: t, porsiSD: sd, porsiMenengah: m })
    }
  }

  useEffect(() => { fetchData() }, [tanggal])

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex font-sans text-slate-700">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 fixed h-full z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#818CF8] rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">M</div>
          <span className="font-bold text-xl tracking-tight text-slate-900">MBG App</span>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button className="w-full flex items-center gap-4 px-4 py-3 bg-[#EEF2FF] text-[#6366F1] rounded-2xl text-sm font-bold transition-all">
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-slate-600 rounded-2xl text-sm font-semibold transition-all"><Package size={20}/> Transactions</button>
          <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-slate-600 rounded-2xl text-sm font-semibold transition-all"><Users size={20}/> Units</button>
        </nav>
        <div className="p-8 border-t border-slate-50">
           <button onClick={() => router.push('/')} className="flex items-center gap-4 text-slate-400 hover:text-red-500 font-semibold text-sm transition-all">
              <LogOut size={20} /> Log out
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
           <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome, Korwil!</h1>
              <p className="text-sm text-slate-400 mt-1 font-medium italic">Monitoring MBG Kab. Pasuruan</p>
           </div>
           <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="p-3 bg-white rounded-2xl shadow-sm border-none text-xs font-bold outline-none" />
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Total Porsi</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{stats.total.toLocaleString()}</h3>
              <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full w-fit">Terkirim</div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Porsi SD / MI</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{stats.porsiSD.toLocaleString()}</h3>
              <div className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full w-fit">Sekolah Dasar</div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Porsi Menengah</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{stats.porsiMenengah.toLocaleString()}</h3>
              <div className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full w-fit">SMP / SMA / SMK</div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Laporan Unit</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{laporan.length} / {units.length}</h3>
              <div className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full w-fit">Unit Terdata</div>
           </div>
        </div>

        {/* RECENT DISTRIBUTIONS (FIXED NAVIGATION) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Distributions</h3>
              <div className="space-y-4">
                 {laporan.map((l, i) => (
                    /* PERBAIKAN: Fungsi klik sekarang mengarah ke detail/[id] */
                    <div 
                      key={i} 
                      onClick={() => router.push(`/korwil/detail/${l.unit_id}`)} 
                      className="flex items-center justify-between p-4 hover:bg-[#EEF2FF] rounded-2xl cursor-pointer transition-all border border-transparent hover:border-indigo-100 group"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center font-bold text-xs group-hover:bg-indigo-500 group-hover:text-white transition-all">
                             {l.nama_unit.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-700 block">{l.nama_unit}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Laporan Harian Selesai</span>
                          </div>
                       </div>
                       <ChevronRight className="text-slate-300 group-hover:text-indigo-500" size={18}/>
                    </div>
                 ))}
              </div>
           </div>

           {/* BREAKDOWN BAR */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 h-fit">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Porsi Breakdown</h3>
              <div className="space-y-6">
                 <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> SD / MI</span>
                    <span>{stats.porsiSD.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-200"></div> SMP / SMA</span>
                    <span>{stats.porsiMenengah.toLocaleString()}</span>
                 </div>
                 <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner mt-2">
                    <div style={{ width: `${stats.total > 0 ? (stats.porsiSD/stats.total)*100 : 0}%` }} className="h-full bg-indigo-500"></div>
                    <div style={{ width: `${stats.total > 0 ? (stats.porsiMenengah/stats.total)*100 : 0}%` }} className="h-full bg-indigo-200"></div>
                 </div>
                 <div className="bg-indigo-50 p-4 rounded-2xl mt-4">
                    <p className="text-[10px] text-[#6366F1] font-black uppercase tracking-widest text-center leading-relaxed">
                       Total Target Hari Ini:<br/>
                       <span className="text-xl italic">{stats.total.toLocaleString()} Porsi</span>
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  )
}