"use client"
import { useState, useEffect, Suspense, Component, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import {
  ArrowLeft, Activity, RotateCcw, ArrowRight, CheckCircle2, Calendar, Layout, Loader2, Camera, AlertTriangle, PartyPopper, RefreshCcw, CheckSquare, Square, X
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

/* FORCE LIGHT MODE GLOBAL FOR THIS PAGE */
:root {
  color-scheme: light !important;
}
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
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6 text-slate-900">
          <div className="bg-white rounded-3xl shadow-xl border border-[#E5E7EB] p-10 max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Ada Masalah Teknis</h2>
            <p className="text-sm text-slate-500">Gagal memuat form. Silakan muat ulang halaman.</p>
            <button onClick={() => window.location.reload()} className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold transition-all hover:opacity-90">Muat Ulang</button>
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
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 size={40} className="text-indigo-500 animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500">Menyiapkan Laporan...</p>
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
  
  const calculatedTotal = Object.values(realisasi).reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);

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
      // ULTRA-COMPRESS TARGET 100KB (0.1 MB)
      const options = { 
        maxSizeMB: 0.1, 
        maxWidthOrHeight: 1080, 
        useWebWorker: true, 
        fileType: 'image/webp' as const 
      }
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
        const fileName = `${Date.now()}_${id}.webp`
        const filePath = `dokumentasi_harian/${fileName}`
        await supabase.storage.from('dokumentasi').upload(filePath, foto)
        finalFotoUrl = supabase.storage.from('dokumentasi').getPublicUrl(filePath).data.publicUrl
      }

      const activeId = editId || existingLaporanId
      const payload = {
        unit_id: id,
        nama_unit: unit?.nama_unit ?? '',
        tanggal_ops: tanggal,
        is_operasional: statusOperasional,
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-32">
      <style>{successStyles}</style>

      {/* FLOATING TOTAL CARD */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-3rem)] max-w-lg">
        <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 shadow-2xl shadow-slate-900/20 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Porsi</p>
              <p className="text-xl font-black text-white leading-tight">{calculatedTotal.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Status</p>
            <p className="text-xs font-bold text-emerald-50">{statusOperasional ? 'Operasional' : 'Libur'}</p>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
          <div className="success-modal bg-white rounded-[3rem] shadow-2xl p-10 max-w-sm w-full text-center border border-slate-100">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-emerald-100 rounded-full pulse-ring" />
              <div className="relative w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" className="check-draw" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Laporan Terkirim!</h2>
            <p className="text-slate-500 text-sm mb-8">Data porsi telah berhasil diperbarui dan disimpan ke server.</p>
            <button 
              onClick={() => router.push(`/sppg/dashboard/${id}`)} 
              className="w-full py-4 bg-[#0F172A] text-white rounded-[1.5rem] font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/20"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 pt-28 space-y-10">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="w-12 h-12 bg-white border border-slate-100 flex items-center justify-center rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Input Laporan</h1>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-[0.2em]">{unit?.nama_unit}</p>
          </div>
        </div>

        {/* CONTROLS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* STATUS TOGGLE */}
          <div className="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center">
            <button 
              onClick={() => setStatusOperasional(true)}
              className={`flex-1 py-4 px-6 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${statusOperasional ? 'bg-[#0F172A] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Operasional
            </button>
            <button 
              onClick={() => setStatusOperasional(false)}
              className={`flex-1 py-4 px-6 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${!statusOperasional ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Libur / Kendala
            </button>
          </div>

          {/* DATE PICKER */}
          <div className="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center pr-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-600 ml-2">
              <Calendar size={20} />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Laporan</p>
              <input 
                type="date" 
                max={getLocalToday()}
                className="bg-transparent text-sm font-black outline-none w-full cursor-pointer text-[#0F172A]" 
                value={tanggal} 
                onChange={e => { setTanggal(e.target.value); checkExisting(e.target.value); }} 
              />
            </div>
          </div>
        </div>

        {statusOperasional ? (
          /* OPERATIONAL CONTENT */
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* SCHOOLS SECTION */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                  <span className="w-8 h-[2px] bg-emerald-500 rounded-full" /> 
                  Daftar Realisasi Sekolah
                </h2>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-[10px] font-black text-emerald-700 bg-emerald-100/50 px-5 py-2.5 rounded-full transition-all hover:bg-emerald-100 active:scale-95 border border-emerald-200/50"
                  >
                    <CheckSquare size={14} /> Pilih Semua
                  </button>
                  <button 
                    onClick={handleDeselectAll}
                    className="flex items-center gap-2 text-[10px] font-black text-rose-700 bg-rose-100/50 px-5 py-2.5 rounded-full transition-all hover:bg-rose-100 active:scale-95 border border-rose-200/50"
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listSekolah.map(s => {
                  const val = realisasi[s.id] || ''
                  const isFilled = (parseInt(val) || 0) > 0
                  return (
                    <div key={s.id} className={`group bg-white p-6 rounded-[2.2rem] border-2 transition-all duration-300 flex items-center gap-5 ${isFilled ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border-transparent shadow-lg shadow-slate-200/30 hover:border-slate-200'}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-sm md:text-base truncate transition-colors mb-1 ${isFilled ? 'text-emerald-600' : 'text-[#0F172A]'}`}>{s.nama_sekolah}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-bold text-slate-500 uppercase tracking-wider">Target</span>
                          <p className="text-xs font-bold text-slate-400">{s.target_porsi} Porsi</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input 
                            type="number" 
                            placeholder="0"
                            className={`w-24 py-3 px-4 rounded-[1.2rem] text-center text-base font-black outline-none transition-all border-2 ${isFilled ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-transparent focus:border-emerald-500/30 text-slate-600'}`}
                            value={val}
                            onChange={e => setRealisasi(prev => ({ ...prev, [s.id]: e.target.value }))}
                          />
                          {isFilled && <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white text-white"><CheckCircle2 size={10} /></div>}
                        </div>
                        <button 
                          onClick={() => handleToggleSekolah(s)}
                          className={`w-10 h-10 flex items-center justify-center transition-all rounded-xl ${isFilled ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:bg-slate-50 hover:text-emerald-500'}`}
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
            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3 px-2">
                <span className="w-8 h-[2px] bg-amber-500 rounded-full" /> 
                Dokumentasi Kegiatan
              </h2>
              <div 
                className={`relative h-56 border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center gap-4 overflow-hidden transition-all cursor-pointer group shadow-xl ${foto || existingFotoUrl ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-white hover:border-emerald-400'}`}
              >
                {previewUrl || (editId && existingFotoUrl) ? (
                  <img src={previewUrl || existingFotoUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" alt="Preview" />
                ) : null}
                
                <div className="relative z-10 flex flex-col items-center gap-4">
                  {isCompressing ? (
                    <div className="flex flex-col items-center gap-3">
                       <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
                         <Loader2 size={32} className="text-amber-500 animate-spin" />
                       </div>
                       <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest animate-pulse">Memproses Gambar...</p>
                    </div>
                  ) : (
                    <>
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-all ${foto || existingFotoUrl ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 group-hover:text-emerald-500 group-hover:scale-110'}`}>
                        <Camera size={28} />
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-black uppercase tracking-widest ${foto || existingFotoUrl ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {foto || existingFotoUrl ? 'Dokumentasi Terpilih' : 'Ambil Foto Dokumentasi'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-2">Format WebP • Target 100KB</p>
                      </div>
                    </>
                  )}
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
          <div className="animate-in slide-in-from-bottom-8 duration-700">
            <div className="bg-rose-50 border border-rose-100 p-10 rounded-[3rem] space-y-8 shadow-xl shadow-rose-200/20">
              <div className="flex items-center gap-6 text-rose-500">
                <div className="w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center shadow-lg text-rose-500">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-rose-900">Unit Tidak Operasional</h3>
                  <p className="text-sm text-rose-600/70 font-bold uppercase tracking-widest mt-1">Laporan Hari Libur / Kendala</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-2">Alasan / Catatan Kendala</label>
                <textarea 
                  className="w-full bg-white border border-rose-100 rounded-[2rem] p-6 text-base font-bold text-slate-700 outline-none focus:ring-4 focus:ring-rose-200 transition-all min-h-[160px] shadow-inner"
                  placeholder="Berikan alasan yang jelas kenapa unit tidak beroperasi hari ini..."
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* TOTAL SUMMARY & SUBMIT BUTTON */}
        <div className="fixed bottom-0 left-0 right-0 p-6 md:static md:p-0 bg-white/80 backdrop-blur-xl md:bg-transparent z-[90] border-t border-slate-100 md:border-none">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            {statusOperasional && (
              <div className="flex items-center justify-between px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Porsi Terinput</span>
                <span className="text-lg font-black text-indigo-600">{calculatedTotal.toLocaleString()} <small className="text-[10px] text-slate-400 font-bold uppercase ml-1">Porsi</small></span>
              </div>
            )}
            <button 
              onClick={handleSimpan}
              disabled={loading || isCompressing}
              className={`w-full py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50 ${statusOperasional ? 'bg-[#0F172A] text-white shadow-slate-900/20' : 'bg-rose-600 text-white shadow-rose-600/30'}`}
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Mengirim Data...</>
              ) : (
                <>
                  {editId ? 'Perbarui Laporan' : 'Kirim Laporan'} 
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
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