"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
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
    <div className="min-h-screen bg-[#F3F4F9] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER NAVIGASI */}
        <header className="flex justify-between items-center bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
           <button 
             onClick={() => router.push('/korwil')} 
             className="flex items-center gap-2 text-xs font-black text-[#6366F1] uppercase tracking-widest hover:translate-x-[-4px] transition-all"
           >
              <ArrowLeft size={18} /> Kembali ke Monitor Global
           </button>
           <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
              <Calendar size={16} className="text-slate-400" />
              <input 
                type="date" 
                value={tanggal} 
                onChange={(e) => setTanggal(e.target.value)} 
                className="bg-transparent text-xs font-bold outline-none text-slate-700" 
              />
           </div>
        </header>

        {/* BANNER UNIT */}
        {unit && (
          <div className="bg-[#0F2650] rounded-[3rem] p-10 lg:p-14 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="flex items-center gap-8">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shadow-inner">
                     <Database size={32} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em] mb-2">Detailed Unit Report</p>
                    <h1 className="text-3xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none">{unit.nama_unit}</h1>
                    <div className="flex items-center gap-4 mt-4">
                       <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">PJ: {unit.kepala_unit}</span>
                    </div>
                  </div>
               </div>
               {laporan && (
                 <div className="bg-emerald-500 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 flex items-center gap-2 animate-pulse">
                   <CheckCircle2 size={18}/> Sudah Lapor
                 </div>
               )}
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          </div>
        )}

        {loading ? (
           <div className="text-center py-20 font-bold text-slate-400 animate-pulse uppercase tracking-[0.3em]">Memuat Data Unit...</div>
        ) : laporan ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* KIRI: MENU & ANALISIS GIZI */}
            <div className="lg:col-span-8 space-y-10">
               {/* Menu Makanan Card */}
               <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
                  <h3 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic border-b border-slate-50 pb-6">
                     <UtensilsCrossed size={18} className="text-[#6366F1]"/> Menu Utama Hari Ini
                  </h3>
                  <div className="bg-[#F8FAFF] p-10 rounded-[2.5rem] border border-indigo-50 text-center shadow-inner">
                     <p className="text-3xl lg:text-4xl font-black text-[#0F2650] italic leading-tight uppercase tracking-tight">"{laporan.menu_makanan}"</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex-1 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <Clock className="text-indigo-500" size={20}/>
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Waktu Pengiriman</p>
                           <p className="text-sm font-black text-slate-700 uppercase tracking-tighter italic">Terkirim pada {laporan.created_at?.split('T')[1].substring(0,5)} WIB</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Kandungan Gizi Card */}
               <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
                  <h3 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">
                     <Activity size={18} className="text-rose-500"/> Komposisi Nutrisi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     {['Besar', 'Kecil'].map((tipe) => (
                        <div key={tipe} className="space-y-6">
                           <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] w-fit shadow-sm ${tipe === 'Besar' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>Porsi {tipe}</div>
                           <div className="space-y-4">
                              {['Energi', 'Protein', 'Lemak', 'Karbo', 'Serat'].map(g => (
                                 <div key={g} className="flex justify-between items-center border-b border-slate-50 pb-3 group">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{g}</span>
                                    <span className="text-sm font-black text-[#0F2650]">{laporan.data_gizi?.[tipe.toLowerCase()]?.[g.toLowerCase()] || '0'} <span className="text-[10px] text-slate-300 font-bold">{g === 'Energi' ? 'kkal' : 'gr'}</span></span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* KANAN: DOKUMENTASI & DISTRIBUSI */}
            <div className="lg:col-span-4 space-y-10">
               {/* Dokumentasi Card - TERINTEGRASI SUPABASE STORAGE */}
               <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 text-center space-y-8">
                  <div className="w-full aspect-square bg-[#F8FAFF] rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-dashed border-indigo-100 relative group overflow-hidden">
                      {laporan.foto_url ? (
                        <img src={laporan.foto_url} className="w-full h-full object-cover rounded-[2rem]" alt="Dokumentasi" />
                      ) : (
                        <>
                          <ImageIcon size={56} className="text-indigo-200 mb-4 group-hover:scale-110 transition-transform" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10 leading-relaxed italic">Belum Ada Dokumentasi Foto</p>
                        </>
                      )}
                  </div>
                  {laporan.foto_url && (
                    <a 
                      href={laporan.foto_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 py-5 bg-[#0F2650] text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-[#6366F1] transition-all group"
                    >
                      Buka Berkas Foto <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                  )}
               </div>

               {/* Distribusi Sekolah Card */}
               <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                    <School size={18} className="text-amber-500"/> Realisasi Distribusi
                  </h3>
                  <div className="space-y-3">
                    {listSekolah.length > 0 ? listSekolah.map((s, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-indigo-200 transition-all">
                        <div>
                           <p className="text-[11px] font-black text-slate-700 uppercase leading-none mb-1">{s.nama_sekolah}</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Target: {s.target_porsi} Pack</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-emerald-600">
                             {laporan.realisasi_sekolah?.[s.id] || '0'}
                           </p>
                           <p className="text-[8px] font-bold text-slate-300 uppercase italic">Terkirim</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-6 text-[10px] font-bold text-slate-300 uppercase italic">Belum Ada Titik Layanan</div>
                    )}
                  </div>
               </div>
            </div>

          </div>
        ) : (
          /* TAMPILAN JIKA BELUM LAPOR */
          <div className="bg-white rounded-[3rem] p-24 text-center border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-500">
             <div className="w-24 h-24 bg-rose-50 text-rose-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <XCircle size={48} />
             </div>
             <h2 className="text-2xl font-black text-[#0F2650] uppercase italic tracking-tighter">Laporan Belum Terbit</h2>
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">SPPG ini belum mengirimkan data operasional untuk tanggal {tanggal}.</p>
             <button onClick={() => setTanggal(new Date().toISOString().split('T')[0])} className="mt-8 text-[9px] font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-200 pb-1 transition-all hover:text-indigo-700">Kembali ke Tanggal Hari Ini</button>
          </div>
        )}

      </div>
    </div>
  )
}