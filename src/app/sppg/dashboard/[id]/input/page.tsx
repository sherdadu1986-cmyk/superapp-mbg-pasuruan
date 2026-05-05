"use client"
import { useState, useEffect, Suspense, Component, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import {
  ArrowLeft, Activity, RotateCcw, ArrowRight, CheckCircle2, Calendar, Layout, Loader2, Camera, AlertTriangle, PartyPopper, RefreshCcw, CheckSquare, Square
} from 'lucide-react'
import { useToast } from '@/components/toast'

// CSS for success modal animations
const successStyles = `
@keyframes modalIn {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes checkDraw {
  0% { stroke-dashoffset: 50; }
  100% { stroke-dashoffset: 0; }
}
@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.8); opacity: 0; }
}
.success-modal { animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.check-draw { stroke-dasharray: 50; stroke-dashoffset: 50; animation: checkDraw 0.6s 0.3s ease forwards; }
.pulse-ring { animation: pulse-ring 1.2s ease-out infinite; }
`;

// ============================================================
// ERROR BOUNDARY
// ============================================================
class InputErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; errorMsg: string }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, errorMsg: '' }
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, errorMsg: error?.message || 'Unknown error' } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-10 max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto text-amber-500">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Ada Masalah Teknis</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gagal memuat form. Silakan muat ulang halaman.</p>
            <button onClick={() => window.location.reload()} className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold transition-all hover:opacity-90">Muat Ulang</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================
// LOADING SPINNER
// ============================================================
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 size={40} className="text-indigo-500 animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Menyiapkan Laporan...</p>
      </div>
    </div>
  )
}

