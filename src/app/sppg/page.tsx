"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, LogOut, Menu, X, Utensils, 
  CheckCircle2, School, Trash2, Plus, Edit3, ClipboardList, Users,
  ChevronLeft, Calendar as CalendarIcon, AlertCircle
} from 'lucide-react'

export default function DashboardSPPGPage() {
  const { id } = useParams() 
  const router = useRouter()
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sekolah' | 'riwayat'>('sekolah')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Data State
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [totalPM, setTotalPM] = useState(0)
  const [laporanHariIni, setLaporanHariIni] = useState<any>(null)

  // Tanggal Hari Ini Formatted
  const todayRaw = new Date()
  const todayISO = todayRaw.toISOString().split('T')[0]
  const todayFormatted = todayRaw.toLocaleDateString('id-ID', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  })

  // Form Tambah Sekolah
  const [newSekolah, setNewSekolah] = useState({ nama: '', target: '', jenjang: 'SD/MI' })
  const KATEGORI_PM = ["PAUD/KB", "TK/RA", "SD/MI", "SMP/MTS", "SMA/SMK", "SANTRI", "BALITA", "BUMIL", "BUSUI"]

  const loadData = async () => {
    setLoading(true)
    const { data: unit } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
    const { data: sekolah } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', id).order('nama_sekolah', { ascending: true })
    const { data: laporan } = await supabase.from('laporan_harian_final').select('*').eq('unit_id', id).order('tanggal_ops', { ascending: false })
    
    // Cek Laporan Hari Ini
    const checkToday = laporan?.find(l => l.tanggal_ops === todayISO)
    
    if (unit) setSelectedUnit(unit)
    if (checkToday) setLaporanHariIni(checkToday)
    if (sekolah) {
      setListSekolah(sekolah)
      const total = sekolah.reduce((acc, curr) => acc + (Number(curr.target_porsi) || 0), 0)
      setTotalPM(total)
    }
    if (laporan) setRiwayat(laporan)
    setLoading(false)
  }

  useEffect(() => { if (id) loadData() }, [id])

  const handleAddSekolah = async () => {
    if(!newSekolah.nama || !newSekolah.target) return alert("Lengkapi data!")
    await supabase.from('daftar_sekolah').insert([{ sppg_id: id, nama_sekolah: newSekolah.nama, target_porsi: parseInt(newSekolah.target), jenjang: newSekolah.jenjang }])
    setNewSekolah({ nama: '', target: '', jenjang: 'SD/MI' }); 
    loadData();
  }

  const handleDeleteSekolah = async (sid: string) => {
    if(confirm("Hapus sekolah?")) { await supabase.from('daftar_sekolah').delete().eq('id', sid); loadData(); }
  }

  if (loading && !selectedUnit) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400 animate-pulse uppercase">Syncing Data...</div>

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex font-sans text-slate-800 transition-all duration-300">
      
      {/* SIDEBAR BUKA TUTUP */}
      <aside className={`bg-[#0F2650] text-white flex flex-col fixed h-full z-50 transition-all duration-300 shadow-2xl ${sidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <img src="/logo.png" className="w-8 h-8 shrink-0" />
            <h1 className="font-black italic text-sm leading-none whitespace-nowrap">SPPG PASURUAN</h1>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-xl text-yellow-400">
            {sidebarOpen ? <ChevronLeft size={20}/> : <Menu size={20}/>}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button className={`w-full flex items-center gap-4 px-4 py-3.5 text-xs font-black uppercase rounded-xl transition-all bg-white/10 text-white shadow-lg`}>
            <LayoutDashboard size={20} className="shrink-0" /> 
            <span className={sidebarOpen ? 'block' : 'hidden'}>Dashboard</span>
          </button>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={() => {localStorage.clear(); router.push('/')}} className="w-full flex items-center gap-4 px-4 py-3 text-[10px] font-black text-red-400 hover:bg-red-500/10 rounded-xl transition-all uppercase tracking-widest overflow-hidden">
            <LogOut size={20} className="shrink-0" /> 
            <span className={sidebarOpen ? 'block' : 'hidden'}>Logout</span>
          </button>
        </div>
      </aside>

      <main className={`flex-1 h-screen overflow-hidden flex flex-col transition-all duration-300 ${sidebarOpen ? 'pl-72' : 'pl-20'}`}>
        <header className="bg-white border-b h-16 flex items-center justify-between px-8 shrink-0">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">
            Sistem Operasional / <span className="text-[#0F2650]">{selectedUnit?.nama_unit}</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">PJ Unit:</p>
                <p className="text-xs font-black text-[#0F2650] uppercase">{selectedUnit?.kepala_unit}</p>
             </div>
             <div className="w-10 h-10 bg-[#0F2650] rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-900/20">
                {selectedUnit?.kepala_unit?.charAt(0)}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* BANNER STATUS HARI INI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 bg-[#0F2650] rounded-[3rem] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10 space-y-4">
                     <div>
                        <div className="flex items-center gap-3 text-indigo-300 mb-2">
                           <CalendarIcon size={16} />
                           <p className="text-[10px] font-black uppercase tracking-[0.3em]">{todayFormatted}</p>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-tight">{selectedUnit?.nama_unit}</h2>
                     </div>

                     {/* LABEL STATUS */}
                     {laporanHariIni ? (
                        <div className="flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/30 px-5 py-3 rounded-2xl w-fit animate-in fade-in zoom-in">
                           <CheckCircle2 size={18} className="text-emerald-400" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sudah Kirim Laporan Harian</p>
                        </div>
                     ) : (
                        <div className="flex items-center gap-3 bg-rose-500/20 border border-rose-500/30 px-5 py-3 rounded-2xl w-fit">
                           <AlertCircle size={18} className="text-rose-400" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Belum Mengirim Laporan Hari Ini</p>
                        </div>
                     )}
                  </div>

                  {/* TOMBOL INPUT / EDIT DINAMIS */}
                  <button 
                    onClick={() => router.push(`/sppg/dashboard/${id}/input${laporanHariIni ? `?edit=${laporanHariIni.id}` : ''}`)} 
                    className={`relative z-10 px-8 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 ${laporanHariIni ? 'bg-indigo-500 text-white' : 'bg-yellow-400 text-[#0F2650]'}`}
                  >
                    <ClipboardList size={20} />
                    {laporanHariIni ? 'Edit Laporan Hari Ini' : 'Input Laporan Sekarang'}
                  </button>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
               </div>

               {/* TOTAL PM */}
               <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center relative group overflow-hidden">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 mb-4">
                    <Users size={40} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Total Target Unit</p>
                  <h3 className="text-5xl font-black text-[#0F2650] italic tracking-tighter">{totalPM.toLocaleString()}</h3>
                  <p className="text-[9px] font-bold text-slate-300 uppercase mt-2">Porsi Paket Penerima Manfaat</p>
               </div>
            </div>

            {/* TAB MENU */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="flex bg-slate-50 border-b">
                  <button onClick={() => setActiveTab('sekolah')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sekolah' ? 'text-[#0F2650] border-b-4 border-[#0F2650]' : 'text-slate-400'}`}>Daftar Titik Layanan</button>
                  <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'riwayat' ? 'text-[#0F2650] border-b-4 border-[#0F2650]' : 'text-slate-400'}`}>Riwayat Laporan Unit</button>
               </div>

               <div className="p-8">
                  {activeTab === 'sekolah' ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      {/* FORM TAMBAH SEKOLAH */}
                      <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                         <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Jenjang PM</label><select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500" value={newSekolah.jenjang} onChange={e => setNewSekolah({...newSekolah, jenjang: e.target.value})}>{KATEGORI_PM.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                         <div className="md:col-span-1 space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nama Sekolah / Titik</label><input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500" placeholder="MISAL: SDN WONOREJO..." value={newSekolah.nama} onChange={e => setNewSekolah({...newSekolah, nama: e.target.value})} /></div>
                         <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Target Porsi</label><input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500" placeholder="0" value={newSekolah.target} onChange={e => setNewSekolah({...newSekolah, target: e.target.value})} /></div>
                         <button onClick={handleAddSekolah} className="bg-[#0F2650] text-white py-4.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-2"><Plus size={18}/> Simpan Data</button>
                      </div>

                      {/* LIST SEKOLAH */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {listSekolah.map(s => (
                          <div key={s.id} className="p-5 border border-slate-100 rounded-3xl flex justify-between items-center bg-white group hover:border-indigo-200 hover:shadow-md transition-all">
                             <div>
                                <p className="text-[11px] font-black text-slate-700 uppercase leading-none mb-1 group-hover:text-indigo-600 transition-colors">{s.nama_sekolah}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{s.jenjang} • {s.target_porsi} Porsi</p>
                             </div>
                             <button onClick={() => handleDeleteSekolah(s.id)} className="p-2.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      {riwayat.map(l => (
                        <div key={l.id} className="p-6 border border-slate-100 rounded-[2rem] flex justify-between items-center bg-white hover:bg-slate-50 transition-all shadow-sm">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center"><Utensils size={20}/></div>
                              <div>
                                 <p className="text-[11px] font-black text-slate-700 uppercase italic leading-none mb-1">"{l.menu_makanan}"</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{l.tanggal_ops}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              {l.tanggal_ops === todayISO && (
                                <button onClick={() => router.push(`/sppg/dashboard/${id}/input?edit=${l.id}`)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                   <Edit3 size={14} /> Edit
                                </button>
                              )}
                              <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">Terkirim ✓</div>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}