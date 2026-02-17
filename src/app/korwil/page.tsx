"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, 
  Map, 
  Clock, 
  LogOut, 
  Search, 
  CheckCircle2, 
  XCircle,
  ChevronRight 
} from 'lucide-react'

export default function KorwilPage() {
  const router = useRouter()
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [units, setUnits] = useState<any[]>([])
  const [laporan, setLaporan] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: u } = await supabase.from('daftar_sppg').select('*').order('nama_unit')
      const { data: l } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', tanggal)
      if(u) setUnits(u)
      if(l) setLaporan(l)
    }
    fetchData()
  }, [tanggal])

  const sudahCount = laporan.length
  const belumCount = units.length - sudahCount
  const progres = units.length > 0 ? Math.round((sudahCount / units.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      {/* SIDEBAR KORWIL */}
      <aside className="w-64 bg-[#0F2650] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Map className="text-emerald-400" />
          <span className="font-black tracking-tighter text-lg uppercase">KORWIL BGN</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="px-4 py-2 text-[10px] font-black text-slate-400 tracking-widest uppercase">Monitoring</div>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 text-white rounded-xl text-xs font-bold">
            <BarChart3 size={18} /> STATUS PELAPORAN
          </button>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut size={16} /> KELUAR SISTEM
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* TOP NAV & DATE */}
          <header className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-[#0F2650] uppercase tracking-tighter">Ringkasan Wilayah</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kab. Pasuruan Operasional</p>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 pl-2 uppercase">Periode:</span>
              <input type="date" className="text-xs font-bold text-[#0F2650] outline-none" value={tanggal} onChange={e => setTanggal(e.target.value)} />
            </div>
          </header>

          {/* STATS & PROGRESS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-end">
                   <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Progres Pelaporan</p>
                      <h3 className="text-5xl font-black text-[#0F2650]">{progres}%</h3>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-bold text-emerald-600 uppercase">{sudahCount} Masuk</p>
                      <p className="text-xs font-bold text-red-400 uppercase">{belumCount} Belum</p>
                   </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full mt-6 overflow-hidden">
                   <div style={{ width: `${progres}%` }} className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
                </div>
             </div>
             <div className="bg-[#0F2650] p-8 rounded-[2rem] text-white flex flex-col justify-center items-center text-center shadow-xl">
                <Clock className="mb-2 text-yellow-400" size={32} />
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Total Unit Terdaftar</p>
                <h4 className="text-5xl font-black">{units.length}</h4>
             </div>
          </div>

          {/* DETAIL GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* LIST BELUM LAPOR (URGENT) */}
             <div className="space-y-4">
                <h3 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2"><XCircle size={16}/> Belum Mengirim Laporan</h3>
                <div className="space-y-2">
                  {units.filter(u => !laporan.find(l => l.unit_id === u.id)).map(u => (
                    <div key={u.id} onClick={() => router.push(`/korwil/detail/${u.id}`)} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center group cursor-pointer hover:border-red-300 transition-all">
                       <div>
                          <p className="text-xs font-black text-slate-700 uppercase">{u.nama_unit}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{u.kepala_unit}</p>
                       </div>
                       <ChevronRight className="text-slate-200 group-hover:text-red-500 transition-all" size={20} />
                    </div>
                  ))}
                </div>
             </div>

             {/* LIST SUDAH LAPOR */}
             <div className="space-y-4">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={16}/> Laporan Sudah Masuk</h3>
                <div className="space-y-2">
                  {laporan.map(l => (
                    <div key={l.id} onClick={() => router.push(`/korwil/detail/${l.unit_id}`)} className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex justify-between items-center group cursor-pointer hover:border-emerald-500 transition-all">
                       <div>
                          <p className="text-xs font-black text-[#0F2650] uppercase">{l.nama_unit}</p>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase truncate w-40">🍽️ {l.menu_makanan}</p>
                       </div>
                       <ChevronRight className="text-emerald-100 group-hover:text-emerald-500 transition-all" size={20} />
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