// ============================================================
// MAIN FORM COMPONENT
// ============================================================
function InputLaporanForm() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams?.get('edit') ?? null
  const { toast } = useToast()

  // --- STATES ---
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [unit, setUnit] = useState<any>(null)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  
  const [tanggal, setTanggal] = useState(getLocalToday())
  const [statusOperasional, setStatusOperasional] = useState(true)
  const [catatan, setCatatan] = useState('')
  const [realisasi, setRealisasi] = useState<Record<string, string>>({})
  const [foto, setFoto] = useState<any>(null)
  const [existingFotoUrl, setExistingFotoUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [isCompressing, setIsCompressing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [existingLaporanId, setExistingLaporanId] = useState<string | null>(editId || null)

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setPageLoading(true)
      try {
        const { data: u } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
        const { data: s } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', id).order('nama_sekolah')
        if (u) setUnit(u)
        if (s) setListSekolah(s)

        if (editId) {
          const { data: lap } = await supabase.from('laporan_harian_final').select('*').eq('id', editId).single()
          if (lap) {
            setTanggal(lap?.tanggal_ops ?? getLocalToday())
            setRealisasi(lap?.realisasi_sekolah ?? {})
            setExistingFotoUrl(lap?.foto_url ?? '')
            setExistingLaporanId(editId)
            setStatusOperasional(lap?.is_operasional ?? true)
            setCatatan(lap?.catatan_tidak_operasional ?? '')
          }
        } else {
          await checkExisting(getLocalToday())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [id, editId])

  const checkExisting = async (dateVal: string) => {
    if (editId) return
    const { data } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', dateVal).eq('unit_id', id).maybeSingle()
    if (data) {
      setExistingLaporanId(data.id)
      setRealisasi(data.realisasi_sekolah ?? {})
      setExistingFotoUrl(data.foto_url ?? '')
      setStatusOperasional(data.is_operasional ?? true)
      setCatatan(data.catatan_tidak_operasional ?? '')
    } else {
      setExistingLaporanId(null)
      setRealisasi({})
      setExistingFotoUrl('')
      setStatusOperasional(true)
      setCatatan('')
    }
  }

  // --- ACTIONS ---
  const handleSelectAll = () => {
    const newRealisasi: Record<string, string> = {}
    listSekolah.forEach(s => {
      newRealisasi[s.id] = String(s.target_porsi ?? 0)
    })
    setRealisasi(newRealisasi)
    toast('success', 'Berhasil', 'Seluruh realisasi diisi sesuai target.')
  }

  const handleDeselectAll = () => {
    const newRealisasi: Record<string, string> = {}
    listSekolah.forEach(s => {
      newRealisasi[s.id] = '0'
    })
    setRealisasi(newRealisasi)
    toast('warning', 'Dikosongkan', 'Seluruh realisasi telah dikosongkan.')
  }

  const handleToggleSekolah = (s: any) => {
    const currentVal = Number(realisasi[s.id] || 0)
    setRealisasi(prev => ({
      ...prev,
      [s.id]: currentVal === 0 ? String(s.target_porsi) : '0'
    }))
  }

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return
    setIsCompressing(true)
    try {
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1024, useWebWorker: true, fileType: 'image/jpeg' as const }
      const compressed = await imageCompression(file, options)
      setFoto(compressed)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(compressed))
    } catch (err) {
      toast('error', 'Gagal', 'Gagal memproses gambar.')
    } finally {
      setIsCompressing(false)
    }
  }

  const handleSimpan = async () => {
    if (!tanggal) {
      toast('warning', 'Peringatan', 'Pilih tanggal terlebih dahulu.')
      return
    }

    // Anti-Future Date Validation
    const today = getLocalToday()
    if (tanggal > today) {
      toast('error', 'Gagal', 'Tidak bisa membuat laporan untuk tanggal masa depan.')
      return
    }

    // Anti-Duplicate Logic
    if (!editId) {
      const { data: exist } = await supabase.from('laporan_harian_final').select('id').eq('tanggal_ops', tanggal).eq('unit_id', id).maybeSingle()
      if (exist && exist.id !== existingLaporanId) {
        toast('error', 'Sudah Ada', 'Laporan untuk tanggal ini sudah ada! Gunakan mode edit jika ingin mengubah.')
        return
      }
    }

    // Validation for Operational status
    if (statusOperasional) {
      const totalRealisasi = Object.values(realisasi).reduce((acc, curr) => acc + Number(curr || 0), 0)
      if (totalRealisasi <= 0) {
        toast('error', 'Gagal', 'Data realisasi tidak boleh kosong untuk status operasional.')
        return
      }
    } else if (!catatan.trim()) {
      toast('warning', 'Lengkapi', 'Berikan alasan/catatan kenapa unit tidak operasional.')
      return
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

      const activeId = editId || existingLaporanId
      const payload = {
        unit_id: id,
        nama_unit: unit?.nama_unit ?? '',
        tanggal_ops: tanggal,
        is_operasional: statusOperasional, // Map to boolean column
        catatan_tidak_operasional: statusOperasional ? null : catatan,
        menu_makanan: statusOperasional ? 'Menu Terjadwal' : '-', 
        data_gizi: {}, 
        realisasi_sekolah: statusOperasional ? realisasi : {},
        foto_url: finalFotoUrl
      }

      const { error } = activeId 
        ? await supabase.from('laporan_harian_final').update(payload).eq('id', activeId)
        : await supabase.from('laporan_harian_final').insert([payload])

      if (error) throw error
      setShowSuccess(true)
    } catch (err: any) {
      toast('error', 'Gagal Simpan', err.message)
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 pb-24">
      <style>{successStyles}</style>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
          <div className="success-modal bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-12 max-w-sm w-full mx-4 text-center border border-slate-100 dark:border-slate-800">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-500/20 rounded-full pulse-ring" />
              <div className="relative w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" className="check-draw" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Laporan Disimpan!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Data harian telah berhasil tercatat di sistem.</p>
            <button onClick={() => router.push(`/sppg/dashboard/${id}`)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg hover:scale-105 transition-all">Selesai</button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
            <ArrowLeft size={24} />
          </button>
          <div className="text-right">
            <h1 className="text-xl font-bold tracking-tight">Input Laporan</h1>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{unit?.nama_unit}</p>
          </div>
        </div>

        {/* STATUS TOGGLE & DATE PICKER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* STATUS TOGGLE */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Status Operasional</label>
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
               <div 
                 className={`absolute inset-y-1 w-[calc(50%-4px)] bg-slate-900 dark:bg-indigo-600 rounded-xl transition-all duration-300 ease-out ${statusOperasional ? 'left-1' : 'left-[calc(50%+4px)] bg-rose-600 dark:bg-rose-600'}`}
               />
               <button 
                 onClick={() => setStatusOperasional(true)}
                 className={`flex-1 py-2 text-xs font-bold relative z-10 transition-colors ${statusOperasional ? 'text-white' : 'text-slate-400'}`}
               >
                 Operasional
               </button>
               <button 
                 onClick={() => setStatusOperasional(false)}
                 className={`flex-1 py-2 text-[10px] font-bold relative z-10 transition-colors ${!statusOperasional ? 'text-white' : 'text-slate-400'}`}
               >
                 Tidak Beroperasional
               </button>
            </div>
          </div>

          {/* DATE PICKER */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-indigo-500">
              <Calendar size={24} />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tanggal</label>
              <input 
                type="date" 
                max={getLocalToday()}
                className="bg-transparent text-lg font-bold outline-none w-full cursor-pointer" 
                value={tanggal} 
                onChange={e => { setTanggal(e.target.value); checkExisting(e.target.value); }} 
              />
            </div>
          </div>
        </div>

        {statusOperasional ? (
          /* OPERATIONAL CONTENT */
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* SCHOOLS SECTION */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Layout size={16} /> Realisasi Sekolah
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSelectAll}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
                  >
                    <CheckSquare size={14} /> Pilih Semua
                  </button>
                  <button 
                    onClick={handleDeselectAll}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
                  >
                    <RotateCcw size={14} /> Batal Semua
                  </button>
                </div>
              </div>

              <div className="grid gap-3">
                {listSekolah.map(s => {
                  const val = realisasi[s.id] || ''
                  const isFilled = Number(val || 0) > 0
                  return (
                    <div key={s.id} className={`group bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all shadow-sm hover:shadow-md flex items-center gap-4 ${isFilled ? 'border-indigo-200 dark:border-indigo-500/30' : 'border-slate-100 dark:border-slate-800'}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate transition-colors ${isFilled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'}`}>{s.nama_sekolah}</p>
                        <p className="text-[10px] font-medium text-slate-400">Target: {s.target_porsi} porsi</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          placeholder="0"
                          className={`w-20 py-2 px-3 rounded-xl text-center text-sm font-bold outline-none border transition-all ${isFilled ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800 border-transparent focus:border-indigo-500/50'}`}
                          value={val}
                          onChange={e => setRealisasi(prev => ({ ...prev, [s.id]: e.target.value }))}
                        />
                        <button 
                          onClick={() => handleToggleSekolah(s)}
                          className={`p-2 transition-all rounded-lg ${isFilled ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-300 hover:text-indigo-500'}`}
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* PHOTO SECTION */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 px-2">
                <Camera size={16} /> Dokumentasi
              </h2>
              <div 
                className="relative h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all cursor-pointer group shadow-inner"
              >
                {previewUrl || (editId && existingFotoUrl) ? (
                  <img src={previewUrl || existingFotoUrl} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="Preview" />
                ) : null}
                
                <div className="relative z-10 flex flex-col items-center gap-3">
                  {isCompressing ? (
                    <Loader2 size={36} className="text-amber-500 animate-spin" />
                  ) : (
                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg text-slate-300 group-hover:text-indigo-500 group-hover:scale-110 transition-all">
                      <Camera size={28} />
                    </div>
                  )}
                  <div className="text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      {isCompressing ? 'Mengompres...' : foto || existingFotoUrl ? 'Ganti Dokumentasi' : 'Pilih Foto Operasional'}
                    </span>
                    <p className="text-[9px] text-slate-300 font-medium mt-1">Maksimal 300KB • JPEG/PNG</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                  onChange={e => handleFileSelect(e.target.files?.[0])}
                  disabled={isCompressing}
                />
              </div>
            </div>
          </div>
        ) : (
          /* NON-OPERATIONAL CONTENT */
          <div className="animate-in slide-in-from-bottom duration-500">
            <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-4 text-rose-500">
                <AlertTriangle size={32} />
                <div>
                  <h3 className="font-bold">Unit Tidak Operasional</h3>
                  <p className="text-xs text-rose-600/70 font-medium">Laporan akan tercatat sebagai hari libur/kendala.</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest px-1">Alasan / Catatan</label>
                <textarea 
                  className="w-full bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500 transition-all min-h-[120px]"
                  placeholder="Contoh: Libur Nasional, Perbaikan Dapur, Kendala Pengiriman, dll..."
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON - STICKY AT BOTTOM MOBILE */}
        <div className="fixed bottom-0 left-0 right-0 p-6 md:static md:p-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md md:bg-transparent">
          <button 
            onClick={handleSimpan}
            disabled={loading || isCompressing}
            className="w-full max-w-2xl mx-auto py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Mengirim...</>
            ) : (
              <>{editId ? 'Perbarui Laporan' : 'Kirim Laporan'} <ArrowRight size={20} /></>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}

// ============================================================
// EXPORTED PAGE
// ============================================================
export default function InputLaporanPage() {
  return (
    <InputErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <InputLaporanForm />
      </Suspense>
    </InputErrorBoundary>
  )
}