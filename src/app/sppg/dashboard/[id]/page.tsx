"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, LogOut, Menu, X, Utensils, 
  CheckCircle2, Activity, School, FileText, ArrowRight, Trash2, Plus, RotateCcw
} from 'lucide-react'

export default function DashboardSPPGPage() {
  const { id } = useParams() 
  const router = useRouter()
  
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sekolah' | 'riwayat'>('sekolah')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fitur Tambah Sekolah Mandiri
  const [newSekolah, setNewSekolah] = useState({ nama: '', target: '', jenjang: 'SD/MI' })
  const KATEGORI_PM = ["PAUD/KB", "TK/RA", "SD/MI", "SMP/MTS", "SMA/SMK", "SANTRI", "BALITA", "BUMIL", "BUSUI"]

  // Form States Laporan
  const [tanggal, setTanggal] = useState('')
  const [menu, setMenu] = useState('')
  const [foto, setFoto] = useState<any>(null)
  const [realisasi, setRealisasi] = useState<Record<string, string>>({})
  const [gizi, setGizi] = useState({
    besar: { energi: '', protein: '', lemak: '', karbo: '', serat: '' },
    kecil: { energi: '', protein: '', lemak: '', karbo: '', serat: '' }
  })

  // --- LOAD DATA ---
  const loadData = async () => {
    setLoading(true)
    try {
      const { data: unit } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
      if (unit) setSelectedUnit(unit)
      
      const { data: sekolah } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', id).order('nama_sekolah', { ascending: true })
      if (sekolah) setListSekolah(sekolah)
      
      const { data: laporan } = await supabase.from('laporan_harian_final').select('*').eq('unit_id', id).order('tanggal_ops', { ascending: false })
      if (laporan) setRiwayat(laporan)
    } catch (err) {
      console.error("Load error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) loadData() }, [id])

  // --- FUNGSI TAMBAH SEKOLAH MANDIRI ---
  const handleAddSekolah = async () => {
    if(!newSekolah.nama || !newSekolah.target) return alert("Lengkapi nama sekolah dan target porsi!")
    setLoading(true)
    try {
      const { error } = await supabase.from('daftar_sekolah').insert([{ 
        sppg_id: id, 
        nama_sekolah: newSekolah.nama, 
        target_porsi: parseInt(newSekolah.target), 
        jenjang: newSekolah.jenjang 
      }])
      
      if(!error) {
        setNewSekolah({ nama: '', target: '', jenjang: 'SD/MI' })
        loadData()
      } else {
        alert("Gagal tambah sekolah: " + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSekolah = async (sid: string) => {
    if(confirm("Hapus sekolah ini dari daftar?")) {
      await supabase.from('daftar_sekolah').delete().eq('id', sid)
      loadData()
    }
  }

  // --- FUNGSI SIMPAN DENGAN UPLOAD FOTO ---
  const handleSimpanLaporan = async () => {
    if(!tanggal || !menu) return alert("⚠️ Wajib isi Tanggal & Menu!")
    setLoading(true)

    try {
      let publicUrl = ""

      // 1. PROSES UPLOAD FOTO KE SUPABASE STORAGE
      if (foto) {
        const fileExt = foto.name.split('.').pop()
        const fileName = `${Date.now()}_${id}.${fileExt}`
        const filePath = `dokumentasi_harian/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('dokumentasi')
          .upload(filePath, foto)

        if (uploadError) throw uploadError

        const { data: linkData } = supabase.storage
          .from('dokumentasi')
          .getPublicUrl(filePath)
        
        publicUrl = linkData.publicUrl
      }

      // 2. MEMBERSIHKAN DATA REALISASI
      const cleanRealisasi = Object.fromEntries(
        Object.entries(realisasi).filter(([_, v]) => v !== "" && v !== null)
      );

      // 3. SIMPAN KE DATABASE
      const { error } = await supabase
        .from('laporan_harian_final')
        .insert([{ 
            unit_id: id, 
            nama_unit: selectedUnit.nama_unit, 
            tanggal_ops: tanggal, 
            menu_makanan: menu, 
            data_gizi: gizi,
            realisasi_sekolah: cleanRealisasi,
            foto_url: publicUrl 
        }])

      if (error) {
        console.error("Supabase Error:", error)
        alert("❌ Gagal Simpan: " + error.message)
      } else {
        alert("✅ LAPORAN & FOTO BERHASIL TERKIRIM KE KORWIL!")
        setFoto(null)
        setView('dashboard')
        loadData()
      }
    } catch (err: any) {
      console.error("System Error:", err)
      alert("Terjadi kesalahan sistem atau koneksi.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { localStorage.clear(); router.push('/'); }

  if (loading && !selectedUnit) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400 animate-pulse uppercase tracking-widest text-xs">Memuat Data SPPG...</div>

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex font-sans text-slate-800 relative">
      {/* SIDEBAR */}
      <aside className={`bg-white border-r fixed lg:static inset-y-0 left-0 z-50 w-72 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 flex flex-col shadow-2xl lg:shadow-none`}>
        <div className="p-6 border-b flex items-center gap-3">
          <img src="/logo.png" className="w-8 h-8" />
          <div>
            <h1 className="font-black text-[#0F2650] text-lg leading-none italic">SPPG</h1>
            <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">KAB. PASURUAN</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${view === 'dashboard' ? 'bg-[#0F2650] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-[#0F2650]"><Menu size={24} /></button>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block">Operasional / <span className="text-[#0F2650]">{selectedUnit?.nama_unit}</span></div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden md:block"><p className="text-xs font-black text-[#0F2650] uppercase leading-none">{selectedUnit?.kepala_unit}</p></div>
             <div className="w-9 h-9 bg-[#0F2650] rounded-xl flex items-center justify-center text-white font-black text-xs">{selectedUnit?.kepala_unit?.charAt(0)}</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {view === 'dashboard' ? (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-[#0F2650] rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
                 <div className="relative z-10"><h2 className="text-3xl font-black italic uppercase tracking-tighter">{selectedUnit?.nama_unit}</h2></div>
                 <button onClick={() => setView('form')} className="relative z-10 bg-yellow-400 text-[#0F2650] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">+ Input Laporan Hari Ini</button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="flex bg-slate-50/50">
                    <button onClick={() => setActiveTab('sekolah')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'sekolah' ? 'border-[#0F2650] text-[#0F2650]' : 'border-transparent text-slate-400'}`}>Penerima Manfaat</button>
                    <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'riwayat' ? 'border-[#0F2650] text-[#0F2650]' : 'border-transparent text-slate-400'}`}>Riwayat Laporan</button>
                 </div>
                 <div className="p-6">
                    {activeTab === 'sekolah' ? (
                      <div className="space-y-6 animate-in fade-in">
                        {/* FORM TAMBAH SEKOLAH MANDIRI */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                           <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase">Jenjang</label>
                             <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" value={newSekolah.jenjang} onChange={e => setNewSekolah({...newSekolah, jenjang: e.target.value})}>
                               {KATEGORI_PM.map(k => <option key={k} value={k}>{k}</option>)}
                             </select>
                           </div>
                           <div className="md:col-span-1 space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase">Nama Sekolah</label>
                             <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" placeholder="MISAL: SD NEGERI..." value={newSekolah.nama} onChange={e => setNewSekolah({...newSekolah, nama: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase">Target (Pack)</label>
                             <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" placeholder="0" value={newSekolah.target} onChange={e => setNewSekolah({...newSekolah, target: e.target.value})} />
                           </div>
                           <button onClick={handleAddSekolah} className="bg-[#0F2650] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md flex items-center justify-center gap-2">
                             <Plus size={14}/> Simpan Sekolah
                           </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                          {listSekolah.map(s => (
                            <div key={s.id} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-center hover:border-indigo-100 transition-all bg-white group">
                               <div>
                                 <p className="text-[11px] font-black text-slate-700 uppercase leading-none">{s.nama_sekolah}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{s.jenjang} • {s.target_porsi} Porsi</p>
                               </div>
                               <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><CheckCircle2 size={16}/></div>
                                 <button onClick={() => handleDeleteSekolah(s.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                   <Trash2 size={16}/>
                                 </button>
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in">
                        {riwayat.map(l => (
                          <div key={l.id} className="p-4 border border-slate-50 rounded-2xl flex justify-between items-center hover:bg-slate-50 transition-all">
                             <div><p className="text-[10px] font-black text-slate-700 uppercase italic">"{l.menu_makanan}"</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{l.tanggal_ops}</p></div>
                             <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Terkirim</div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ) : (
            /* VIEW FORM LAPORAN */
            <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden mb-20 animate-in zoom-in-95">
               <div className="bg-[#0F2650] p-8 text-white flex justify-between items-center">
                  <div><h2 className="text-lg font-black uppercase italic tracking-widest leading-none">Laporan Operasional</h2><p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-2 opacity-60">Harian SPPG</p></div>
                  <button onClick={() => setView('dashboard')} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><X size={20}/></button>
               </div>
               
               <div className="p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tgl Distribusi</label><input type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-[#0F2650]" onChange={e => setTanggal(e.target.value)} /></div>
                     <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Menu Utama</label><input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-[#0F2650]" placeholder="Nasi, Ayam goreng..." onChange={e => setMenu(e.target.value)} /></div>
                  </div>

                  {/* NUTRISI */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {['Besar', 'Kecil'].map(tipe => (
                       <div key={tipe} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <h4 className="text-[10px] font-black text-[#0F2650] uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-3"><Activity size={16} className="text-blue-500" /> Nutrisi {tipe}</h4>
                          <div className="space-y-4">
                             {['Energi', 'Protein', 'Lemak', 'Karbo', 'Serat'].map(g => (
                                <div key={g} className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">{g}<input type="number" className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-xs text-right font-black outline-none focus:border-blue-500" placeholder="0" onChange={e => setGizi(prev => ({...prev, [tipe.toLowerCase()]: {...prev[tipe.toLowerCase() as 'besar'|'kecil'], [g.toLowerCase()]: e.target.value}}))} /></div>
                             ))}
                          </div>
                       </div>
                     ))}
                  </div>

                  {/* REALISASI PENERIMA MANFAAT DENGAN SHORTCUT */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-[#0F2650] uppercase tracking-widest italic ml-1">Realisasi Penerima Manfaat</h4>
                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 max-h-80 overflow-y-auto space-y-3 shadow-inner">
                        {listSekolah.map(s => (
                        <div key={s.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex-1 w-full md:w-auto">
                              <p className="text-[11px] font-black text-slate-700 uppercase leading-none mb-1">{s.nama_sekolah}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">TARGET: {s.target_porsi}</p>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                              {/* SHORTCUT ANGKA TARGET */}
                              <button 
                                onClick={() => setRealisasi(prev => ({...prev, [s.id]: s.target_porsi.toString()}))}
                                className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                              >
                                {s.target_porsi}
                              </button>

                              {/* RESTART / RESET KE 0 */}
                              <button 
                                onClick={() => setRealisasi(prev => ({...prev, [s.id]: '0'}))}
                                className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                title="Reset ke 0"
                              >
                                <RotateCcw size={14} />
                              </button>

                              <div className="relative flex items-center">
                                <input 
                                  type="number" 
                                  className="w-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-black outline-none focus:border-indigo-500" 
                                  placeholder="0" 
                                  value={realisasi[s.id] || ''}
                                  onChange={e => setRealisasi(prev => ({...prev, [s.id]: e.target.value}))} 
                                />
                                <span className="ml-2 text-[9px] font-black text-slate-400 uppercase">Pack</span>
                              </div>
                            </div>
                        </div>
                        ))}
                    </div>
                  </div>

                  {/* DOKUMENTASI */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-[#0F2650] uppercase tracking-widest italic ml-1">Dokumentasi Distribusi</h4>
                    <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer relative group">
                        <Utensils size={32} className="mb-3 opacity-20 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Upload Foto Laporan</span>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFoto(e.target.files?.[0])} />
                        {foto && <div className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase flex items-center gap-2 animate-bounce"><CheckCircle2 size={12}/> {foto.name}</div>}
                    </div>
                  </div>

                  <button onClick={handleSimpanLaporan} disabled={loading} className="w-full py-6 bg-[#0F2650] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                     {loading ? 'MEMPROSES...' : <>Kirim Laporan Final <ArrowRight size={18} /></>}
                  </button>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}