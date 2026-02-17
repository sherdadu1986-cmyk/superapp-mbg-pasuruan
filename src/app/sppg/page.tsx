"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
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
  Trash2
} from 'lucide-react'

export default function SPPGPage() {
  const router = useRouter()
  const [listUnit, setListUnit] = useState<any[]>([])
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard')
  const [loading, setLoading] = useState(false)
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

  // --- LOGIC LOAD DATA ---
  const loadUnitData = async (unitId: string) => {
    const { data: sekolah } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', unitId).order('jenjang', { ascending: true })
    if (sekolah) setListSekolah(sekolah)
    const { data: laporan } = await supabase.from('laporan_harian_final').select('*').eq('unit_id', unitId).order('tanggal_ops', { ascending: false })
    if (laporan) setRiwayat(laporan)
  }

  useEffect(() => {
    const initData = async () => {
      const { data: units } = await supabase.from('daftar_sppg').select('*').order('nama_unit')
      if (units) setListUnit(units)
      const storedUnitId = typeof window !== 'undefined' ? localStorage.getItem('user_unit_id') : null
      if (storedUnitId && storedUnitId !== 'null' && storedUnitId !== '') {
        const { data: myUnit } = await supabase.from('daftar_sppg').select('*').eq('id', storedUnitId).single()
        if (myUnit) { setSelectedUnit(myUnit); loadUnitData(myUnit.id); }
      }
    }
    initData()
  }, [])

  // --- ACTIONS ---
  const handleUnitLogin = (e: any) => {
    const unit = listUnit.find(u => u.nama_unit === e.target.value)
    if(unit) { setSelectedUnit(unit); loadUnitData(unit.id); }
  }

  const handleLogout = () => { localStorage.clear(); router.push('/'); }

  const handleAddSekolah = async () => {
    if(!newSekolah.nama || newSekolah.target <= 0) return alert("Lengkapi Data Sekolah!")
    setLoading(true)
    const { error } = await supabase.from('daftar_sekolah').insert([{
      sppg_id: selectedUnit.id, nama_sekolah: newSekolah.nama, target_porsi: newSekolah.target, jenjang: newSekolah.jenjang
    }])
    if(!error) { alert("✅ Data Tersimpan!"); setNewSekolah({ nama: '', target: 0, jenjang: 'SD/MI' }); loadUnitData(selectedUnit.id); }
    setLoading(false)
  }

  const handleDeleteSekolah = async (id: string) => {
    if(confirm("Hapus data penerima ini?")) {
      const { error } = await supabase.from('daftar_sekolah').delete().eq('id', id)
      if(!error) loadUnitData(selectedUnit.id)
    }
  }

  const handleSimpanLaporan = async () => {
    if(!tanggal || !menu) return alert("Wajib isi Tanggal & Menu!")
    setLoading(true)
    const { error } = await supabase.from('laporan_harian_final').insert([{
      unit_id: selectedUnit.id, nama_unit: selectedUnit.nama_unit, tanggal_ops: tanggal, menu_makanan: menu, data_gizi: gizi, foto_url: 'dummy_url'
    }])
    if(!error) { 
      alert("✅ Laporan Berhasil Dikirim!"); setView('dashboard'); loadUnitData(selectedUnit.id); 
      setTanggal(''); setMenu(''); setRealisasi({});
    } else {
        alert("Gagal kirim: " + error.message);
    }
    setLoading(false)
  }

  // --- VIEW LOGIN ---
  if (!selectedUnit) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md text-center">
          <img src="/logo.png" alt="Logo" className="w-16 mx-auto mb-4" onError={(e) => e.currentTarget.style.display='none'}/>
          <h2 className="text-xl font-bold text-[#0F2650] mb-2 uppercase italic tracking-tighter">Portal SPPG</h2>
          <p className="text-xs text-slate-400 mb-6 font-bold uppercase tracking-widest">Pilih Unit Operasional</p>
          <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none" onChange={handleUnitLogin}>
            <option value="">-- PILIH UNIT --</option>
            {listUnit.map(u => <option key={u.id} value={u.nama_unit}>{u.nama_unit}</option>)}
          </select>
          <button onClick={handleLogout} className="mt-8 text-slate-400 text-[10px] font-black hover:text-red-500 uppercase tracking-widest">← Keluar Sistem</button>
        </div>
      </div>
    )
  }

  // --- MAIN LAYOUT ---
  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans flex text-slate-800 relative">
      
      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-[#0F2650]/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300" onClick={() => setSidebarOpen(false)}/>
      )}

      {/* SIDEBAR */}
      <aside className={`bg-white border-r border-slate-200 fixed lg:static inset-y-0 left-0 z-50 w-72 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="w-8 h-8" onError={(e) => e.currentTarget.style.display='none'} />
            <div>
              <h1 className="font-black text-[#0F2650] text-lg leading-none">SPPG</h1>
              <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">KAB. PASURUAN</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-red-500"><X size={20} /></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => { setView('dashboard'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${view === 'dashboard' ? 'bg-[#0F2650] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => { setView('dashboard'); setActiveTab('sekolah'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'sekolah' && view === 'dashboard' ? 'bg-slate-100 text-[#0F2650]' : 'text-slate-400 hover:bg-slate-50'}`}>
            <School size={18} /> Data Sekolah
          </button>
          <button onClick={() => { setView('dashboard'); setActiveTab('riwayat'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'riwayat' && view === 'dashboard' ? 'bg-slate-100 text-[#0F2650]' : 'text-slate-400 hover:bg-slate-50'}`}>
            <FileText size={18} /> Riwayat
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-[#0F2650] hover:bg-slate-50 rounded-lg"><Menu size={24} /></button>
            <div className="text-sm font-black text-[#0F2650] lg:hidden uppercase italic tracking-tighter">{selectedUnit.nama_unit}</div>
            <div className="text-[10px] font-bold text-slate-400 hidden lg:block uppercase tracking-widest">Home / <span className="text-[#0F2650]">Dashboard</span></div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden md:block">
               <p className="text-xs font-black text-[#0F2650] uppercase leading-none">{selectedUnit.kepala_unit}</p>
               <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Kepala SPPG</p>
             </div>
             <div className="w-9 h-9 bg-[#0F2650] rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg">{selectedUnit.kepala_unit.charAt(0)}</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {view === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
              {/* Identity Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shrink-0"><img src="/logo.png" className="w-12" onError={(e) => e.currentTarget.style.display='none'} /></div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-[#0F2650] uppercase italic tracking-tighter mb-1">{selectedUnit.nama_unit}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[9px] font-black rounded-full border border-blue-100 uppercase tracking-widest">{selectedUnit.yayasan || 'Umum'}</span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-100 flex items-center gap-1 uppercase tracking-widest"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Aktif</span>
                  </div>
                </div>
                <div className="flex gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 w-full md:w-auto justify-center">
                   <div className="text-center"><p className="text-2xl font-black text-[#0F2650]">{listSekolah.length}</p><p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Penerima</p></div>
                   <div className="text-center"><p className="text-2xl font-black text-[#0F2650]">{riwayat.length}</p><p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Laporan</p></div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-black text-[10px] text-[#0F2650] uppercase tracking-widest">Laporan Wajib</h3>
                      <AlertCircle size={14} className="text-orange-500" />
                    </div>
                    <div className="p-4">
                      <button onClick={() => { setView('form'); setSidebarOpen(false); }} className="w-full group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-[#0F2650] transition-all">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center font-black text-xs">1</div>
                           <div className="text-left"><p className="text-[10px] font-black text-slate-700 uppercase">Laporan Harian</p><p className="text-[9px] text-slate-400 font-bold">Wajib isi sebelum 14:00</p></div>
                         </div>
                         <div className="bg-red-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Input</div>
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#0F2650] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                    <div className="relative z-10">
                      <h3 className="font-black text-sm uppercase tracking-widest mb-3">Penting!</h3>
                      <ul className="text-[10px] space-y-2 opacity-80 list-disc pl-4 font-bold uppercase tracking-wider"><li>Cek target porsi tiap sekolah</li><li>Pastikan foto porsi jelas</li></ul>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
                    <div className="flex border-b border-slate-100">
                      <button onClick={() => setActiveTab('sekolah')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'sekolah' ? 'border-[#0F2650] text-[#0F2650] bg-slate-50' : 'border-transparent text-slate-400'}`}>Penerima Manfaat</button>
                      <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'riwayat' ? 'border-[#0F2650] text-[#0F2650] bg-slate-50' : 'border-transparent text-slate-400'}`}>Riwayat</button>
                    </div>
                    <div className="p-4 lg:p-6">
                      {activeTab === 'sekolah' && (
                        <div className="space-y-4 animate-in fade-in">
                          {/* INPUT TAMBAH DATA SEKOLAH */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                             <p className="text-[10px] font-black text-[#0F2650] mb-3 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14}/> Tambah Data Baru</p>
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <select className="p-2.5 rounded-lg border border-slate-300 text-[10px] font-bold outline-none uppercase" value={newSekolah.jenjang} onChange={e => setNewSekolah({...newSekolah, jenjang: e.target.value})}>
                                  {KATEGORI_PM.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                                <input placeholder="NAMA SEKOLAH / KELOMPOK" className="md:col-span-2 p-2.5 rounded-lg border border-slate-300 text-[10px] font-bold outline-none uppercase" value={newSekolah.nama} onChange={e => setNewSekolah({...newSekolah, nama: e.target.value})} />
                                <input type="number" placeholder="TARGET" className="p-2.5 rounded-lg border border-slate-300 text-[10px] font-bold outline-none" value={newSekolah.target} onChange={e => setNewSekolah({...newSekolah, target: parseInt(e.target.value)})} />
                             </div>
                             <button onClick={handleAddSekolah} disabled={loading} className="w-full mt-2 bg-[#0F2650] text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-all">{loading ? '...' : '+ Simpan Data'}</button>
                          </div>
                          
                          {listSekolah.length > 0 ? listSekolah.map((s) => (
                               <div key={s.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black border border-blue-100">{s.jenjang.substring(0,2)}</div>
                                     <div>
                                        <p className="text-[11px] font-black text-slate-700 uppercase truncate max-w-[150px]">{s.nama_sekolah}</p>
                                        <p className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-widest">{s.target_porsi} Porsi</p>
                                     </div>
                                  </div>
                                  <button onClick={() => handleDeleteSekolah(s.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                               </div>
                          )) : <div className="text-center py-20 text-slate-300 italic text-[10px] font-bold uppercase tracking-widest">Belum ada data.</div>}
                        </div>
                      )}
                      {activeTab === 'riwayat' && (
                        <div className="space-y-3 animate-in fade-in">
                           {riwayat.length > 0 ? riwayat.map((l) => (
                             <div key={l.id} className="flex gap-4 p-4 border border-slate-50 rounded-xl hover:bg-slate-50 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 size={18} /></div>
                                <div className="flex-1 min-w-0">
                                   <div className="flex justify-between items-start mb-1"><h4 className="text-[10px] font-black text-slate-700 uppercase truncate">Laporan Terkirim</h4><span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">{l.tanggal_ops}</span></div>
                                   <p className="text-[9px] text-slate-500 font-bold truncate italic">"{l.menu_makanan}"</p>
                                </div>
                             </div>
                           )) : <div className="text-center py-20 text-slate-300 italic text-[10px] font-bold uppercase tracking-widest">Belum ada laporan.</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW FORM (SUDAH DIPERBAIKI) */}
          {view === 'form' && (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-10">
               <div className="bg-[#0F2650] p-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest italic">Input Laporan Harian</h2>
                    <p className="text-[9px] opacity-70 font-bold uppercase tracking-widest">{selectedUnit.nama_unit}</p>
                  </div>
                  <button onClick={() => setView('dashboard')} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all"><X size={18}/></button>
               </div>
               
               <div className="p-6 space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tgl Operasional</label>
                    <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" onChange={e => setTanggal(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Besar', 'Kecil'].map(tipe => (
                      <div key={tipe} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-[9px] font-black text-[#0F2650] uppercase tracking-widest mb-4 border-b border-slate-200 pb-2 italic">Nutrisi Porsi {tipe}</h4>
                        <div className="space-y-3">
                           {['Energi', 'Protein', 'Lemak', 'Karbo', 'Serat'].map(g => (
                             <div key={g} className="flex justify-between items-center">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{g}</span>
                               <input type="number" placeholder="0" className="w-20 p-2 text-right text-xs font-black border border-slate-200 rounded-lg outline-none focus:border-blue-500" 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setGizi(prev => ({...prev, [tipe.toLowerCase()]: {...prev[tipe.toLowerCase() as 'besar'|'kecil'], [g.toLowerCase()]: val}}))
                                  }}
                               />
                             </div>
                           ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* === BAGIAN YANG HILANG SUDAH DIKEMBALIKAN DI SINI === */}
                  <div>
                    <h4 className="text-[10px] font-black text-[#0F2650] uppercase tracking-widest italic mb-3">Realisasi Distribusi</h4>
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-60 overflow-y-auto">
                      {listSekolah.length > 0 ? listSekolah.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                           <div className="text-[10px] font-black text-slate-700 w-1/2 uppercase">{s.nama_sekolah} <br/><span className="text-[8px] text-slate-400 font-bold tracking-wide">TARGET: {s.target_porsi}</span></div>
                           <div className="flex items-center gap-2">
                              <input type="number" placeholder="0" className="w-16 p-2 border border-slate-200 rounded-lg text-center text-xs font-black outline-none focus:border-blue-500" 
                                onChange={(e) => setRealisasi(prev => ({...prev, [s.id]: e.target.value}))}
                              />
                              <span className="text-[9px] font-black text-slate-400 uppercase">Pack</span>
                           </div>
                        </div>
                      )) : <p className="text-center text-[10px] text-slate-400 italic">Belum ada data sekolah. Tambahkan di menu 'Data Sekolah' terlebih dahulu.</p>}
                    </div>
                  </div>
                  {/* ==================================================== */}

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-[#0F2650] uppercase tracking-widest italic">Rincian Menu & Foto</h4>
                    <textarea className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" placeholder="Isi menu hari ini..." onChange={e => setMenu(e.target.value)}></textarea>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-8 hover:border-[#0F2650] hover:text-[#0F2650] transition-all cursor-pointer relative">
                        <Utensils size={24} className="mb-2 opacity-50" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Klik Upload Foto</span>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFoto(e.target.files?.[0])} />
                        {foto && <p className="text-[9px] text-emerald-500 font-bold mt-2 absolute bottom-2">{foto.name}</p>}
                    </div>
                  </div>

                  <button onClick={handleSimpanLaporan} disabled={loading} className="w-full py-4 bg-[#0F2650] text-white rounded-xl font-black shadow-lg hover:shadow-blue-900/40 transition-all uppercase tracking-[0.2em] text-xs">
                    {loading ? 'Mengirim...' : 'Kirim Laporan Final'}
                  </button>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}