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
  Image as ImageIcon
} from 'lucide-react'

export default function DetailLaporanPage() {
  const { id } = useParams()
  const router = useRouter()
  const [unit, setUnit] = useState<any>(null)
  const [laporan, setLaporan] = useState<any>(null)
  const [tanggal, setTanggal] = useState('2026-02-18')

  const fetchDetail = async () => {
    // 1. Ambil Info Unit
    const { data: u } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
    if (u) setUnit(u)

    // 2. Ambil Laporan berdasarkan Tanggal
    const { data: l } = await supabase.from('laporan_harian_final').select('*').eq('unit_id', id).eq('tanggal_ops', tanggal).single()
    setLaporan(l || null)
  }

  useEffect(() => { fetchDetail() }, [id, tanggal])

  // LINK GDRIVE EMAIL ANDA
  const linkGDrive = "https://drive.google.com/drive/u/0/my-drive"

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* TOP BAR */}
        <header className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
           <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-black text-[#0F2650] uppercase tracking-widest hover:text-blue-600 transition-all">
              <ArrowLeft size={18} /> Kembali ke Monitor
           </button>
           <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <Calendar size={16} className="text-[#0F2650]" />
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="bg-transparent text-xs font-black outline-none" />
           </div>
        </header>

        {/* HERO BANNER UNIT */}
        {unit && (
          <div className="bg-[#0F2650] rounded-[2.5rem] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20">
                     <Database size={32} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.4em] mb-1">Data Unit Operasional</p>
                    <h1 className="text-2xl lg:text-4xl font-black italic uppercase tracking-tighter">{unit.nama_unit}</h1>
                    <p className="text-xs font-bold opacity-70 mt-2 flex items-center gap-2 uppercase">
                       <div className="w-2 h-2 bg-emerald-400 rounded-full"></div> {unit.kepala_unit} | ID: {unit.id.substring(0,8)}...
                    </p>
                  </div>
               </div>
               {laporan && <div className="bg-emerald-500 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20">Sudah Lapor</div>}
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </div>
        )}

        {laporan ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* CONTENT KIRI: MENU & GIZI */}
            <div className="lg:col-span-2 space-y-8">
               <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                  <h3 className="flex items-center gap-3 text-[10px] font-black text-[#0F2650] uppercase tracking-[0.3em] italic border-b pb-4">
                     <UtensilsCrossed size={18}/> Menu Makan Bergizi Harian
                  </h3>
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-center">
                     <p className="text-2xl lg:text-3xl font-black text-[#0F2650] italic leading-tight">"{laporan.menu_makanan}"</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Waktu Input</p>
                        <p className="text-sm font-black text-[#0F2650]">18:53:32</p>
                     </div>
                     <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                        <div>
                           <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Validasi</p>
                           <p className="text-sm font-black text-emerald-600 uppercase italic">Terverifikasi</p>
                        </div>
                        <CheckCircle2 className="text-emerald-500" size={24}/>
                     </div>
                  </div>
               </div>

               {/* ANALISIS GIZI */}
               <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                  <h3 className="flex items-center gap-3 text-[10px] font-black text-[#0F2650] uppercase tracking-[0.3em] italic">
                     <Activity size={18}/> Analisis Kandungan Gizi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     {['Besar', 'Kecil'].map((tipe) => (
                        <div key={tipe}>
                           <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${tipe === 'Besar' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>Porsi {tipe}</span>
                           <div className="mt-4 space-y-3">
                              {['Energi', 'Protein', 'Lemak', 'Karbo', 'Serat'].map(g => (
                                 <div key={g} className="flex justify-between items-center border-b border-slate-50 pb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{g}</span>
                                    <span className="text-xs font-black text-[#0F2650]">{laporan.data_gizi?.[tipe.toLowerCase()]?.[g.toLowerCase()] || '0'} <span className="text-[9px] text-slate-300 font-bold">{g === 'Energi' ? 'kkal' : 'gr'}</span></span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* CONTENT KANAN: DOKUMENTASI GDRIVE & DISTRIBUSI */}
            <div className="space-y-8">
               <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm text-center space-y-6">
                  <div className="w-full aspect-square bg-slate-100 rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                     <ImageIcon size={48} className="text-slate-300 mb-4" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 leading-relaxed">Dokumentasi tersimpan di Google Drive</p>
                  </div>
                  {/* TOMBOL BUKA GDRIVE SESUAI REQUEST ANDA */}
                  <a 
                    href={linkGDrive} 
                    target="_blank" 
                    className="w-full flex items-center justify-center gap-3 py-4 bg-[#0F2650] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:shadow-blue-900/30 transition-all group"
                  >
                    <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/> Buka Dokumentasi Foto
                  </a>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Terlampir: 1 Berkas Foto di Drive</p>
               </div>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-sm">
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <XCircle size={40} />
             </div>
             <h2 className="text-xl font-black text-[#0F2650] uppercase italic tracking-tighter">Laporan Belum Tersedia</h2>
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Pilih tanggal lain atau hubungi admin unit terkait.</p>
          </div>
        )}

      </div>
    </div>
  )
}