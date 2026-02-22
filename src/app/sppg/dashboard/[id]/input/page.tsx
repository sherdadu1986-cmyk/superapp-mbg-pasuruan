"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, X, Utensils, Activity, RotateCcw, ArrowRight, CheckCircle2 
} from 'lucide-react'

export default function InputLaporanPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [loading, setLoading] = useState(false)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  const [unit, setUnit] = useState<any>(null)

  // --- FORM STATES (POIN-POIN UTAMA) ---
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
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#0F2650]"><ArrowLeft size={18}/> Kembali</button>
        
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
           <div className="bg-[#0F2650] p-8 text-white flex justify-between items-center">
             <div><h2 className="text-xl font-black uppercase italic tracking-widest leading-none">{editId ? 'Edit Laporan' : 'Input Laporan'}</h2><p className="text-[10px] text-blue-300 font-bold uppercase mt-2">{unit?.nama_unit}</p></div>
             <X className="cursor-pointer opacity-50 hover:opacity-100" onClick={() => router.back()} />
           </div>

           <div className="p-8 lg:p-12 space-y-12">
              {/* BAGIAN 1: INFO UMUM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tgl Distribusi</label><input type="date" className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 disabled:opacity-50" value={tanggal} disabled={!!editId} onChange={e => setTanggal(e.target.value)} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Menu Utama</label><input className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" placeholder="Nasi, Ayam..." value={menu} onChange={e => setMenu(e.target.value)} /></div>
              </div>

              {/* BAGIAN 2: GIZI (POINT TETAP ADA) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['Besar', 'Kecil'].map(tipe => (
                  <div key={tipe} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-[#0F2650] uppercase mb-4 border-b pb-3 flex items-center gap-2"><Activity size={16} className="text-blue-500"/> Nutrisi {tipe}</h4>
                    <div className="space-y-4">
                      {['Energi', 'Protein', 'Lemak', 'Karbo', 'Serat'].map(g => (
                        <div key={g} className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                          {g}
                          <input type="number" className="w-20 p-2 bg-white border rounded-xl text-center font-black outline-none focus:border-blue-500" value={gizi[tipe.toLowerCase() as 'besar'|'kecil'][g.toLowerCase() as keyof typeof gizi.besar] || ''} onChange={e => setGizi(prev => ({...prev, [tipe.toLowerCase()]: {...prev[tipe.toLowerCase() as 'besar'|'kecil'], [g.toLowerCase()]: e.target.value}}))} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* BAGIAN 3: REALISASI (POINT SHORTCUT & RESET TETAP ADA) */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-[#0F2650] uppercase tracking-widest italic ml-1">Realisasi per Sekolah</h4>
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border max-h-96 overflow-y-auto space-y-3 shadow-inner">
                  {listSekolah.map(s => (
                    <div key={s.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm hover:border-indigo-200 transition-all">
                      <div className="flex-1 w-full"><p className="text-[11px] font-black text-slate-700 uppercase leading-none mb-1">{s.nama_sekolah}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">TARGET: {s.target_porsi} PACK</p></div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setRealisasi(prev => ({...prev, [s.id]: s.target_porsi.toString()}))} className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-indigo-600 hover:text-white transition-all">{s.target_porsi}</button>
                        <button onClick={() => setRealisasi(prev => ({...prev, [s.id]: '0'}))} className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><RotateCcw size={14}/></button>
                        <div className="relative flex items-center">
                          <input type="number" className="w-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-black outline-none focus:border-indigo-500" value={realisasi[s.id] || ''} onChange={e => setRealisasi(prev => ({...prev, [s.id]: e.target.value}))} />
                          <span className="ml-2 text-[9px] font-black text-slate-400 uppercase">Pack</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BAGIAN 4: DOKUMENTASI (POINT UPLOAD TETAP ADA) */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-[#0F2650] uppercase tracking-widest italic ml-1">Dokumentasi Distribusi</h4>
                <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-slate-400 relative group cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all">
                  <Utensils size={32} className="mb-3 opacity-20 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{editId ? 'Ganti Foto Dokumentasi' : 'Upload Foto Laporan'}</span>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFoto(e.target.files?.[0])} />
                  {foto ? (
                    <div className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-full text-[9px] font-black flex items-center gap-2 animate-bounce uppercase"><CheckCircle2 size={12}/> {foto.name}</div>
                  ) : editId && existingFotoUrl && (
                    <div className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-full text-[9px] font-black flex items-center gap-2 uppercase"><CheckCircle2 size={12}/> Dokumentasi Tersimpan</div>
                  )}
                </div>
              </div>

              <button onClick={handleSimpan} disabled={loading} className="w-full py-6 bg-[#0F2650] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                {loading ? 'MEMPROSES...' : <>{editId ? 'Simpan Perubahan' : 'Kirim Laporan Final'} <ArrowRight size={18} /></>}
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}