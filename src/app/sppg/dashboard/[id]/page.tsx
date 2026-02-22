"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, LogOut, Menu, X, Utensils, 
  CheckCircle2, School, Trash2, Plus, Edit3, ClipboardList
} from 'lucide-react'

export default function DashboardSPPGPage() {
  const { id } = useParams() 
  const router = useRouter()
  
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sekolah' | 'riwayat'>('sekolah')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Form Tambah Sekolah Tetap di Dashboard
  const [newSekolah, setNewSekolah] = useState({ nama: '', target: '', jenjang: 'SD/MI' })
  const KATEGORI_PM = ["PAUD/KB", "TK/RA", "SD/MI", "SMP/MTS", "SMA/SMK", "SANTRI", "BALITA", "BUMIL", "BUSUI"]

  const loadData = async () => {
    setLoading(true)
    const { data: unit } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
    const { data: sekolah } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', id).order('nama_sekolah', { ascending: true })
    const { data: laporan } = await supabase.from('laporan_harian_final').select('*').eq('unit_id', id).order('tanggal_ops', { ascending: false })
    
    if (unit) setSelectedUnit(unit)
    if (sekolah) setListSekolah(sekolah)
    if (laporan) setRiwayat(laporan)
    setLoading(false)
  }

  useEffect(() => { if (id) loadData() }, [id])

  const handleAddSekolah = async () => {
    if(!newSekolah.nama || !newSekolah.target) return alert("Lengkapi data!")
    await supabase.from('daftar_sekolah').insert([{ sppg_id: id, nama_sekolah: newSekolah.nama, target_porsi: parseInt(newSekolah.target), jenjang: newSekolah.jenjang }])
    setNewSekolah({ nama: '', target: '', jenjang: 'SD/MI' }); loadData();
  }

  const handleDeleteSekolah = async (sid: string) => {
    if(confirm("Hapus sekolah?")) { await supabase.from('daftar_sekolah').delete().eq('id', sid); loadData(); }
  }

  if (loading && !selectedUnit) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400 animate-pulse uppercase">Syncing Data...</div>

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex font-sans text-slate-800">
      <aside className={`bg-white border-r fixed lg:static inset-y-0 left-0 z-50 w-72 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b flex items-center gap-3"><img src="/logo.png" className="w-8 h-8" /><h1 className="font-black text-[#0F2650] italic">SPPG PASURUAN</h1></div>
        <nav className="flex-1 p-4"><button className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase rounded-xl bg-[#0F2650] text-white shadow-lg"><LayoutDashboard size={18} /> Dashboard</button></nav>
        <div className="p-4 border-t"><button onClick={() => {localStorage.clear(); router.push('/')}} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-red-500 uppercase"><LogOut size={16} /> Logout</button></div>
      </aside>

      <main className="flex-1 h-screen overflow-hidden flex flex-col">
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-[#0F2650]"><Menu size={24} /></button>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedUnit?.nama_unit}</div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-[#0F2650] rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
               <h2 className="text-3xl font-black italic uppercase relative z-10">{selectedUnit?.nama_unit}</h2>
               <button onClick={() => router.push(`/sppg/dashboard/${id}/input`)} className="bg-yellow-400 text-[#0F2650] px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl relative z-10 flex items-center gap-2 hover:scale-105 transition-all">
                 <ClipboardList size={18} /> + Input Laporan Hari Ini
               </button>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
               <div className="flex bg-slate-50">
                  <button onClick={() => setActiveTab('sekolah')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === 'sekolah' ? 'text-[#0F2650] border-b-2 border-[#0F2650]' : 'text-slate-400'}`}>Penerima Manfaat</button>
                  <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === 'riwayat' ? 'text-[#0F2650] border-b-2 border-[#0F2650]' : 'text-slate-400'}`}>Riwayat Laporan</button>
               </div>

               <div className="p-6">
                  {activeTab === 'sekolah' ? (
                    <div className="space-y-6 animate-in fade-in">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-dashed grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                         <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Jenjang</label><select className="w-full p-3 bg-white border rounded-xl text-xs font-bold" value={newSekolah.jenjang} onChange={e => setNewSekolah({...newSekolah, jenjang: e.target.value})}>{KATEGORI_PM.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                         <div className="md:col-span-1 space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Nama Sekolah</label><input className="w-full p-3 bg-white border rounded-xl text-xs font-bold" value={newSekolah.nama} onChange={e => setNewSekolah({...newSekolah, nama: e.target.value})} /></div>
                         <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Target</label><input type="number" className="w-full p-3 bg-white border rounded-xl text-xs font-bold" value={newSekolah.target} onChange={e => setNewSekolah({...newSekolah, target: e.target.value})} /></div>
                         <button onClick={handleAddSekolah} className="bg-[#0F2650] text-white py-3 rounded-xl text-[10px] font-black uppercase"><Plus size={14}/> Simpan</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {listSekolah.map(s => (
                          <div key={s.id} className="p-4 border rounded-2xl flex justify-between items-center bg-white group hover:border-indigo-100 transition-all">
                             <div><p className="text-[11px] font-black text-slate-700 uppercase leading-none">{s.nama_sekolah}</p><p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{s.jenjang} • {s.target_porsi} Porsi</p></div>
                             <button onClick={() => handleDeleteSekolah(s.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in">
                      {riwayat.map(l => (
                        <div key={l.id} className="p-4 border rounded-2xl flex justify-between items-center bg-white hover:bg-slate-50 transition-all">
                           <div><p className="text-[10px] font-black text-slate-700 uppercase italic">"{l.menu_makanan}"</p><p className="text-[8px] font-bold text-slate-400 mt-1">{l.tanggal_ops}</p></div>
                           <button onClick={() => router.push(`/sppg/dashboard/${id}/input?edit=${l.id}`)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                              <Edit3 size={14} /> Edit Data
                           </button>
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