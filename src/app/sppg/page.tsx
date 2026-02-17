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
  Utensils, 
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

export default function SPPGPage() {
  const router = useRouter()
  
  // --- STATE DATA ---
  const [listUnit, setListUnit] = useState<any[]>([])
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  const [riwayat, setRiwayat] = useState<any[]>([])

  // --- STATE UI ---
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'sekolah' | 'riwayat'>('sekolah')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // --- STATE FORM ---
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

  // =========================================
  // LOGIC LOAD DATA
  // =========================================
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
        if (myUnit) {
          setSelectedUnit(myUnit)
          loadUnitData(myUnit.id)
        }
      }
    }
    initData()
  }, [])

  // =========================================
  // ACTIONS
  // =========================================
  const handleUnitLogin = (e: any) => {
    const unit = listUnit.find(u => u.nama_unit === e.target.value)
    if(unit) { setSelectedUnit(unit); loadUnitData(unit.id); }
  }

  const handleAddSekolah = async () => {
    if(!newSekolah.nama || newSekolah.target <= 0) return alert("Lengkapi Data!")
    setLoading(true)
    const { error } = await supabase.from('daftar_sekolah').insert([{
      sppg_id: selectedUnit.id, nama_sekolah: newSekolah.nama, target_porsi: newSekolah.target, jenjang: newSekolah.jenjang
    }])
    if(!error) { alert("✅ Berhasil Ditambahkan!"); setNewSekolah({ nama: '', target: 0, jenjang: 'SD/MI' }); loadUnitData(selectedUnit.id); }
    setLoading(false)
  }

  const handleDeleteSekolah = async (id: string) => {
    if(confirm("Hapus data ini?")) {
      const { error } = await supabase.from('daftar_sekolah').delete().eq('id', id)
      if(!error) loadUnitData(selectedUnit.id)
    }
  }

  const handleSimpanLaporan = async () => {
    if(!tanggal || !menu) return alert("Lengkapi Tanggal & Menu!")
    setLoading(true)
    const { error } = await supabase.from('laporan_harian_final').insert([{
      unit_id: selectedUnit.id, nama_unit: selectedUnit.nama_unit, tanggal_ops: tanggal, menu_makanan: menu, data_gizi: gizi, foto_url: 'dummy_url'
    }])
    if(!error) { 
      alert("✅ Laporan Terkirim!"); setView('dashboard'); loadUnitData(selectedUnit.id); 
      setTanggal(''); setMenu(''); setRealisasi({});
    }
    setLoading(false)
  }

  const handleLogout = () => { localStorage.clear(); router.push('/'); }

  // =========================================
  // VIEW 1: LOGIN UNIT
  // =========================================
  if (!selectedUnit) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md text-center">
          <img src="/logo.png" alt="Logo" className="w-16 mx-auto mb-4 opacity-80" onError={(e) => e.currentTarget.style.display='none'}/>
          <h2 className="text-xl font-bold text-[#0F2650] mb-2 uppercase">Portal SPPG</h2>
          <p className="text-xs text-slate-400 mb-6">Silakan pilih unit operasional Anda</p>
          <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#0F2650]" onChange={handleUnitLogin}>
            <option value="">-- Pilih Unit --</option>
            {listUnit.map(u => <option key={u.id} value={u.nama_unit}>{u.nama_unit}</option>)}
          </select>
          <button onClick={handleLogout} className="mt-8 text-slate-400 text-xs font-bold hover:text-red-500">← Keluar Sistem</button>
        </div>
      </div>
    )
  }

  // =========================================
  // LAYOUT UTAMA
  // =========================================
  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans flex text-slate-800">
      
      {/* SIDEBAR */}
      <aside className={`bg-white border-r border-slate-200 fixed lg:static inset-y-0 left-0 z-50 w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col`}>
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <img src="/logo.png" className="w-8 h-8" onError={(e) => e.currentTarget.style.display='none'} />
          <div>
            <h1 className="font-black text-[#0F2650] text-lg leading-none">SPPG</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider">DASHBOARD</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${view === 'dashboard' ? 'bg-[#0F2650] text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-50'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => { setView('dashboard'); setActiveTab('sekolah'); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'sekolah' && view === 'dashboard' ? 'bg-slate-100 text-[#0F2650]' : 'text-slate-500 hover:bg-slate-50'}`}>
            <School size={18} /> Data Sekolah
          </button>
          <button onClick={() => { setView('dashboard'); setActiveTab('riwayat'); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'riwayat' && view === 'dashboard' ? 'bg-slate-100 text-[#0F2650]' : 'text-slate-500 hover:bg-slate-50'}`}>
            <FileText size={18} /> Riwayat Laporan
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-slate-500"><Menu /></button>
            <div className="text-sm breadcrumbs text-slate-400 hidden md:block">
              <span>Home</span> / <span className="text-[#0F2650] font-bold">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-[#0F2650]">{selectedUnit.kepala_unit}</p>
              {/* === [BAGIAN YANG DIUBAH] === */}
              <p className="text-[10px] text-slate-400">Kepala SPPG</p>
            </div>
            <div className="w-8 h-8 bg-[#0F2650] rounded-full flex items-center justify-center text-white font-bold text-xs">
              {selectedUnit.kepala_unit.charAt(0)}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          
          {view === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-8">
              
              {/* 1. IDENTITY CARD */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shrink-0">
                   <img src="/logo.png" className="w-12 opacity-80" onError={(e) => e.currentTarget.style.display='none'} /> 
                   <School className="text-slate-300 w-8 h-8 absolute -z-10" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-black text-[#0F2650] uppercase mb-1">{selectedUnit.nama_unit}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100 uppercase">{selectedUnit.yayasan || 'Yayasan Umum'}</span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100 flex items-center gap-1">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Status: Aktif
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                   <div className="text-center">
                      <p className="text-2xl font-black text-[#0F2650]">{listSekolah.length}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Penerima</p>
                   </div>
                   <div className="text-center">
                      <p className="text-2xl font-black text-[#0F2650]">{riwayat.length}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Laporan</p>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 2. KOLOM KIRI: MENU & ACTION */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-sm text-[#0F2650]">Laporan Wajib Harian</h3>
                      <AlertCircle size={16} className="text-orange-500" />
                    </div>
                    <div className="p-4">
                      <button 
                        onClick={() => setView('form')}
                        className="w-full group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all mb-2"
                      >
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center font-bold text-xs">1</div>
                           <div className="text-left">
                             <p className="text-xs font-bold text-slate-700">Laporan Distribusi</p>
                             <p className="text-[10px] text-slate-400">Wajib isi sebelum jam 14.00</p>
                           </div>
                         </div>
                         <div className="bg-red-500 text-white px-3 py-1 rounded text-[10px] font-bold">Belum</div>
                      </button>

                      <div className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl opacity-60 cursor-not-allowed">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">2</div>
                           <div className="text-left">
                             <p className="text-xs font-bold text-slate-700">Laporan Keuangan</p>
                             <p className="text-[10px] text-slate-400">Fitur segera hadir</p>
                           </div>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0F2650] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                    <div className="relative z-10">
                      <h3 className="font-bold text-lg mb-2">Penting!</h3>
                      <ul className="text-xs space-y-2 opacity-90 list-disc pl-4">
                        <li>Mohon isi data sebelum tenggat waktu.</li>
                        <li>Pastikan foto dokumentasi jelas.</li>
                        <li>Jaga kerahasiaan akun Anda.</li>
                      </ul>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  </div>
                </div>

                {/* 3. KOLOM KANAN: TAB KONTEN */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
                    <div className="flex border-b border-slate-100">
                      <button onClick={() => setActiveTab('sekolah')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'sekolah' ? 'border-[#0F2650] text-[#0F2650] bg-slate-50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        Manajemen PM
                      </button>
                      <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'riwayat' ? 'border-[#0F2650] text-[#0F2650] bg-slate-50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        Riwayat Aktivitas
                      </button>
                    </div>

                    <div className="p-6">
                      {activeTab === 'sekolah' && (
                        <div className="space-y-6 animate-in fade-in">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                             <p className="text-xs font-bold text-[#0F2650] mb-3 flex items-center gap-2"><TrendingUp size={14}/> Tambah Data Baru</p>
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <select className="p-2.5 rounded-lg border border-slate-300 text-xs font-bold outline-none" value={newSekolah.jenjang} onChange={e => setNewSekolah({...newSekolah, jenjang: e.target.value})}>
                                  {KATEGORI_PM.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                                <input placeholder="Nama Sekolah/Kelompok" className="md:col-span-2 p-2.5 rounded-lg border border-slate-300 text-xs font-bold outline-none" value={newSekolah.nama} onChange={e => setNewSekolah({...newSekolah, nama: e.target.value})} />
                                <input type="number" placeholder="Target" className="p-2.5 rounded-lg border border-slate-300 text-xs font-bold outline-none" value={newSekolah.target} onChange={e => setNewSekolah({...newSekolah, target: parseInt(e.target.value)})} />
                             </div>
                             <button onClick={handleAddSekolah} disabled={loading} className="w-full mt-2 bg-[#0F2650] text-white py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 transition-all">
                               {loading ? '...' : '+ Simpan Data'}
                             </button>
                          </div>

                          <div className="space-y-3">
                             {listSekolah.length > 0 ? listSekolah.map((s, i) => (
                               <div key={s.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all group">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100">
                                       {s.jenjang.substring(0,2)}
                                     </div>
                                     <div>
                                        <p className="text-xs font-bold text-slate-700">{s.nama_sekolah}</p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5 bg-slate-100 inline-block px-2 py-0.5 rounded">{s.target_porsi} Porsi</p>
                                     </div>
                                  </div>
                                  <button onClick={() => handleDeleteSekolah(s.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><LogOut size={14} /></button>
                               </div>
                             )) : <div className="text-center py-10 text-slate-300 italic text-xs">Belum ada data penerima manfaat.</div>}
                          </div>
                        </div>
                      )}

                      {activeTab === 'riwayat' && (
                        <div className="space-y-4 animate-in fade-in">
                           {riwayat.length > 0 ? riwayat.map((l) => (
                             <div key={l.id} className="flex gap-4 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all rounded-xl">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                   <CheckCircle2 size={20} />
                                </div>
                                <div className="flex-1">
                                   <div className="flex justify-between items-start">
                                      <h4 className="text-xs font-bold text-slate-700">Laporan Distribusi Harian</h4>
                                      <span className="text-[10px] text-slate-400 font-mono">{l.created_at ? new Date(l.created_at).toLocaleDateString() : '-'}</span>
                                   </div>
                                   <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{l.menu_makanan}</p>
                                   <div className="mt-2 flex gap-2">
                                      <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">Tgl Ops: {l.tanggal_ops}</span>
                                   </div>
                                </div>
                             </div>
                           )) : <div className="text-center py-10 text-slate-300 italic text-xs">Belum ada laporan.</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'form' && (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
               <div className="bg-[#0F2650] p-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold">Form Laporan Harian</h2>
                    <p className="text-xs opacity-80">{selectedUnit.nama_unit}</p>
                  </div>
                  <button onClick={() => setView('dashboard')} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold transition-all">Batal</button>
               </div>
               
               <div className="p-8 space-y-8">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Tanggal Operasional</label>
                    <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" onChange={e => setTanggal(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['Besar', 'Kecil'].map(tipe => (
                      <div key={tipe} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-xs font-black text-[#0F2650] uppercase mb-3 border-b border-slate-200 pb-2">Porsi {tipe}</h4>
                        <div className="space-y-2">
                           {['Energi', 'Protein', 'Lemak', 'Karbo', 'Serat'].map(g => (
                             <div key={g} className="flex justify-between items-center">
                               <span className="text-[10px] font-bold text-slate-500 uppercase">{g}</span>
                               <input type="number" placeholder="0" className="w-16 p-1 text-right text-xs font-bold border border-slate-200 rounded outline-none focus:border-blue-500" 
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

                  <div>
                    <h4 className="text-sm font-bold text-[#0F2650] mb-3">Realisasi Distribusi</h4>
                    <div className="space-y-2">
                      {listSekolah.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                           <div className="text-xs font-bold text-slate-700 w-1/2">{s.nama_sekolah} <span className="text-[9px] text-slate-400 font-normal">({s.target_porsi} target)</span></div>
                           <div className="flex items-center gap-2">
                              <input type="number" placeholder="0" className="w-20 p-2 border border-slate-200 rounded-lg text-center text-xs font-bold outline-none" 
                                onChange={(e) => setRealisasi(prev => ({...prev, [s.id]: e.target.value}))}
                              />
                              <span className="text-[10px] font-bold text-slate-400">Pack</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                     <div>
                       <label className="text-xs font-bold text-slate-500 mb-1 block">Menu Hari Ini</label>
                       <textarea className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" placeholder="Nasi, Ayam..." onChange={e => setMenu(e.target.value)}></textarea>
                     </div>
                     <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-4">
                        <Utensils size={24} className="mb-2" />
                        <label className="text-xs font-bold cursor-pointer hover:text-blue-500">
                           Upload Foto
                           <input type="file" className="hidden" onChange={e => setFoto(e.target.files?.[0])} />
                        </label>
                        {foto && <p className="text-[9px] text-emerald-500 font-bold mt-1">{foto.name}</p>}
                     </div>
                  </div>

                  <button onClick={handleSimpanLaporan} disabled={loading} className="w-full py-4 bg-[#0F2650] text-white rounded-xl font-bold shadow-lg hover:bg-blue-900 transition-all">
                    {loading ? 'Mengirim...' : 'Kirim Laporan'}
                  </button>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}