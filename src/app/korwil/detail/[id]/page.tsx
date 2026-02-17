"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Utensils, 
  Activity, 
  School, 
  CheckCircle2, 
  Clock,
  ExternalLink
} from 'lucide-react'

export default function DetailLaporanKorwil() {
  const router = useRouter()
  const params = useParams()
  const unitId = params.id as string

  // State
  const [unit, setUnit] = useState<any>(null)
  const [sekolah, setSekolah] = useState<any[]>([])
  const [laporanHariIni, setLaporanHariIni] = useState<any>(null)
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const fetchData = async () => {
      if(!unitId) return

      // 1. Info Unit
      const { data: u } = await supabase.from('daftar_sppg').select('*').eq('id', unitId).single()
      if(u) setUnit(u)

      // 2. Daftar Sekolah
      const { data: s } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', unitId).order('jenjang', {ascending: true})
      if(s) setSekolah(s)

      // 3. Laporan Spesifik Tanggal
      const { data: laporToday } = await supabase.from('laporan_harian_final').select('*').eq('unit_id', unitId).eq('tanggal_ops', tanggal).single()
      setLaporanHariIni(laporToday)

      // 4. Riwayat 10 Laporan Terakhir
      const { data: history } = await supabase.from('laporan_harian_final').select('*').eq('unit_id', unitId).order('tanggal_ops', {ascending: false}).limit(10)
      if(history) setRiwayat(history)
    }
    fetchData()
  }, [unitId, tanggal])

  if (!unit) return <div className="min-h-screen flex items-center justify-center font-bold text-[#0F2650] animate-pulse">MEMUAT DATA...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20">
      
      {/* TOP NAVIGATION BAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[#0F2650] font-black text-xs uppercase tracking-widest hover:opacity-70 transition-all">
            <ArrowLeft size={18} /> Kembali ke Monitor
          </button>
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <Calendar size={16} className="text-slate-400" />
            <input type="date" className="bg-transparent text-xs font-bold text-[#0F2650] outline-none" value={tanggal} onChange={e => setTanggal(e.target.value)} />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 lg:p-10 space-y-8">
        
        {/* HEADER SECTION (Identity Card) */}
        <div className="bg-[#0F2650] rounded-[2.5rem] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20">
                <School size={40} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-300 tracking-[0.4em] uppercase mb-1">DATA UNIT OPERASIONAL</p>
                <h1 className="text-3xl lg:text-4xl font-black uppercase italic tracking-tighter">{unit.nama_unit}</h1>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full">
                    <User size={14} className="text-yellow-400" /> {unit.kepala_unit}
                  </div>
                  <div className="text-xs font-bold opacity-60">ID: {unit.id.substring(0,8)}...</div>
                </div>
              </div>
            </div>
            <div className="text-right border-t border-white/10 pt-6 md:border-0 md:pt-0">
               <span className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest ${laporanHariIni ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-red-500 text-white'}`}>
                 {laporanHariIni ? 'Sudah Lapor' : 'Belum Lapor'}
               </span>
            </div>
          </div>
          {/* Abstract Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        {laporanHariIni ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom duration-500">
            
            {/* KIRI: MENU & GIZI */}
            <div className="lg:col-span-2 space-y-8">
              {/* Card Menu Utama */}
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Utensils className="text-[#0F2650]" size={24} />
                  <h3 className="font-black text-sm uppercase text-[#0F2650] tracking-widest">Menu Makan Bergizi Harian</h3>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-2xl font-black text-slate-800 leading-tight italic">"{laporanHariIni.menu_makanan}"</p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <Clock size={18} className="text-slate-400" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Waktu Input</p>
                        <p className="text-xs font-black">{new Date(laporanHariIni.created_at).toLocaleTimeString()}</p>
                      </div>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Validasi</p>
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Terverifikasi</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* Card Kandungan Gizi */}
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="text-[#0F2650]" size={24} />
                  <h3 className="font-black text-sm uppercase text-[#0F2650] tracking-widest">Analisis Kandungan Gizi</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {['besar', 'kecil'].map((tipe) => (
                    <div key={tipe} className="space-y-4">
                      <h4 className={`text-[10px] font-black uppercase px-3 py-1 rounded-full w-fit ${tipe === 'besar' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>Porsi {tipe}</h4>
                      <div className="space-y-2">
                        {['energi', 'protein', 'lemak', 'karbo', 'serat'].map((g) => (
                          <div key={g} className="flex justify-between items-center text-xs font-bold border-b border-slate-50 py-2">
                            <span className="text-slate-400 uppercase">{g}</span>
                            <span className="text-slate-800">{laporanHariIni.data_gizi?.[tipe]?.[g] || '0'} <span className="text-[9px] text-slate-400">{g === 'energi' ? 'kkal' : 'gr'}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* KANAN: FOTO & DISTRIBUSI */}
            <div className="space-y-8">
              {/* Dokumentasi Foto */}
              <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm h-fit">
                <div className="w-full h-64 bg-slate-100 rounded-3xl flex items-center justify-center border border-slate-200 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="bg-white text-black px-4 py-2 rounded-xl font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest">
                      <ExternalLink size={14}/> Buka Foto
                    </button>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FOTO DOKUMENTASI</p>
                </div>
                <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase">Terlampir: 1 Berkas Foto</p>
              </div>

              {/* Rekap Distribusi Sekolah */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Distribusi Titik Layanan</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {sekolah.map((s) => (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">
                      <div>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black uppercase mb-1 block w-fit">{s.jenjang}</span>
                        <p className="text-xs font-black text-slate-700 uppercase">{s.nama_sekolah}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-[#0F2650]">{s.target_porsi}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Pack</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* JIKA BELUM ADA LAPORAN */
          <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <Activity size={40} />
             </div>
             <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Tidak Ada Data Masuk</h3>
             <p className="text-slate-400 text-sm font-bold mt-2 max-w-xs">Unit ini belum mengirimkan laporan untuk tanggal operasional yang dipilih.</p>
             <button className="mt-8 px-6 py-2 bg-[#0F2650] text-white rounded-xl text-xs font-black uppercase tracking-widest">Hubungi Ka SPPG</button>
          </div>
        )}

        {/* RIWAYAT BAR */}
        <div className="pt-10 border-t border-slate-200">
           <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6">Peninjauan 10 Laporan Terakhir</h3>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {riwayat.map((r) => (
                <button 
                  key={r.id} 
                  onClick={() => setTanggal(r.tanggal_ops)}
                  className={`p-4 rounded-2xl border transition-all text-center ${tanggal === r.tanggal_ops ? 'bg-[#0F2650] text-white border-[#0F2650] shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-500'}`}
                >
                  <p className="text-[10px] font-bold opacity-60 uppercase">{new Date(r.tanggal_ops).toLocaleDateString('id-ID', {month: 'short', day: 'numeric'})}</p>
                  <p className="text-xs font-black mt-1">{new Date(r.tanggal_ops).getFullYear()}</p>
                </button>
              ))}
           </div>
        </div>

      </main>
    </div>
  )
}