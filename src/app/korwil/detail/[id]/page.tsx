"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Database,
  UtensilsCrossed,
  Activity,
  Image as ImageIcon,
  XCircle,
  School,
  Clock,
  LayoutDashboard,
  Users
} from 'lucide-react'

export default function DetailLaporanUnitPage() {
  const { id } = useParams()
  const router = useRouter()

  // State Data
  const [unit, setUnit] = useState<any>(null)
  const [laporan, setLaporan] = useState<any>(null)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  const [tanggal, setTanggal] = useState(getLocalToday())
  const [loading, setLoading] = useState(true)

  const fetchDetailData = async () => {
    setLoading(true)
    // 1. Ambil Info Unit & Daftar Sekolah yang dilayani unit ini
    const { data: u } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
    const { data: s } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', id)

    if (u) setUnit(u)
    if (s) setListSekolah(s)

    // 2. Ambil Laporan Harian Unit pada tanggal yang dipilih
    const { data: l } = await supabase.from('laporan_harian_final')
      .select('*')
      .eq('unit_id', id)
      .eq('tanggal_ops', tanggal)
      .maybeSingle() 

    setLaporan(l || null)
    setLoading(false)
  }

  useEffect(() => {
    if (id) fetchDetailData()
  }, [id, tanggal])

  // Hitung Totals
  const totalSekolahDilayani = laporan?.realisasi_sekolah ? Object.values(laporan.realisasi_sekolah).filter(v => Number(v) > 0).length : 0
  const totalPorsi = laporan?.realisasi_sekolah 
    ? Object.values(laporan.realisasi_sekolah).reduce((acc: number, curr: any) => acc + Number(curr || 0), 0) 
    : 0

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6 lg:p-12 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER NAVIGASI */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-200 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all active:scale-95"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">Laporan Unit Report</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Detail Operasional Harian</p>
             </div>
             <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                <Calendar size={14} className="text-indigo-500" />
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="bg-transparent text-xs font-black outline-none text-slate-800 uppercase"
                />
             </div>
          </div>
        </header>

        {/* BANNER UNIT */}
        {unit && (
          <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-inner border border-indigo-100">
                <Database size={32} />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase italic">{unit.nama_unit}</h1>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">Penanggung Jawab: {unit.kepala_unit}</span>
                </div>
              </div>
            </div>
            
            {laporan ? (
              <div className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-lg transition-all ${laporan.is_operasional ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
                {laporan.is_operasional ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {laporan.is_operasional ? 'Operasional' : 'Tidak Beroperasional'}
              </div>
            ) : (
              <div className="px-6 py-3 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-slate-200">
                Belum Ada Laporan
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
             <Loader2 size={40} className="text-indigo-500 animate-spin" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Menyiapkan Laporan...</p>
          </div>
        ) : laporan ? (
          <div className="space-y-10">
            
            {/* RINGKASAN TOTAL CARDS */}
            {laporan.is_operasional && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-indigo-500 transition-all">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <School size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Total Sekolah Dilayani</p>
                    <p className="text-2xl font-black text-slate-900 leading-none mt-1">{totalSekolahDilayani} <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter italic">Laporan</span></p>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-emerald-500 transition-all">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Users size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Total Porsi/Penerima Manfaat</p>
                    <p className="text-2xl font-black text-slate-900 leading-none mt-1">{totalPorsi.toLocaleString()} <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter italic">Porsi</span></p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

              {/* KIRI: DOKUMENTASI & INFO OPERASIONAL */}
              <div className="lg:col-span-1 space-y-8">
                {/* DOKUMENTASI (UTAMA) */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                    <ImageIcon size={16} /> Dokumentasi Laporan
                  </h3>
                  <div className="w-full aspect-[4/5] bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center border border-slate-100 relative group overflow-hidden shadow-inner">
                    {laporan.foto_url ? (
                      <img src={laporan.foto_url} className="w-full h-full object-cover rounded-[2rem] group-hover:scale-110 transition-all duration-700" alt="Dokumentasi" />
                    ) : (
                      <div className="text-center space-y-3">
                        <XCircle size={40} className="text-slate-200 mx-auto" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tidak Ada Foto</p>
                      </div>
                    )}
                  </div>
                  {laporan.foto_url && (
                    <a
                      href={laporan.foto_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                    >
                      Buka Berkas Foto <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                {/* INFO STATUS BILA TIDAK OPERASIONAL */}
                {!laporan.is_operasional && (
                  <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 space-y-4 shadow-sm">
                     <div className="flex items-center gap-3 text-rose-600">
                        <AlertTriangle size={24} />
                        <h4 className="font-black text-xs uppercase tracking-widest italic">Catatan Kendala</h4>
                     </div>
                     <p className="text-sm text-rose-700 italic font-medium leading-relaxed bg-white/50 p-6 rounded-2xl border border-rose-100/50">
                       "{laporan.catatan_tidak_operasional || 'Tidak ada catatan.'}"
                     </p>
                  </div>
                )}
              </div>

              {/* KANAN: REALISASI DISTRIBUSI */}
              <div className="lg:col-span-2 space-y-8">
                 <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm border border-slate-200 space-y-8">
                    <header className="flex justify-between items-center border-b border-slate-100 pb-8">
                       <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3 italic">
                         <School size={20} className="text-indigo-500" /> Realisasi Distribusi Sekolah
                       </h3>
                       <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Clock size={14} /> Kirim: {laporan.created_at?.split('T')[1].substring(0, 5)} WIB
                       </div>
                    </header>

                    <div className="grid gap-4">
                      {listSekolah.length > 0 ? listSekolah.map((s, idx) => {
                        const real = laporan.realisasi_sekolah?.[s.id] || '0'
                        const isZero = Number(real) === 0
                        return (
                          <div key={idx} className={`flex justify-between items-center p-6 rounded-3xl border transition-all ${isZero ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'}`}>
                            <div className="space-y-1">
                              <p className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">{s.nama_sekolah}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target: {s.target_porsi} Pack</span>
                                {isZero && <span className="text-[8px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter leading-none">Nol</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-xl font-black ${isZero ? 'text-slate-300' : 'text-emerald-600'}`}>
                                {real.toLocaleString()}
                              </p>
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Penerima</p>
                            </div>
                          </div>
                        )
                      }) : (
                        <div className="text-center py-16 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                           <LayoutDashboard size={40} className="text-slate-200 mx-auto mb-4" />
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum Ada Titik Layanan</p>
                        </div>
                      )}
                    </div>
                 </div>
              </div>

            </div>
          </div>
        ) : (
          /* TAMPILAN JIKA BELUM LAPOR */
          <div className="bg-white rounded-[3rem] p-24 text-center border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
              <XCircle size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Laporan Belum Terbit</h2>
            <p className="text-sm text-slate-400 mt-3 font-medium">Unit SPPG ini belum mengirimkan data operasional untuk tanggal <span className="text-slate-800 font-bold">{tanggal}</span>.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
               <button 
                 onClick={() => setTanggal(getLocalToday())} 
                 className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
               >
                 Lihat Hari Ini
               </button>
               <button 
                 onClick={() => router.back()} 
                 className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
               >
                 Kembali
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function Loader2({ size, className }: { size: number, className?: string }) {
  return <Activity size={size} className={className} />
}

function AlertTriangle({ size }: { size: number }) {
  return <Activity size={size} className="text-rose-600" />
}