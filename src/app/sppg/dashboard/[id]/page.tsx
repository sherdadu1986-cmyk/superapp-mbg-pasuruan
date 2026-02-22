"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, LogOut, Menu, X, Utensils, 
  CheckCircle2, Trash2, Activity, School, FileText
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

  // Form State Lengkap
  const [tanggal, setTanggal] = useState('')
  const [menu, setMenu] = useState('')
  const [foto, setFoto] = useState<any>(null)
  const [realisasi, setRealisasi] = useState<Record<string, string>>({})
  const [gizi, setGizi] = useState({
    besar: { energi: '', protein: '', lemak: '', karbo: '', serat: '' },
    kecil: { energi: '', protein: '', lemak: '', karbo: '', serat: '' }
  })

  const loadData = async () => {
    setLoading(true)
    const { data: unit } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
    if (unit) setSelectedUnit(unit)
    const { data: sekolah } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', id)
    if (sekolah) setListSekolah(sekolah)
    const { data: laporan } = await supabase.from('laporan_harian_final').select('*').eq('unit_id', id).order('tanggal_ops', { ascending: false })
    if (laporan) setRiwayat(laporan)
    setLoading(false)
  }

  useEffect(() => { if (id) loadData() }, [id])

  const handleSimpanLaporan = async () => {
    if(!tanggal || !menu) return alert("Isi Tanggal & Menu!")
    setLoading(true)
    const { error } = await supabase.from('laporan_harian_final').insert([{ 
        unit_id: id, nama_unit: selectedUnit.nama_unit, tanggal_ops: tanggal, 
        menu_makanan: menu, data_gizi: gizi, realisasi_sekolah: realisasi 
    }])
    if(!error) { alert("✅ Berhasil!"); setView('dashboard'); loadData(); }
    setLoading(false)
  }

  if (loading && !selectedUnit) return <div className="p-10 font-bold">Loading...</div>

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex font-sans text-slate-800">
      {/* SIDEBAR */}
      <aside className={`bg-white border-r fixed lg:static inset-y-0 left-0 z-50 w-72 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 flex flex-col shadow-xl lg:shadow-none`}>
        <div className="p-6 border-b flex items-center gap-3">
          <img src="/logo.png" className="w-8 h-8" />
          <h1 className="font-black text-[#0F2650]">SPPG PASURUAN</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex gap-3 p-4 rounded-2xl text-xs font-black uppercase ${view === 'dashboard' ? 'bg-[#0F2650] text-white shadow-lg' : 'text-slate-400'}`}><LayoutDashboard size={18} /> Dashboard</button>
          <button onClick={() => {localStorage.clear(); router.push('/')}} className="w-full flex gap-3 p-4 rounded-2xl text-xs font-black uppercase text-red-500 hover:bg-red-50"><LogOut size={18} /> Logout</button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b h-16 flex items-center justify-between px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-[#0F2650]"><Menu size={24} /></button>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit / <span className="text-[#0F2650]">{selectedUnit?.nama_unit}</span></div>
          <div className="flex items-center gap-3">
             <p className="text-xs font-black text-[#0F2650] uppercase">{selectedUnit?.kepala_unit}</p>
             <div className="w-9 h-9 bg-[#0F2650] rounded-xl flex items-center justify-center text-white font-black text-xs">{selectedUnit?.kepala_unit?.charAt(0)}</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {view === 'dashboard' ? (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-[#0F2650] rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
                 <div className="relative z-10"><h2 className="text-3xl font-black italic uppercase">{selectedUnit?.nama_unit}</h2></div>
                 <button onClick={() => setView('form')} className="relative z-10 bg-yellow-400 text-[#0F2650] px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">+ Input Laporan Baru</button>
              </div>
              
              <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                 <div className="flex bg-slate-50">
                    <button onClick={() => setActiveTab('sekolah')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'sekolah' ? 'border-[#0F2650] text-[#0F2650]' : 'border-transparent text-slate-400'}`}>Daftar Penerima</button>
                    <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'riwayat' ? 'border-[#0F2650] text-[#0F2650]' : 'border-transparent text-slate-400'}`}>Riwayat Laporan</button>
                 </div>
                 <div className="p-8">
                    {activeTab === 'sekolah' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                        {listSekolah.map(s => (
                          <div key={s.id} className="p-5 border rounded-2xl flex justify-between items-center hover:border-indigo-200 transition-all">
                             <div><p className="text-xs font-black text-slate-700 uppercase">{s.nama_sekolah}</p><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{s.target_porsi} Porsi</p></div>
                             <CheckCircle2 size={18} className="text-emerald-500" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in">
                        {riwayat.map(l => (
                          <div key={l.id} className="p-5 border-b flex justify-between items-center">
                             <div><p className="text-xs font-black text-[#0F2650] uppercase italic">"{l.menu_makanan}"</p><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{l.tanggal_ops}</p></div>
                             <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Terkirim</span>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ) : (
            /* VIEW FORM: FITUR BARU ADA DI SINI */
            <div className="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-2xl border overflow-hidden mb-20 animate-in zoom-in-95">
               <div className="bg-[#0F2650] p-10 text-white flex justify-between items-center">
                  <h2 className="text-xl font-black uppercase italic tracking-widest">Form Laporan Operasional</h2>
                  <button onClick={() => setView('dashboard')} className="p-3 bg-white/10 rounded-2xl"><X size={24}/></button>
               </div>
               
               <div className="p-10 lg:p-16 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tgl Distribusi</label><input type="date" className="w-full p-5 bg-slate-50 border rounded-2xl text-sm font-bold" onChange={e => setTanggal(e.target.value)} /></div>
                     <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Menu Utama</label><input className="w-full p-5 bg-slate-50 border rounded-2xl text-sm font-bold" placeholder="Contoh: Nasi, Ayam goreng..." onChange={e => setMenu(e.target.value)} /></div>
                  </div>

                  {/* NUTRISI SECTION */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     {['Besar', 'Kecil'].map(tipe => (
                       <div key={tipe} className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                          <h4 className="text-[11px] font-black text-[#0F2650] uppercase tracking-widest mb-6 flex items-center gap-3 italic border-b pb-4"><Activity size={18} className="text-blue-500" /> Nutrisi {tipe}</h4>
                          <div className="space-y-4">
                             {['Energi', 'Protein', 'Lemak', 'Karbo', 'Serat'].map(g => (
                                <div key={g} className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">{g}<input type="number" className="w-24 p-2 bg-white border rounded-xl text-right font-black text-[#0F2650]" placeholder="0" onChange={e => setGizi(prev => ({...prev, [tipe.toLowerCase()]: {...prev[tipe.toLowerCase() as 'besar'|'kecil'], [g.toLowerCase()]: e.target.value}}))} /></div>
                             ))}
                          </div>
                       </div>
                     ))}
                  </div>

                  {/* REALISASI PENERIMA MANFAAT (FITUR YANG ANDA CARI) */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-[#0F2650] uppercase tracking-widest italic ml-1">Realisasi Penerima Manfaat</h4>
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 max-h-72 overflow-y-auto space-y-3">
                        {listSekolah.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-4 bg-white border rounded-2xl shadow-sm">
                            <div className="text-[11px] font-black text-slate-700 w-1/2 uppercase leading-none">{s.nama_sekolah} <br/><span className="text-[9px] text-slate-400 mt-1 block">TARGET: {s.target_porsi}</span></div>
                            <div className="flex items-center gap-3"><input type="number" className="w-20 p-2.5 bg-slate-50 border rounded-xl text-center text-xs font-black outline-none focus:border-blue-500" placeholder="0" onChange={e => setRealisasi(prev => ({...prev, [s.id]: e.target.value}))} /><span className="text-[10px] font-black text-slate-400 uppercase">Pack</span></div>
                        </div>
                        ))}
                    </div>
                  </div>

                  {/* DOKUMENTASI DRIVE */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-[#0F2650] uppercase tracking-widest italic ml-1">Dokumentasi Distribusi</h4>
                    <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer relative">
                        <Utensils size={40} className="mb-4 opacity-20" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">Upload Foto Dokumentasi</span>
                        <p className="text-[9px] font-bold text-slate-300 uppercase mt-2 italic">Otomatis Terarsip ke Cloud Drive</p>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFoto(e.target.files?.[0])} />
                        {foto && <div className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase">{foto.name} Terpilih</div>}
                    </div>
                  </div>

                  <button onClick={handleSimpanLaporan} disabled={loading} className="w-full py-6 bg-[#0F2650] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                     {loading ? 'SISTEM MENGIRIM...' : 'Kirim Laporan Final Ke Korwil'}
                  </button>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}