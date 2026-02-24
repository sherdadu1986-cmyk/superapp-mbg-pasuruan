"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import {
  ArrowLeft, Utensils, Activity, RotateCcw, ArrowRight, CheckCircle2, Calendar, Layout, Loader2, Camera
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
  const [tanggal, setTanggal] = useState(getLocalToday())
  const [menu, setMenu] = useState('')
  const [foto, setFoto] = useState<any>(null)
  const [existingFotoUrl, setExistingFotoUrl] = useState('')
  const [isCompressing, setIsCompressing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [compressedSize, setCompressedSize] = useState('')

  // --- AUTO COMPRESS HANDLER ---
  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return
    setIsCompressing(true)
    try {
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/jpeg' as const,
      }
      const compressed = await imageCompression(file, options)
      const jpegFile = new File([compressed], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
      setFoto(jpegFile)
      setCompressedSize((jpegFile.size / 1024).toFixed(0))
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(jpegFile))
    } catch (err) {
      console.error('Compression failed:', err)
      alert('⚠️ Gagal mengompres foto. Coba foto lain.')
    } finally {
      setIsCompressing(false)
    }
  }
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
          const today = getLocalToday();
          if (lap.tanggal_ops !== today) { alert("⚠️ Laporan lama terkunci!"); router.back(); return; }
          setTanggal(lap.tanggal_ops); setMenu(lap.menu_makanan); setGizi(lap.data_gizi); setRealisasi(lap.realisasi_sekolah); setExistingFotoUrl(lap.foto_url || '');
        }
      }
    }
    fetchData()
  }, [id, editId])

  const handleSimpan = async () => {
    if (!menu || !tanggal) return alert("⚠️ Isi Menu & Tanggal!")

    // Anti-duplikat: cek apakah laporan hari ini sudah ada (hanya untuk input baru, bukan edit)
    if (!editId) {
      const { data: existing } = await supabase
        .from('laporan_harian_final')
        .select('id')
        .eq('tanggal_ops', tanggal)
        .eq('unit_id', id)
      if (existing && existing.length > 0) {
        return alert("⚠️ Maaf, laporan untuk hari ini sudah terkirim. Jika ada kesalahan, silakan gunakan fitur Ubah/Edit di menu riwayat laporan.")
      }
    }

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
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* BACK BUTTON */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:translate-x-[-4px] transition-all">
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </button>

        {/* MAIN CONTAINER */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* COMPACT HEADER */}
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                {editId ? 'Perbarui Data' : 'Input Laporan Baru'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Unit: {unit?.nama_unit}
              </p>
            </div>
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              {tanggal}
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* SECTION 1: INFO UMUM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} className="text-indigo-500" /> Tanggal
                </label>
                <input type="date" className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50" value={tanggal} disabled={!!editId} onChange={e => setTanggal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Utensils size={12} className="text-indigo-500" /> Menu Utama
                </label>
                <input className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" placeholder="Nasi Kuning, Ayam Suwir..." value={menu} onChange={e => setMenu(e.target.value)} />
              </div>
            </div>

            {/* SECTION 2: NUTRISI — COMPACT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Besar', 'Kecil'].map(tipe => (
                <div key={tipe} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                  <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${tipe === 'Besar' ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
                  <h4 className="text-[10px] font-black text-slate-600 uppercase mb-3 pb-2 border-b border-slate-200 flex items-center gap-2 tracking-widest">
                    <Activity size={14} className={tipe === 'Besar' ? 'text-indigo-500' : 'text-amber-500'} /> Gizi {tipe}
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {['Energi', 'Protein', 'Lemak', 'Karbo', 'Serat'].map(g => (
                      <div key={g} className="text-center">
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">{g}</label>
                        <input type="number" className="w-full py-1.5 px-1 bg-white border border-slate-200 rounded-lg text-center text-xs font-bold outline-none focus:border-indigo-500 transition-all" value={gizi[tipe.toLowerCase() as 'besar' | 'kecil'][g.toLowerCase() as keyof typeof gizi.besar] || ''} onChange={e => setGizi(prev => ({ ...prev, [tipe.toLowerCase()]: { ...prev[tipe.toLowerCase() as 'besar' | 'kecil'], [g.toLowerCase()]: e.target.value } }))} />
                        <span className="text-[7px] font-bold text-slate-300 uppercase mt-0.5 block">{g === 'Energi' ? 'kkal' : 'gr'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* SECTION 3: REALISASI */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layout size={14} className="text-indigo-500" /> Realisasi per Sekolah
              </h4>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-[400px] overflow-y-auto space-y-2">
                {listSekolah.map(s => (
                  <div key={s.id} className="py-2 px-3 bg-white border border-slate-200 rounded-lg flex flex-col md:flex-row justify-between items-center gap-3 hover:border-indigo-200 transition-all group">
                    <div className="flex-1 w-full text-center md:text-left">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-tighter leading-none group-hover:text-indigo-600 transition-colors">{s.nama_sekolah}</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target: {s.target_porsi}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setRealisasi(prev => ({ ...prev, [s.id]: s.target_porsi.toString() }))} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all">{s.target_porsi}</button>
                      <button onClick={() => setRealisasi(prev => ({ ...prev, [s.id]: '0' }))} className="p-1.5 bg-rose-50 text-rose-500 border border-rose-200 rounded-lg hover:bg-rose-500 hover:text-white transition-all" title="Reset"><RotateCcw size={14} /></button>
                      <div className="flex items-center gap-1">
                        <input type="number" className="w-20 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs font-bold outline-none focus:border-indigo-500 transition-all" value={realisasi[s.id] || ''} onChange={e => setRealisasi(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="0" />
                        <span className="text-[9px] font-bold text-slate-300">Pack</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 4: DOKUMENTASI — COMPACT */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Camera size={14} className="text-indigo-500" /> Bukti Operasional
              </h4>
              <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 relative group cursor-pointer transition-all ${isCompressing ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20'}`}>
                {previewUrl ? (
                  <div className="w-24 h-24 rounded-xl overflow-hidden mb-3 shadow-md border border-white">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Camera size={24} className="text-slate-300 group-hover:text-indigo-500" />
                  </div>
                )}
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-1">{editId ? 'Ganti Foto' : 'Pilih Foto'}</span>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Auto-Compress • Maks 300KB JPEG</p>
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" disabled={isCompressing} onChange={e => handleFileSelect(e.target.files?.[0])} />

                {isCompressing && (
                  <div className="mt-3 px-4 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-2 animate-pulse uppercase">
                    <Loader2 size={14} className="animate-spin" /> Mengompres...
                  </div>
                )}
                {!isCompressing && foto && (
                  <div className="mt-3 flex flex-col items-center gap-1">
                    <div className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-2 uppercase">
                      <CheckCircle2 size={14} /> {foto.name}
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 uppercase">{compressedSize} KB</span>
                  </div>
                )}
                {!isCompressing && !foto && editId && existingFotoUrl && (
                  <div className="mt-3 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-2 uppercase">
                    <CheckCircle2 size={14} /> Foto Sudah Ada
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button onClick={handleSimpan} disabled={loading || isCompressing} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'MENGIRIM...' : isCompressing ? 'MENUNGGU KOMPRESI...' : <>{editId ? 'Simpan Perubahan' : 'Kirim Laporan'} <ArrowRight size={18} /></>}
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}