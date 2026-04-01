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
  Clock
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
      .maybeSingle() // Gunakan maybeSingle agar tidak error jika data kosong

    setLaporan(l || null)
    setLoading(false)
  }

  useEffect(() => {
    if (id) fetchDetailData()
  }, [id, tanggal])

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER NAVIGASI */}
        <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <button
            onClick={() => router.push('/korwil')}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={16} /> Kembali ke Monitor Global
          </button>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="bg-transparent text-xs font-medium outline-none text-slate-700"
            />
          </div>
        </header>

        {/* BANNER UNIT */}
        {unit && (
          <div className="bg-[#0F2650] rounded-xl p-6 lg:p-8 text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                  <Database size={24} className="text-indigo-200" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-indigo-300 uppercase tracking-widest mb-1">Detailed Unit Report</p>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{unit.nama_unit}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-medium text-indigo-200 capitalize">PJ: {unit.kepala_unit}</span>
                  </div>
                </div>
              </div>
              {laporan && (
                <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 size={14} /> Sudah Lapor
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-xs font-medium text-slate-400 animate-pulse uppercase tracking-widest">Memuat Data Unit...</div>
        ) : laporan ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* KIRI: MENU & ANALISIS GIZI */}
            <div className="lg:col-span-2 space-y-6">
              {/* Menu Makanan Card */}
              <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4">
                  <UtensilsCrossed size={16} className="text-slate-400" /> Menu Utama Hari Ini
                </h3>
                <div className="py-6 text-center">
                  <p className="text-2xl lg:text-3xl font-medium italic text-slate-800 leading-relaxed">"{laporan.menu_makanan}"</p>
                </div>
                <div className="flex bg-slate-50 p-4 rounded-xl border border-slate-100 items-center gap-3">
                  <Clock className="text-slate-400" size={18} />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Waktu Pengiriman</p>
                    <p className="text-xs font-semibold text-slate-700">Terkirim pada {laporan.created_at?.split('T')[1].substring(0, 5)} WIB</p>
                  </div>
                </div>
              </div>

              {/* Kandungan Gizi Card */}
              <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4">
                  <Activity size={16} className="text-slate-400" /> Komposisi Nutrisi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {['Besar', 'Kecil'].map((tipe) => (
                    <div key={tipe} className="space-y-4">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Porsi {tipe}</div>
                      <div className="space-y-3">
                        {['Energi', 'Protein', 'Lemak', 'Karbo', 'Serat'].map(g => (
                          <div key={g} className="flex justify-between items-center group">
                            <span className="text-xs text-slate-500">{g}</span>
                            <span className="text-sm font-semibold text-slate-700">{laporan.data_gizi?.[tipe.toLowerCase()]?.[g.toLowerCase()] || '0'} <span className="text-[10px] text-slate-400 font-normal">{g === 'Energi' ? 'kcal' : 'g'}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* KANAN: DOKUMENTASI & DISTRIBUSI */}
            <div className="lg:col-span-1 space-y-6">
              {/* Dokumentasi Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 text-center space-y-4">
                <div className="w-full aspect-square bg-slate-50 rounded-lg flex flex-col items-center justify-center border border-slate-100 relative group overflow-hidden">
                  {laporan.foto_url ? (
                    <img src={laporan.foto_url} className="w-full h-full object-cover rounded-lg" alt="Dokumentasi" />
                  ) : (
                    <>
                      <ImageIcon size={32} className="text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400 px-6">Belum Ada Dokumentasi</p>
                    </>
                  )}
                </div>
                {laporan.foto_url && (
                  <a
                    href={laporan.foto_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Buka Berkas Foto <ExternalLink size={14} />
                  </a>
                )}
              </div>

              {/* Distribusi Sekolah Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4">
                  <School size={16} className="text-slate-400" /> Realisasi Distribusi
                </h3>
                <div className="space-y-1">
                  {listSekolah.length > 0 ? listSekolah.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0 group">
                      <div>
                        <p className="text-sm font-normal text-slate-700">{s.nama_sekolah}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Target: {s.target_porsi} Pack</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">
                          {laporan.realisasi_sekolah?.[s.id] || '0'}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-xs text-slate-400">Belum Ada Titik Layanan</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* TAMPILAN JIKA BELUM LAPOR */
          /* TAMPILAN JIKA BELUM LAPOR */
          <div className="bg-white rounded-xl p-16 text-center border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
              <XCircle size={32} />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Laporan Belum Terbit</h2>
            <p className="text-sm text-slate-500 mt-2">SPPG ini belum mengirimkan data operasional untuk tanggal {tanggal}.</p>
            <button onClick={() => setTanggal(getLocalToday())} className="mt-6 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">Lihat Tanggal Hari Ini</button>
          </div>
        )}

      </div>
    </div>
  )
}