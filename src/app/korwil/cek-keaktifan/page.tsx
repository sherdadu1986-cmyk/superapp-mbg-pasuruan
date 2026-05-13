"use client"
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BarChart3, ArrowLeft, Shield, Megaphone, ChevronRight, 
  CheckCircle2, AlertTriangle, Loader2, Search, Filter, Layout
} from 'lucide-react'
import { useToast } from '@/components/toast'

export default function CekKeaktifanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter')
  const { toast } = useToast()

  const [units, setUnits] = useState<any[]>([])
  const [complianceUnits, setComplianceUnits] = useState<any[]>([])
  const [auditFilter, setAuditFilter] = useState<'active' | 'rare' | 'never' | 'all'>(
    filterParam === 'pending' ? 'never' : 'all'
  )
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: allUnits } = await supabase
        .from('daftar_sppg')
        .select('*, id, nama_unit, no_hp_ka_sppg')
        .order('nama_unit')
      
      const { data: allLaporan } = await supabase.from('laporan_harian_final').select('unit_id, tanggal_ops')
      
      const today = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      
      let businessDays = 0;
      let tempDate = new Date(monthStart);
      while (tempDate <= today) {
        const day = tempDate.getDay();
        if (day !== 0) businessDays++;
        tempDate.setDate(tempDate.getDate() + 1);
      }
      if (businessDays === 0) businessDays = 1;
      
      if (allUnits && allLaporan) {
        const processed = allUnits.map(unit => {
          const unitReports = allLaporan.filter(l => l.unit_id === unit.id)
          const monthReports = unitReports.filter(l => new Date(l.tanggal_ops) >= monthStart)
          const totalMonth = monthReports.length
          const lastReport = unitReports.length > 0 
            ? unitReports.sort((a, b) => b.tanggal_ops.localeCompare(a.tanggal_ops))[0].tanggal_ops 
            : null
          
          const complianceScore = Math.min(Math.round((totalMonth / businessDays) * 100), 100)
          const status = complianceScore >= 60 ? 'active' : complianceScore >= 40 ? 'rare' : 'never';
          
          return {
            ...unit,
            totalMonth,
            lastReport,
            complianceScore,
            hasNeverReported: unitReports.length === 0,
            complianceStatus: status
          }
        })
        setComplianceUnits(processed)
        setUnits(allUnits)
      }
    } catch (err) {
      console.error(err)
      toast('error', 'Gagal Load Data', 'Terjadi kesalahan saat memproses data keaktifan.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const auditSummary = useMemo(() => {
    const aktif = complianceUnits.filter(u => u.complianceStatus === 'active').length;
    const rare = complianceUnits.filter(u => u.complianceStatus === 'rare').length;
    const never = complianceUnits.filter(u => u.complianceStatus === 'never').length;
    return { aktif, rare, never };
  }, [complianceUnits]);

  const filteredData = useMemo(() => {
    return complianceUnits.filter(u => {
      const matchSearch = u.nama_unit.toLowerCase().includes(searchQuery.toLowerCase())
      const matchFilter = auditFilter === 'all' ? true : u.complianceStatus === auditFilter
      return matchSearch && matchFilter
    })
  }, [complianceUnits, auditFilter, searchQuery])

  const groupedByKecamatan = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredData.forEach(u => {
      const parts = (u.nama_unit || '').split(' ');
      const kecamatan = parts[2] || 'TIDAK TERDEFINISI';
      const desa = parts.slice(3).join(' ') || 'UNIT';
      
      if (!groups[kecamatan]) groups[kecamatan] = [];
      groups[kecamatan].push({ ...u, parsedDesa: desa });
    });

    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-5 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <button 
              onClick={() => router.push('/korwil')}
              className="flex items-center gap-2 text-indigo-600 font-bold text-xs hover:gap-3 transition-all mb-2 uppercase tracking-widest"
            >
              <ArrowLeft size={14} /> Dashboard
            </button>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-3 italic uppercase">
              Cek Keaktifan SPPG <span className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full not-italic tracking-widest font-black">Audit Compliance</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Pantau kedisiplinan pelaporan harian unit SPPG di seluruh wilayah.</p>
          </div>

          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            {[
              { id: 'all', label: 'Semua', icon: Layout },
              { id: 'active', label: 'Aktif', icon: CheckCircle2 },
              { id: 'rare', label: 'Jarang', icon: AlertTriangle },
              { id: 'never', label: 'Macet', icon: Shield },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAuditFilter(tab.id as any)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  auditFilter === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* SEARCH & SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 relative">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari Unit SPPG atau Kecamatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/20 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-sm"
            />
          </div>
          <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-600/20 flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Unit</p>
            <h3 className="text-3xl font-black tracking-tight">{units.length} <small className="text-xs opacity-60">SPPG</small></h3>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-emerald-100 shadow-xl shadow-emerald-500/5 flex items-center gap-5 group transition-all hover:scale-[1.02]">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Unit Aktif</p>
              <h4 className="text-3xl font-black text-slate-800 tracking-tight">{auditSummary.aktif} <small className="text-xs text-slate-300">Unit</small></h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-amber-100 shadow-xl shadow-amber-500/5 flex items-center gap-5 group transition-all hover:scale-[1.02]">
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shadow-inner">
              <AlertTriangle size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Jarang Lapor</p>
              <h4 className="text-3xl font-black text-slate-800 tracking-tight">{auditSummary.rare} <small className="text-xs text-slate-300">Unit</small></h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-rose-100 shadow-xl shadow-rose-500/5 flex items-center gap-5 group transition-all hover:scale-[1.02]">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500 shadow-inner">
              <Shield size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Macet / Belum Aktivasi</p>
              <h4 className="text-3xl font-black text-slate-800 tracking-tight">{auditSummary.never} <small className="text-xs text-slate-300">Unit</small></h4>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 size={48} className="text-indigo-500 animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Sinkronisasi Data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByKecamatan).map(([kecamatan, unitsInKec]) => (
              <div key={kecamatan} className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/20">
                <div className="bg-slate-50/80 backdrop-blur-md px-10 py-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black italic shadow-xl">
                      {kecamatan.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">Kecamatan {kecamatan}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{unitsInKec.length} Unit Terdaftar</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      const waMsg = `*INFO KORWIL MBG: CEK KEAKTIFAN*\n\nHalo rekan-rekan SPPG di Kecamatan ${kecamatan}, mohon perhatiannya untuk kedisiplinan laporan harian. Mari kita jaga akurasi data wilayah. Semangat!`
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`, '_blank')
                    }}
                    className="px-6 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group shadow-sm"
                  >
                    <Megaphone size={14} className="group-hover:rotate-12 transition-transform" /> Broadcast ({kecamatan})
                  </button>
                </div>

                <div className="divide-y divide-slate-50">
                  {unitsInKec.map(u => {
                    const isMacet = u.hasNeverReported || u.complianceStatus === 'never';
                    const statusColor = isMacet ? 'rose' : u.complianceScore >= 60 ? 'emerald' : 'amber';
                    const statusLabel = isMacet ? 'Macet' : u.complianceScore >= 60 ? 'Aktif' : 'Jarang';
                    
                    const waMsg = isMacet 
                      ? `Halo ${u.nama_unit}, sistem mendeteksi laporan Anda MACET. Mohon segera update laporan harian MBG atau hubungi Korwil jika ada kendala. Terima kasih.`
                      : `Halo ${u.nama_unit}, tingkat keaktifan pelaporan Anda saat ini ${u.complianceScore}%. Terus pertahankan kedisiplinannya ya. Terima kasih!`;

                    return (
                      <div key={u.id} className="px-10 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-10 flex-1 min-w-0">
                          <div className="flex items-center gap-3 w-24 shrink-0">
                            <div className={`w-2.5 h-2.5 rounded-full bg-${statusColor}-500 shadow-lg shadow-${statusColor}-500/20`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest text-${statusColor}-600`}>{statusLabel}</span>
                          </div>
                          
                          <div className="flex-1 min-w-0 flex items-center gap-12">
                            <h4 className="text-sm font-black text-slate-700 truncate w-64 uppercase tracking-tight">
                              {u.parsedDesa}
                            </h4>
                            
                            <div className="flex items-center gap-8">
                              <div className="w-32">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Last Report</p>
                                <p className="text-[11px] font-bold text-slate-500">
                                  {u.lastReport ? (new Date(u.lastReport).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})) : 'BELUM PERNAH'}
                                </p>
                              </div>
                              <div className="w-16 text-right">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Score</p>
                                <p className={`text-sm font-black ${statusColor === 'rose' ? 'text-rose-600' : 'text-slate-700'}`}>
                                  {u.complianceScore}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <a 
                            href={`https://wa.me/${u.no_hp_ka_sppg?.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                              isMacet ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                            } hover:scale-110 active:scale-95`}
                          >
                            <Megaphone size={16} />
                          </a>
                          <button 
                            onClick={() => router.push(`/korwil/detail/${u.id}`)}
                            className="w-10 h-10 bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            
            {Object.keys(groupedByKecamatan).length === 0 && (
              <div className="py-32 text-center space-y-6 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
                  <Shield size={48} />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-black text-slate-800 uppercase tracking-tighter">Data Tidak Ditemukan</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coba ubah filter atau kata kunci pencarian Anda</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
