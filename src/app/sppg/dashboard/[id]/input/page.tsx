"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, X, Utensils, Activity, RotateCcw, ArrowRight, CheckCircle2, Calendar, Layout 
} from 'lucide-react'

export default function InputLaporanPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [loading, setLoading] = useState(false)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  const [unit, setUnit] = useState<any>(null)

  // --- FORM STATES ---
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [menu, setMenu] = useState('')
  const [foto, setFoto] = useState<any>(null)
  const [existingFotoUrl, setExistingFotoUrl] = useState('')
  const [realisasi, setRealisasi] = useState<Record<string, string>>({})
  const [gizi, setGizi] = useState({
    besar: { energi: '', protein: '', lemak: '', karbo: '', serat: '' },
    kecil: { energi: '', protein: '', lemak: '', karbo: '', serat: '' }
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data: u } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
      const { data: s } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', id).order('nama_sekolah')
      if (u) setUnit(u)
      if (s) setListSekolah(s)

      if (editId) {
        const { data: lap } = await supabase.from('laporan_harian_final').select('*').eq('id', editId).single()
        if (lap) {
          const today = new Date().toISOString().split('T')[0];
          if (lap.tanggal_ops !== today) { alert("⚠️ Laporan lama terkunci!"); router.back(); return; }
          setTanggal(lap.tanggal_ops); setMenu(lap.menu_makanan); setGizi(lap.data_gizi); setRealisasi(lap.realisasi_sekolah); setExistingFotoUrl(lap.foto_url || '');
        }
      }
    }
    fetchData()
  }, [id, editId])

  const handleSimpan = async () => {
    if(!menu || !tanggal) return alert("⚠️ Isi Menu & Tanggal!")
    setLoading(true)
    try {
      let finalFotoUrl = existingFotoUrl
      if (foto) {
        const fileName = `${Date.now()}_${id}.jpg`
        const filePath = `dokumentasi_harian/${fileName}`
        await supabase.storage.from('dokumentasi').upload(filePath, foto)
        finalFotoUrl = supabase.storage.from('dokumentasi').getPublicUrl(filePath).data.publicUrl
      }

      const cleanRealisasi = Object.fromEntries(Object.entries(realisasi).filter(([_, v]) => v !== ""));
      const payload = { 
        unit_id: id, nama_unit: unit.nama_unit, tanggal_ops: tanggal, 
        menu_makanan: menu, data_gizi: gizi, realisasi_sekolah: cleanRealisasi, foto_url: finalFotoUrl 
      }

      const { error } = editId 
        ? await supabase.from('laporan_harian_final').update(payload).eq('id', editId)
        : await supabase.from('laporan_harian_final').insert([payload])

      if (error) throw error
      alert("✅ LAPORAN BERHASIL!"); router.push(`/sppg/dashboard/${id}`);
    } catch (err: any) { alert(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-4 lg:p-12 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#6366F1] hover:translate-x-[-4px] transition-all">
          <ArrowLeft size={18}/> Kembali ke Beranda
        </button>
        
        <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-indigo-900/10 overflow-hidden border border-white">
           {/* HEADER AREA */}
           <div className="bg-[#0F2650] p-10 text-white flex justify-between items-center relative overflow-hidden">
             <div className="relative z-10">
               <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                {editId ? 'Perbarui Data' : 'Input Laporan Baru'}
               </h2>
               <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.4em] mt-3 opacity-80">
                Unit: {unit?.nama_unit}
               </p>
             </div>
             <X className="cursor-pointer text-white/40 hover:text-white transition-all relative z-10" onClick={() => router.back()} size={28} />
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           </div>

           <div className="p-8 lg:p-14 space-y-14">
              {/* BAGIAN 1: INFO UMUM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2 ml-2">
                    <Calendar size={14} className="text-indigo-500"/> Tanggal Distribusi
                  </label>
                  <input type="date" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-black outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50" value={tanggal} disabled={!!editId} onChange={e => setTanggal(e.target.value)} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2 ml-2">
                    <Utensils size={14} className="text-indigo-500"/> Menu Utama Hari Ini
                  </label>
                  <input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-black outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner" placeholder="Contoh: Nasi Kuning, Ayam Suwir..." value={menu} onChange={e => setMenu(e.target.value)} />
                </div>
              </div>

              {/* BAGIAN 2: NUTRISI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {['Besar', 'Kecil'].map(tipe => (
                  <div key={tipe} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-sm relative group overflow-hidden">
                    <div className={`absolute top-0 left-0 w-2 h-full ${tipe === 'Besar' ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
                    <h4 className="text-[10px] font-black text-[#0F2650] uppercase mb-8 border-b border-slate-50 pb-4 flex items-center gap-3 tracking-widest italic">
                      <Activity size={18} className={tipe === 'Besar' ? 'text-indigo-500' : 'text-amber-500'}/> Komposisi Gizi {tipe}
                    </h4>
                    <div className="space-y-5">
                      {['Energi', 'Protein', 'Lemak', 'Karbo', 'Serat'].map(g => (
                        <div key={g} className="flex justify-between items-center group/item">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider group-hover/item:text-slate-600 transition-colors">{g}</span>
                          <div className="flex items-center gap-3">
                            <input type="number" className="w-24 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs font-black outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm" value={gizi[tipe.toLowerCase() as 'besar'|'kecil'][g.toLowerCase() as keyof typeof gizi.besar] || ''} onChange={e => setGizi(prev => ({...prev, [tipe.toLowerCase()]: {...prev[tipe.toLowerCase() as 'besar'|'kecil'], [g.toLowerCase()]: e.target.value}}))} />
                            <span className="text-[9px] font-black text-slate-300 uppercase">{g === 'Energi' ? 'kkal' : 'gr'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* BAGIAN 3: REALISASI */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic ml-2 flex items-center gap-3">
                  <Layout size={16} className="text-indigo-500"/> Realisasi per Sekolah
                </h4>
                <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100 max-h-[500px] overflow-y-auto space-y-4 shadow-inner custom-scrollbar">
                  {listSekolah.map(s => (
                    <div key={s.id} className="p-5 bg-white border border-slate-100 rounded-[1.5rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group">
                      <div className="flex-1 w-full text-center md:text-left">
                        <p className="text-xs font-black text-slate-700 uppercase tracking-tighter leading-none mb-2 group-hover:text-indigo-600 transition-colors">{s.nama_sekolah}</p>
                        <span className="text-[9px] font-bold text-white bg-slate-300 px-3 py-1 rounded-full uppercase tracking-widest">Target: {s.target_porsi}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setRealisasi(prev => ({...prev, [s.id]: s.target_porsi.toString()}))} className="px-5 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">{s.target_porsi}</button>
                        <button onClick={() => setRealisasi(prev => ({...prev, [s.id]: '0'}))} className="p-3.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Reset ke 0"><RotateCcw size={18}/></button>
                        <div className="relative flex items-center gap-2 ml-2">
                          <input type="number" className="w-28 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-sm font-black outline-none focus:border-indigo-500 transition-all shadow-sm" value={realisasi[s.id] || ''} onChange={e => setRealisasi(prev => ({...prev, [s.id]: e.target.value}))} placeholder="0" />
                          <span className="text-[10px] font-black text-slate-300 uppercase italic">Pack</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BAGIAN 4: DOKUMENTASI */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic ml-2">Bukti Operasional</h4>
                <div className="border-4 border-dashed border-indigo-50 rounded-[3rem] p-16 flex flex-col items-center justify-center text-slate-400 relative group cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition-all shadow-inner">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                    <Activity size={40} className="text-indigo-200 group-hover:text-indigo-500" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#0F2650] mb-2">{editId ? 'Ganti Foto Dokumentasi' : 'Pilih Foto Laporan'}</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Klik di sini untuk mengunggah file</p>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFoto(e.target.files?.[0])} />
                  
                  {foto ? (
                    <div className="mt-8 px-6 py-3 bg-emerald-500 text-white rounded-[1.5rem] text-[10px] font-black flex items-center gap-3 animate-in zoom-in shadow-xl shadow-emerald-500/20 uppercase">
                      <CheckCircle2 size={16}/> {foto.name}
                    </div>
                  ) : editId && existingFotoUrl && (
                    <div className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black flex items-center gap-3 uppercase shadow-xl shadow-indigo-600/20">
                      <CheckCircle2 size={16}/> Dokumentasi Sudah Ada
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button onClick={handleSimpan} disabled={loading} className="w-full py-8 bg-[#0F2650] text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.5em] shadow-2xl shadow-indigo-900/30 hover:bg-[#6366F1] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                {loading ? 'SINKRONISASI DATA...' : <>{editId ? 'Simpan Perubahan Laporan' : 'Kirim Laporan Final'} <ArrowRight size={22} /></>}
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}