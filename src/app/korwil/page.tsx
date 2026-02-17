"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, 
  Map, 
  LogOut, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  Settings,
  Users,
  Trash2,
  PlusCircle
} from 'lucide-react'

export default function SuperKorwilPage() {
  const router = useRouter()
  
  // --- STATE MONITORING ---
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [units, setUnits] = useState<any[]>([])
  const [laporan, setLaporan] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'monitor' | 'control'>('monitor')

  // --- STATE CONTROL (SUPER ADMIN) ---
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    // Data untuk Monitoring
    const { data: u } = await supabase.from('daftar_sppg').select('*').order('nama_unit')
    const { data: l } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', tanggal)
    if(u) setUnits(u)
    if(l) setLaporan(l)

    // Data untuk Kontrol User (Super Admin Privilege)
    const { data: usr } = await supabase.from('users_app').select(`*, daftar_sppg(nama_unit)`).order('role')
    if(usr) setUsers(usr)
  }

  useEffect(() => { fetchData() }, [tanggal])

  const handleDelete = async (table: string, id: string) => {
    if(confirm("Tindakan ini permanen. Hapus data ini?")) {
      await supabase.from(table).delete().eq('id', id)
      fetchData()
    }
  }

  const sudahCount = laporan.length
  const progres = units.length > 0 ? Math.round((sudahCount / units.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* SIDEBAR SUPER KORWIL */}
      <aside className="w-64 bg-[#0F2650] text-white flex flex-col shrink-0">
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
          <button onClick={() => setActiveTab('control')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'control' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:bg-white/5'}`}>
            <Users size={18} /> Kontrol User
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-red-400 hover:bg-red-500/10 rounded-xl transition-all uppercase tracking-widest">
            <LogOut size={16} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {activeTab === 'monitor' ? (
            /* ============ TAB MONITORING ============ */
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-[#0F2650] uppercase tracking-tighter italic">Ringkasan Wilayah</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Kab. Pasuruan Monitoring</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                  <span className="text-[9px] font-black text-slate-400 pl-2 uppercase">Filter:</span>
                  <input type="date" className="text-xs font-bold text-[#0F2650] outline-none" value={tanggal} onChange={e => setTanggal(e.target.value)} />
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-end mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progres Laporan Harian</p>
                      <h3 className="text-4xl font-black text-[#0F2650] italic">{progres}%</h3>
                   </div>
                   <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div style={{ width: `${progres}%` }} className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-1000"></div>
                   </div>
                </div>
                <div className="bg-[#0F2650] p-8 rounded-[2rem] text-white text-center shadow-xl flex flex-col justify-center">
                   <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Total Unit</p>
                   <h4 className="text-5xl font-black italic">{units.length}</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2 italic"><XCircle size={16}/> Belum Mengirim Laporan</h3>
                  <div className="space-y-2">
                    {units.filter(u => !laporan.find(l => l.unit_id === u.id)).map(u => (
                      <div key={u.id} onClick={() => router.push(`/korwil/detail/${u.id}`)} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center group cursor-pointer hover:border-red-300 transition-all">
                         <div>
                            <p className="text-xs font-black text-slate-700 uppercase">{u.nama_unit}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{u.kepala_unit}</p>
                         </div>
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
                         <div>
                            <p className="text-xs font-black text-[#0F2650] uppercase">{l.nama_unit}</p>
                            <p className="text-[9px] text-emerald-600 font-black italic truncate w-40 tracking-wider">🍽️ {l.menu_makanan}</p>
                         </div>
                         <ChevronRight className="text-emerald-100 group-hover:text-emerald-500" size={20} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============ TAB KONTROL (SUPER ADMIN PRIVILEGE) ============ */
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
               <header>
                  <h2 className="text-2xl font-black text-[#0F2650] uppercase tracking-tighter italic">Otoritas Pengguna</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Manajemen Akun & Hak Akses Wilayah</p>
               </header>

               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                           <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Pengguna</th>
                           <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Tingkat Akses</th>
                           <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Tindakan</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {users.map((u) => (
                           <tr key={u.id} className="hover:bg-slate-50 transition-all">
                              <td className="p-5">
                                 <p className="text-xs font-black text-slate-700 uppercase">{u.email}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{u.daftar_sppg?.nama_unit || 'Akses Wilayah'}</p>
                              </td>
                              <td className="p-5 text-center">
                                 <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${u.role === 'it' ? 'bg-red-50 text-red-600' : u.role === 'korwil' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-600'}`}>
                                    {u.role}
                                 </span>
                              </td>
                              <td className="p-5 text-right">
                                 <button onClick={() => handleDelete('users_app', u.id)} className="p-2 text-slate-200 hover:text-red-500 transition-all">
                                    <Trash2 size={16} />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-blue-700">
                     <PlusCircle size={32} />
                     <div>
                        <p className="text-xs font-black uppercase italic">Ingin Menambah Akun Baru?</p>
                        <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Gunakan fitur manajemen IT untuk pendaftaran massal.</p>
                     </div>
                  </div>
                  <button onClick={() => setActiveTab('monitor')} className="bg-[#0F2650] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all">Kembali Pantau</button>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}