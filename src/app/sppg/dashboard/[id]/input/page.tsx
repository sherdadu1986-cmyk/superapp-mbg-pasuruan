"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import {
  ArrowLeft, Utensils, Activity, RotateCcw, ArrowRight, CheckCircle2, Calendar, Layout, Loader2, Camera, AlertTriangle, Edit3, PartyPopper
} from 'lucide-react'
import { useToast } from '@/components/toast'

// CSS for success modal animations
const successStyles = `
@keyframes modalIn {
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes checkDraw {
  0% { stroke-dashoffset: 50; }
  100% { stroke-dashoffset: 0; }
}
@keyframes confetti {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.8); opacity: 0; }
}
.success-modal { animation: modalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.check-draw { stroke-dasharray: 50; stroke-dashoffset: 50; animation: checkDraw 0.6s 0.3s ease forwards; }
.pulse-ring { animation: pulse-ring 1.2s ease-out infinite; }
.confetti-piece { animation: confetti 2.5s ease-in forwards; }
`;

export default function InputLaporanPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [loading, setLoading] = useState(false)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  const { toast } = useToast()
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState({ title: '', sub: '' })
  const [unit, setUnit] = useState<any>(null)

  // --- FORM STATES ---
  const [tanggal, setTanggal] = useState(getLocalToday())
  const [menu, setMenu] = useState('')
  const [foto, setFoto] = useState<any>(null)
  const [existingFotoUrl, setExistingFotoUrl] = useState('')
  const [isCompressing, setIsCompressing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [compressedSize, setCompressedSize] = useState('')

  // --- DUPLICATE DETECTION STATE ---
  const [existingLaporanId, setExistingLaporanId] = useState<string | null>(editId || null)
  const [dupMessage, setDupMessage] = useState('')

  // --- EMPTY FORM DEFAULTS ---
  const emptyGizi = {
    besar: { energi: '', protein: '', lemak: '', karbo: '', serat: '' },
    kecil: { energi: '', protein: '', lemak: '', karbo: '', serat: '' }
  }

  // --- CHECK EXISTING REPORT ON DATE CHANGE (auto-fill or reset) ---
  const checkExistingReport = async (dateVal: string) => {
    if (editId) return // already in edit mode via URL
    const { data } = await supabase
      .from('laporan_harian_final')
      .select('*')
      .eq('tanggal_ops', dateVal)
      .eq('unit_id', id)
      .maybeSingle()
    if (data) {
      // AUTO-FILL: populate all fields from existing report
      setExistingLaporanId(data.id)
      setMenu(data.menu_makanan || '')
      setGizi(data.data_gizi || emptyGizi)
      setRealisasi(data.realisasi_sekolah || {})
      setExistingFotoUrl(data.foto_url || '')
      setFoto(null)
      setPreviewUrl('')
      setDupMessage('Laporan untuk tanggal ini sudah ada. Anda masuk mode edit.')
    } else {
      // RESET: clear all fields for new input
      setExistingLaporanId(null)
      setMenu('')
      setGizi(emptyGizi)
      setRealisasi({})
      setExistingFotoUrl('')
      setFoto(null)
      setPreviewUrl('')
      setDupMessage('')
    }
  }

  const handleDateChange = (val: string) => {
    setTanggal(val)
    checkExistingReport(val)
  }

  // --- FORMAT TANGGAL INDONESIA (DD/MM/YYYY) ---
  const formatTanggalID = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric' })
  }

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
      toast('error', 'Gagal Kompres Foto', 'Coba foto lain.')
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
          setTanggal(lap.tanggal_ops); setMenu(lap.menu_makanan); setGizi(lap.data_gizi); setRealisasi(lap.realisasi_sekolah); setExistingFotoUrl(lap.foto_url || '');
          setExistingLaporanId(editId)
        }
      } else {
        // Auto-check if today already has a report (for new input mode)
        checkExistingReport(getLocalToday())
      }
    }
    fetchData()
  }, [id, editId])

  const handleSimpan = async () => {
    if (!menu || !tanggal) {
      toast('warning', 'Lengkapi Data', 'Isi Menu & Tanggal terlebih dahulu!')
      return
    }

    // Determine if we're editing (either via URL editId or auto-detected existingLaporanId)
    const activeEditId = editId || existingLaporanId

    // Anti-duplikat: only for brand new reports (no editId and no existing detected)
    if (!activeEditId) {
      const { data: existing } = await supabase
        .from('laporan_harian_final')
        .select('id')
        .eq('tanggal_ops', tanggal)
        .eq('unit_id', id)
      if (existing && existing.length > 0) {
        // Don't alert — just switch to edit mode
        setExistingLaporanId(existing[0].id)
        setDupMessage('Laporan sudah ada. Klik tombol "Ubah Laporan" untuk menyesuaikan data.')
        return
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

      const { error } = activeEditId
        ? await supabase.from('laporan_harian_final').update(payload).eq('id', activeEditId)
        : await supabase.from('laporan_harian_final').insert([payload])

      if (error) throw error
      setSuccessMsg({
        title: activeEditId ? 'Data Berhasil Diperbarui!' : 'Laporan Berhasil Terkirim!',
        sub: 'Terima kasih telah memperbarui data gizi hari ini.'
      })
      setShowSuccess(true)
    } catch (err: any) { toast('error', 'Gagal Menyimpan', err.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 font-sans text-slate-800">
      <style>{successStyles}</style>

      {/* SUCCESS CELEBRATION MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          {/* CONFETTI PIECES */}
          {[...Array(12)].map((_, i) => (
            <div key={i} className="confetti-piece fixed top-0" style={{
              left: `${10 + Math.random() * 80}%`,
              width: 8 + Math.random() * 6,
              height: 8 + Math.random() * 6,
              background: ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'][i % 5],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animationDelay: `${Math.random() * 0.8}s`,
              animationDuration: `${2 + Math.random() * 1.5}s`,
            }} />
          ))}

          <div className="success-modal bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full mx-4 text-center relative">
            {/* ANIMATED CHECKMARK */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-emerald-100 rounded-full pulse-ring" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" className="check-draw" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2">{successMsg.title}</h2>
            <p className="text-sm text-slate-500 mb-8">{successMsg.sub}</p>

            <button
              onClick={() => router.push(`/sppg/dashboard/${id}`)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <PartyPopper size={18} /> Mantap!
            </button>
          </div>
        </div>
      )}

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
              {formatTanggalID(tanggal)}
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* SECTION 1: INFO UMUM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} className="text-indigo-500" /> Tanggal
                </label>
                <input type="date" className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" value={tanggal} onChange={e => handleDateChange(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Utensils size={12} className="text-indigo-500" /> Menu Utama
                </label>
                <input className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" placeholder="Nasi Kuning, Ayam Suwir..." value={menu} onChange={e => setMenu(e.target.value)} />
              </div>
            </div>

            {/* SECTION 2: NUTRISI — ULTRA COMPACT */}
            <div className="space-y-0">
              {['Besar', 'Kecil'].map((tipe, idx) => (
                <div key={tipe} className={`flex items-center gap-3 py-2.5 px-1 ${idx === 0 ? 'border-t border-slate-100' : 'border-t border-slate-100'}`}>
                  <div className={`shrink-0 text-[10px] font-black uppercase tracking-widest w-16 flex items-center gap-1.5 ${tipe === 'Besar' ? 'text-indigo-600' : 'text-amber-600'}`}>
                    <Activity size={12} /> {tipe}
                  </div>
                  <div className="flex-1 grid grid-cols-5 gap-2">
                    {['Energi', 'Protein', 'Lemak', 'Karbo', 'Serat'].map(g => (
                      <div key={g} className="relative">
                        <input type="number" placeholder={g} className="w-full h-8 px-2 pr-8 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" value={gizi[tipe.toLowerCase() as 'besar' | 'kecil'][g.toLowerCase() as keyof typeof gizi.besar] || ''} onChange={e => setGizi(prev => ({ ...prev, [tipe.toLowerCase()]: { ...prev[tipe.toLowerCase() as 'besar' | 'kecil'], [g.toLowerCase()]: e.target.value } }))} />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-300 uppercase pointer-events-none">{g === 'Energi' ? 'kkal' : 'gr'}</span>
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

            {/* INLINE DUPLICATE BANNER */}
            {dupMessage && !editId && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-800">{dupMessage}</p>
                </div>
              </div>
            )}

            {/* ACTION BUTTON — switches between Kirim / Ubah */}
            {existingLaporanId && !editId ? (
              <button
                onClick={() => router.push(`/sppg/dashboard/${id}/input?edit=${existingLaporanId}`)}
                className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-amber-600 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
              >
                <Edit3 size={18} /> Ubah Laporan Hari Ini
              </button>
            ) : (
              <button onClick={handleSimpan} disabled={loading || isCompressing} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'MENGIRIM...' : isCompressing ? 'MENUNGGU KOMPRESI...' : <>{editId ? 'Simpan Perubahan' : 'Kirim Laporan'} <ArrowRight size={18} /></>}
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}