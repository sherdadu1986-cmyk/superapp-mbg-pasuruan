"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  School, 
  LogOut, 
  Menu, 
  X,
  Utensils, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Activity
} from 'lucide-react'

export default function DashboardSPPGPage() {
  const { id } = useParams() // Mengambil ID SPPG otomatis dari URL
  const router = useRouter()
  
  // --- STATE UTAMA ---
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sekolah' | 'riwayat'>('sekolah')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Form State
  const [newSekolah, setNewSekolah] = useState({ nama: '', target: 0, jenjang: 'SD/MI' })
  const KATEGORI_PM = ["PAUD/KB", "TK/RA", "SD/MI", "SMP/MTS", "SMA/SMK", "SANTRI", "BALITA", "BUMIL", "BUSUI"]
  
  const [tanggal, setTanggal] = useState('')
  const [menu, setMenu] = useState('')
  const [foto, setFoto] = useState<any>(null)
  const [gizi, setGizi] = useState({
    besar: { energi: '', protein: '', lemak: '', karbo: '', serat: '' },
    kecil: { energi: '', protein: '', lemak: '', karbo: '', serat: '' }
  })
  const [realisasi, setRealisasi] = useState<Record<string, string>>({})

  // --- LOAD DATA OTOMATIS BERDASARKAN ID ---
  const loadData = async () => {
    setLoading(true)
    // 1. Ambil Info SPPG
    const { data: unit } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
    if (unit) setSelectedUnit(unit)

    // 2. Ambil Daftar Sekolah
    const { data: sekolah } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', id).order('jenjang', { ascending: true })
    if (sekolah) setListSekolah(sekolah)

    // 3. Ambil Riwayat Laporan
    const { data: laporan } = await supabase.from('laporan_harian_final').select('*').eq('unit_id', id).order('tanggal_ops', { ascending: false })
    if (laporan) setRiwayat(laporan)
    
    setLoading(false)
  }

  useEffect(() => {
    if (id) loadData()
  }, [id])

  // --- ACTIONS ---
  const handleLogout = () => { localStorage.clear(); router.push('/'); }

  const handleAddSekolah = async () => {
    if(!newSekolah.nama || newSekolah.target <= 0) return alert("Lengkapi Data Sekolah!")
    const { error } = await supabase.from('daftar_sekolah').insert([{
      sppg_id: id, nama_sekolah: newSekolah.nama, target_porsi: newSekolah.target, jenjang: newSekolah.jenjang
    }])
    if(!error) { alert("✅ Data Tersimpan!"); setNewSekolah({ nama: '', target: 0, jenjang: 'SD/MI' }); loadData(); }
  }

  const handleDeleteSekolah = async (sid: string) => {
    if(confirm("Hapus data penerima ini?")) {
      const { error } = await supabase.from('daftar_sekolah').delete().eq('id', sid)
      if(!error) loadData()
    }
  }

  const handleSimpanLaporan = async () => {
    if(!tanggal || !menu) return alert("Wajib isi Tanggal & Menu!")
    setLoading(true)
    const { error } = await supabase.from('laporan_harian_final').insert([{
      unit_id: id, nama_unit: selectedUnit.nama_unit, tanggal_ops: tanggal, menu_makanan: menu, data_gizi: gizi, foto_url: 'dummy_url'
    }])
    if(!error) { 
      alert("✅ Laporan Berhasil Dikirim!"); setView('dashboard'); loadData(); 
    }
    setLoading(false)
  }

  if (loading && !selectedUnit) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400 animate-pulse uppercase tracking-widest text-xs">Memuat Data SPPG...</div>

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans flex text-slate-800 relative">
      
      {/* SIDEBAR (Versi Full Anda) */}
      <aside className={`bg-white border-r border-slate-200 fixed lg:static inset-y-0 left-0 z-50 w-72 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="w-8 h-8" />
            <div>
              <h1 className="font-black text-[#0F2650] text-lg leading-none italic">SPPG</h1>
              <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">KAB. PASURUAN</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-red-500"><X size={20} /></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => { setView('dashboard'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${view === 'dashboard' ? 'bg-[#0F2650] text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => { setView('dashboard'); setActiveTab('sekolah'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'sekolah' && view === 'dashboard' ? 'bg-slate-100 text-[#0F2650]' : 'text-slate-400 hover:bg-slate-50'}`}>
            <School size={18} /> Data Sekolah
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-[#0F2650]"><Menu size={24} /></button>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block">Operasional / <span className="text-[#0F2650]">{selectedUnit?.nama_unit}</span></div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden md:block">
               <p className="text-xs font-black text-[#0F2650] uppercase leading-none">{selectedUnit?.kepala_unit}</p>
               <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Kepala SPPG</p>
             </div>
             <div className="w-9 h-9 bg-[#0F2650] rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg">{selectedUnit?.kepala_unit?.charAt(0)}</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {view === 'dashboard' ? (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Banner Identitas */}
              <div className="bg-[#0F2650] rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl shadow-blue-900/20 relative overflow-hidden">
                 <div className="relative z-10 text-center md:text-left">
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.4em] mb-2">Unit Operational Dashboard</p>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">{selectedUnit?.nama_unit}</h2>
                    <div className="flex gap-4 mt-4 justify-center md:justify-start">
                       <div className="text-center bg-white/10 px-4 py-2 rounded-2xl border border-white/10"><p className="text-xl font-black">{listSekolah.length}</p><p className="text-[8px] font-black uppercase opacity-60">Sekolah</p></div>
                       <div className="text-center bg-white/10 px-4 py-2 rounded-2xl border border-white/10"><p className="text-xl font-black">{riwayat.length}</p><p className="text-[8px] font-black uppercase opacity-60">Laporan</p></div>
                    </div>
                 </div>
                 <button onClick={() => setView('form')} className="relative z-10 bg-yellow-400 text-[#0F2650] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-yellow-400/20 hover:scale-105 transition-transform">
                    + Input Laporan Hari Ini
                 </button>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              </div>

              {/* Data Sekolah & Riwayat */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="flex bg-slate-50/50">
                    <button onClick={() => setActiveTab('sekolah')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'sekolah' ? 'border-[#0F2650] text-[#0F2650]' : 'border-transparent text-slate-400'}`}>Daftar Penerima Manfaat</button>
                    <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'riwayat' ? 'border-[#0F2650] text-[#0F2650]' : 'border-transparent text-slate-400'}`}>Riwayat Laporan</button>
                 </div>
                 <div className="p-6">
                    {activeTab === 'sekolah' ? (
                      <div className="space-y-4 animate-in fade-in">
                        {/* Tambah Sekolah Baru */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                           <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Jenjang</label><select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" value={newSekolah.jenjang} onChange={e => setNewSekolah({...newSekolah, jenjang: e.target.value})}>{KATEGORI_PM.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                           <div className="md:col-span-2 space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nama Sekolah</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" placeholder="NAMA LENGKAP..." value={newSekolah.nama} onChange={e => setNewSekolah({...newSekolah, nama: e.target.value})} /></div>
                           <button onClick={handleAddSekolah} className="bg-[#0F2650] text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20">+ Simpan</button>
                        </div>
                        {/* List Sekolah */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                           {listSekolah.map(s => (
                             <div key={s.id} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-center group hover:border-indigo-100 transition-all">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-[10px]">{s.jenjang.substring(0,2)}</div>
                                   <div><p className="text-[11px] font-black text-slate-700 uppercase leading-none">{s.nama_sekolah}</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{s.target_porsi} Porsi</p></div>
                                </div>
                                <button onClick={() => handleDeleteSekolah(s.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                             </div>
                           ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in">
                        {riwayat.map(l => (
                          <div key={l.id} className="p-4 border border-slate-50 rounded-2xl flex justify-between items-center hover:bg-slate-50 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><CheckCircle2 size={18}/></div>
                                <div><p className="text-[10px] font-black text-slate-700 uppercase italic">"{l.menu_makanan}"</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{l.tanggal_ops}</p></div>
                             </div>
                             <div className="text-right text-[8px] font-black text-indigo-500 uppercase tracking-widest">Terkirim</div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ) : (
            /* FORM INPUT LAPORAN (Sama seperti versi lengkap Anda) */
            <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
               <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                  <div className="bg-[#0F2650] p-8 text-white flex justify-between items-center">
                     <div><h2 className="text-lg font-black uppercase tracking-widest italic">Laporan Operasional</h2><p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.3em]">Harian SPPG</p></div>
                     <button onClick={() => setView('dashboard')} className="p-2 bg-white/10 rounded-xl"><X size={20}/></button>
                  </div>
                  <div className="p-10 space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tgl Distribusi</label><input type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5" onChange={e => setTanggal(e.target.value)} /></div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Menu Utama</label><input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5" placeholder="Contoh: Nasi, Ayam Goreng..." onChange={e => setMenu(e.target.value)} /></div>
                     </div>
                     
                     {/* GIZI SECTION */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {['Besar', 'Kecil'].map(tipe => (
                          <div key={tipe} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                             <h4 className="text-[10px] font-black text-[#0F2650] uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={16} className="text-indigo-500"/> Nutrisi Porsi {tipe}</h4>
                             <div className="space-y-4">
                                {['Energi', 'Protein', 'Lemak', 'Karbo', 'Serat'].map(g => (
                                   <div key={g} className="flex justify-between items-center"><span className="text-[9px] font-black text-slate-400 uppercase">{g}</span><input type="number" className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-xs text-right font-black outline-none" placeholder="0" onChange={e => setGizi(prev => ({...prev, [tipe.toLowerCase()]: {...prev[tipe.toLowerCase() as 'besar'|'kecil'], [g.toLowerCase()]: e.target.value}}))} /></div>
                                ))}
                             </div>
                          </div>
                        ))}
                     </div>

                     <button onClick={handleSimpanLaporan} disabled={loading} className="w-full py-5 bg-[#0F2650] text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/30 hover:scale-[1.02] transition-all">
                        {loading ? 'SISTEM MENGIRIM...' : 'Kirim Laporan Final Ke Korwil'}
                     </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}