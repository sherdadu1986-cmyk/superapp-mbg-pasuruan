"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, LogOut, Menu, X, Utensils, 
  CheckCircle2, School, Trash2, Plus, Edit3, ClipboardList, Users,
  ChevronLeft, Calendar as CalendarIcon, AlertCircle, FileText
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
    try {
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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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

  if (loading && !selectedUnit) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400 animate-pulse uppercase tracking-widest text-xs">Syncing Data SPPG...</div>

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex font-sans text-slate-800 transition-all duration-300">
      
      {/* SIDEBAR BUKA TUTUP */}
      <aside className={`bg-[#0F2650] text-white flex flex-col fixed h-full z-50 transition-all duration-300 shadow-2xl ${sidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <img src="/logo.png" className="w-8 h-8 shrink-0" />
            <h1 className="font-black italic text-sm leading-none whitespace-nowrap uppercase tracking-tighter">SPPG PASURUAN</h1>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-xl text-yellow-400">
            {sidebarOpen ? <ChevronLeft size={24}/> : <Menu size={24}/>}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button className={`w-full flex items-center gap-4 px-4 py-4 text-xs font-black uppercase rounded-2xl transition-all bg-white/10 text-white shadow-lg`}>
            <LayoutDashboard size={24} className="shrink-0" /> 
            <span className={sidebarOpen ? 'block' : 'hidden'}>Dashboard</span>
          </button>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={() => {localStorage.clear(); router.push('/')}} className="w-full flex items-center gap-4 px-4 py-4 text-[10px] font-black text-red-400 hover:bg-red-500/10 rounded-2xl transition-all uppercase tracking-widest overflow-hidden">
            <LogOut size={24} className="shrink-0" /> 
            <span className={sidebarOpen ? 'block' : 'hidden'}>Logout</span>
          </button>
        </div>
      </aside>

      <main className={`flex-1 h-screen overflow-hidden flex flex-col transition-all duration-300 ${sidebarOpen ? 'pl-72' : 'pl-24'}`}>
        <header className="bg-white border-b h-20 flex items-center justify-between px-10 shrink-0">
          <div className="flex flex-col">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none mb-2">Sistem Manajemen Operasional</p>
            <div className="text-xs font-black text-[#0F2650] uppercase tracking-tighter italic">{selectedUnit?.nama_unit}</div>
          </div>
          
          <div className="flex items-center gap-5">
             <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1 tracking-widest">Penanggung Jawab:</p>
                <p className="text-xs font-black text-[#0F2650] uppercase italic">{selectedUnit?.kepala_unit}</p>
             </div>
             <div className="w-12 h-12 bg-[#0F2650] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-indigo-900/20 border-2 border-white">
                {selectedUnit?.kepala_unit?.charAt(0)}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* ROW 1: BANNER & TOTAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-[#0F2650] rounded-[3.5rem] p-12 text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10 space-y-6">
                     <div className="space-y-2">
                        <div className="flex items-center gap-3 text-yellow-400 mb-2">
                           <CalendarIcon size={18} />
                           <p className="text-[11px] font-black uppercase tracking-[0.3em]">{todayFormatted}</p>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">{selectedUnit?.nama_unit}</h2>
                     </div>

                     {/* STATUS BADGE */}
                     {laporanHariIni ? (
                        <div className="flex items-center gap-4 bg-emerald-500 text-white px-6 py-3 rounded-2xl w-fit shadow-lg shadow-emerald-500/20 animate-in fade-in zoom-in">
                           <CheckCircle2 size={20} />
                           <p className="text-[11px] font-black uppercase tracking-widest">Status: Sudah Laporan Harian</p>
                        </div>
                     ) : (
                        <div className="flex items-center gap-4 bg-rose-500 text-white px-6 py-3 rounded-2xl w-fit shadow-lg shadow-rose-500/20">
                           <AlertCircle size={20} />
                           <p className="text-[11px] font-black uppercase tracking-widest">Status: Belum Laporan Hari Ini</p>
                        </div>
                     )}
                  </div>

                  {/* BUTTON ACTION */}
                  <button 
                    onClick={() => router.push(`/sppg/dashboard/${id}/input${laporanHariIni ? `?edit=${laporanHariIni.id}` : ''}`)} 
                    className={`relative z-10 px-10 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-4 ${laporanHariIni ? 'bg-white text-[#0F2650]' : 'bg-yellow-400 text-[#0F2650]'}`}
                  >
                    <ClipboardList size={22} />
                    {laporanHariIni ? 'Edit Laporan Hari Ini' : 'Input Laporan Sekarang'}
                  </button>
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
               </div>

               {/* CARD TOTAL */}
               <div className="bg-white rounded-[3.5rem] p-12 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center relative group overflow-hidden">
                  <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-inner group-hover:bg-[#0F2650] group-hover:text-white transition-all duration-500 mb-6">
                    <Users size={48} />
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 leading-none">Total Penerima Manfaat</p>
                  <h3 className="text-6xl font-black text-[#0F2650] italic tracking-tighter leading-none">{totalPM.toLocaleString()}</h3>
                  <p className="text-[10px] font-bold text-slate-300 uppercase mt-4 tracking-widest italic">Paket Porsi Terdaftar</p>
               </div>
            </div>

            {/* ROW 2: CONTENT TABS */}
            <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="flex bg-slate-50 border-b">
                  <button onClick={() => setActiveTab('sekolah')} className={`flex-1 py-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${activeTab === 'sekolah' ? 'text-[#0F2650] bg-white border-b-4 border-[#0F2650]' : 'text-slate-400'}`}>
                    <School size={18}/> Titik Layanan
                  </button>
                  <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${activeTab === 'riwayat' ? 'text-[#0F2650] bg-white border-b-4 border-[#0F2650]' : 'text-slate-400'}`}>
                    <FileText size={18}/> Riwayat Distribusi
                  </button>
               </div>

               <div className="p-10">
                  {activeTab === 'sekolah' ? (
                    <div className="space-y-10 animate-in fade-in duration-700">
                      {/* FORM ADD */}
                      <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
                         <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Pilih Jenjang</label>
                           <select className="w-full p-5 bg-white border border-slate-200 rounded-3xl text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={newSekolah.jenjang} onChange={e => setNewSekolah({...newSekolah, jenjang: e.target.value})}>{KATEGORI_PM.map(k => <option key={k} value={k}>{k}</option>)}</select>
                         </div>
                         <div className="md:col-span-1 space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Nama Sekolah / Titik</label>
                           <input className="w-full p-5 bg-white border border-slate-200 rounded-3xl text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="MISAL: SDN KOTA..." value={newSekolah.nama} onChange={e => setNewSekolah({...newSekolah, nama: e.target.value})} />
                         </div>
                         <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Target Porsi</label>
                           <input type="number" className="w-full p-5 bg-white border border-slate-200 rounded-3xl text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="0" value={newSekolah.target} onChange={e => setNewSekolah({...newSekolah, target: e.target.value})} />
                         </div>
                         <button onClick={handleAddSekolah} className="bg-[#0F2650] text-white py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-3"><Plus size={20}/> Simpan Data</button>
                      </div>

                      {/* LIST GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listSekolah.map(s => (
                          <div key={s.id} className="p-6 border border-slate-100 rounded-[2rem] flex justify-between items-center bg-white group hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                             <div>
                                <p className="text-[13px] font-black text-slate-800 uppercase italic leading-none mb-2 group-hover:text-indigo-600 transition-colors">{s.nama_sekolah}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.jenjang} • <span className="text-indigo-500">{s.target_porsi}</span> Porsi</p>
                             </div>
                             <button onClick={() => handleDeleteSekolah(s.id)} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-700">
                      {riwayat.map(l => (
                        <div key={l.id} className="p-8 border border-slate-100 rounded-[2.5rem] flex justify-between items-center bg-white hover:bg-slate-50 transition-all shadow-sm group">
                           <div className="flex items-center gap-8">
                              <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:bg-[#0F2650] group-hover:text-white transition-all"><Utensils size={24}/></div>
                              <div>
                                 <p className="text-[14px] font-black text-slate-700 uppercase italic leading-none mb-2 group-hover:text-[#0F2650] transition-colors">"{l.menu_makanan}"</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{l.tanggal_ops}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              {l.tanggal_ops === todayISO && (
                                <button onClick={() => router.push(`/sppg/dashboard/${id}/input?edit=${l.id}`)} className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[11px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                   <Edit3 size={16} /> Edit Data
                                </button>
                              )}
                              <div className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">Terkirim ✓</div>
                           </div>
                        </div>
                      ))}
                      {riwayat.length === 0 && (
                        <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">Belum ada riwayat laporan</div>
                      )}
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