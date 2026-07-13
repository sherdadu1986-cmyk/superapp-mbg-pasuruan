"use client"
import { useState, useEffect, useCallback, useMemo, Fragment, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useRouter, useSearchParams } from 'next/navigation'
import * as XLSX from 'xlsx'
import { 
  ArrowLeft, FileSpreadsheet, FileText, Search, ChevronLeft, ChevronRight, 
  Calendar, AlertTriangle, CheckCircle2, TrendingUp, Users, Filter, Download
} from 'lucide-react'
import { useToast } from '@/components/toast'

function AuditPorsiContent() {
  const router = useRouter()
  const { toast } = useToast()

  // --- DATA STATE ---
  const [monitoringDate, setMonitoringDate] = useState(getLocalToday())
  const [units, setUnits] = useState<any[]>([])
  const [laporan, setLaporan] = useState<any[]>([])
  const [allSchools, setAllSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch All 112 Units
      const { data: u } = await supabase.from('daftar_sppg').select('*').order('nama_unit')
      if (u) setUnits(u)

      // 2. Fetch All Schools with Pagination
      let allSch: any[] = []
      let from = 0
      while (true) {
        const { data: batch } = await supabase
          .from('daftar_sekolah')
          .select('id, sppg_id, target_porsi')
          .range(from, from + 999)
        if (!batch || batch.length === 0) break
        allSch = [...allSch, ...batch]
        if (batch.length < 1000) break
        from += 1000
      }
      setAllSchools(allSch)

      // 3. Fetch Laporan for Date
      const { data: l } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', monitoringDate)
      if (l) setLaporan(l)

    } catch (err) {
      console.error(err)
      toast('error', 'Gagal Load Data', 'Terjadi kesalahan saat mengambil data audit.')
    } finally {
      setLoading(false)
    }
  }, [monitoringDate])

  useEffect(() => { fetchData() }, [fetchData])

  // --- PROCESSING ---
  const auditData = useMemo(() => {
    if (!units.length) return []

    const data = units.map(unit => {
      // Target Resmi (Sum of schools for this unit)
      const unitTarget = allSchools
        .filter(s => s.sppg_id === unit.id)
        .reduce((acc, curr) => acc + (curr.target_porsi || 0), 0)

      // Realisasi (From laporan)
      const unitReport = laporan.find(l => l.unit_id === unit.id)
      let unitReal = 0
      if (unitReport && unitReport.realisasi_sekolah) {
        unitReal = Object.values(unitReport.realisasi_sekolah).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0)
      }

      const selisih = unitReal - unitTarget
      const isAnomali = unitTarget > 0 && unitReal > unitTarget
      const isBelumInputPM = unitTarget === 0

      // Parse Kecamatan & Desa/Unit
      const parts = (unit.nama_unit || '').split(' ')
      const kecamatan = parts[2] || 'TIDAK TERDEFINISI'
      const desa = parts.slice(3).join(' ') || 'UNIT'

      return {
        ...unit,
        kecamatan,
        desa,
        target: unitTarget,
        realisasi: unitReal,
        selisih,
        isAnomali,
        isBelumInputPM,
        status: isBelumInputPM ? 'BELUM INPUT PM' : (unitReport ? 'Sudah Lapor' : 'Belum Lapor')
      }
    })

    return data
  }, [units, laporan, allSchools])

  // --- GROUPING & FILTERING ---
  const filteredData = useMemo(() => {
    return auditData.filter(item => 
      item.nama_unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kecamatan.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [auditData, searchQuery])

  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = {}
    filteredData.forEach(item => {
      if (!groups[item.kecamatan]) groups[item.kecamatan] = []
      groups[item.kecamatan].push(item)
    })
    // Sort Kecamatan alphabetically
    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    )
  }, [filteredData])

  // --- EXPORT HELPERS ---
  const handleExportExcel = () => {
    const rows = auditData.map(item => ({
      'Kecamatan': item.kecamatan,
      'Unit / Desa': item.desa,
      'Target Resmi': item.target,
      'Realisasi Hari Ini': item.realisasi,
      'Selisih': item.selisih,
      'Status': item.status,
      'Keterangan': item.isAnomali ? 'ANOMALI (Over Target)' : ''
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Porsi')
    XLSX.writeFile(wb, `Audit_Porsi_${monitoringDate}.xlsx`)
  }

  const handlePrint = () => {
    window.print()
  }

  // --- UI HELPERS ---
  const shiftDate = (days: number) => {
    const d = new Date(monitoringDate + 'T12:00:00')
    d.setDate(d.getDate() + days)
    setMonitoringDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }))
  }

  const formatDisplayDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('id-ID', { 
      timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    })
  }

  const searchParams = useSearchParams()
  const highlightParam = searchParams.get('highlight')

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-5 lg:p-8">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .card-print { border: none !important; shadow: none !important; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
          <div className="space-y-1">
            <button 
              onClick={() => router.push('/korwil')}
              className="flex items-center gap-2 text-indigo-600 font-bold text-xs hover:gap-3 transition-all mb-2"
            >
              <ArrowLeft size={14} /> Kembali ke Dashboard
            </button>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              AUDIT SELISIH PORSI <span className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest font-black">Daily Report</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Monitoring perbandingan Target vs Realisasi unit secara harian.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center pr-3">
              <button onClick={() => shiftDate(-1)} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronLeft size={16} /></button>
              <div className="px-3 flex items-center gap-2 border-x border-slate-100 min-w-[140px] justify-center">
                <Calendar size={14} className="text-indigo-500" />
                <span className="text-[11px] font-black">{formatDisplayDate(monitoringDate)}</span>
              </div>
              <button onClick={() => shiftDate(1)} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronRight size={16} /></button>
            </div>

            <button onClick={handleExportExcel} className="h-10 px-4 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-600/20">
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button onClick={handlePrint} className="h-10 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
              <Download size={16} /> PDF / Print
            </button>
          </div>
        </header>

        {/* SUMMARY CARDS (no print) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 no-print">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Target</p>
            <h3 className="text-xl font-black text-slate-900 leading-none">
              {auditData.reduce((acc, curr) => acc + curr.target, 0).toLocaleString()}
            </h3>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Realisasi</p>
            <h3 className="text-xl font-black text-emerald-600 leading-none">
              {auditData.reduce((acc, curr) => acc + curr.realisasi, 0).toLocaleString()}
            </h3>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Anomali Terdeteksi</p>
            <h3 className={`text-xl font-black leading-none ${auditData.filter(i => i.isAnomali).length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {auditData.filter(i => i.isAnomali).length} <small className="text-[10px] text-slate-400 font-bold uppercase">Unit</small>
            </h3>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Lapor</p>
            <h3 className="text-xl font-black text-indigo-600 leading-none">
              {laporan.length} / {units.length}
            </h3>
          </div>
          <div className={`bg-white p-4 rounded-2xl border shadow-sm transition-all ${highlightParam === 'zero-target' ? 'ring-4 ring-rose-500/20 border-rose-300' : 'border-rose-100'}`}>
            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Belum Input PM</p>
            <h3 className="text-xl font-black text-rose-600 leading-none">
              {auditData.filter(i => i.isBelumInputPM).length} <small className="text-[10px] text-rose-300 font-bold uppercase">Unit</small>
            </h3>
          </div>
        </div>

        {/* SEARCH BAR (no print) */}
        <div className="relative no-print">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari unit atau kecamatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-bold text-sm"
          />
        </div>

        {/* MAIN LIST (GRID INSTEAD OF TABLE) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden card-print">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Data Audit...</p>
            </div>
          ) : (
            <div className="min-w-[800px]">
              {/* Header Grid */}
              <div className="grid grid-cols-12 bg-slate-50/80 border-b border-slate-100 px-6 py-4">
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kecamatan</div>
                <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Desa / Unit SPPG</div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Target Resmi</div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Realisasi Harian</div>
                <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Selisih</div>
                <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</div>
              </div>

              {/* Body Grid */}
              <div className="divide-y divide-slate-50">
                {Object.entries(groupedData).map(([kecamatan, items]) => (
                  <div key={kecamatan}>
                    {/* Kecamatan Group Header */}
                    <div className="bg-slate-50/30 px-6 py-2 border-y border-slate-50">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                        KECAMATAN: {kecamatan}
                      </span>
                    </div>

                    {items.map((item) => {
                      const isHighlighted = highlightParam === 'zero-target' && item.isBelumInputPM;
                      return (
                        <div 
                          key={item.id} 
                          className={`grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors ${
                            item.isAnomali ? 'bg-rose-50/30' : item.isBelumInputPM ? 'bg-rose-100/40' : ''
                          } ${isHighlighted ? 'ring-2 ring-inset ring-rose-500' : ''}`}
                        >
                          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase">{item.kecamatan}</div>
                          <div className="col-span-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.desa}</span>
                                {item.isBelumInputPM && (
                                  <a 
                                    href={`https://wa.me/${(item.no_hp_ka_sppg || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${item.nama_unit}, data Target Anda masih 0. Segera lengkapi data Penerima Manfaat di dashboard Anda.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors no-print"
                                    title="Tegur via WhatsApp"
                                  >
                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                  </a>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400 font-medium tracking-widest uppercase">ID SPPG: {item.id_sppg || '-'}</span>
                            </div>
                          </div>
                          <div className="col-span-2 text-center text-xs font-black text-slate-700">{item.target.toLocaleString()}</div>
                          <div className={`col-span-2 text-center text-xs ${item.isAnomali ? 'text-rose-600 font-black animate-pulse' : 'font-black text-slate-700'}`}>
                            {item.realisasi.toLocaleString()}
                          </div>
                          <div className={`col-span-1 text-center text-[11px] font-black ${item.isAnomali ? 'text-rose-600' : item.selisih < 0 ? 'text-blue-600' : 'text-slate-200'}`}>
                            {item.selisih > 0 ? `+${item.selisih}` : item.selisih}
                          </div>
                          <div className="col-span-1 text-center">
                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${
                              item.isBelumInputPM
                                ? 'bg-rose-100 text-rose-700'
                                : item.status === 'Sudah Lapor' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-slate-100 text-slate-400'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
                {Object.keys(groupedData).length === 0 && (
                  <div className="px-6 py-32 text-center">
                    <Search size={48} className="mx-auto text-slate-100 mb-4" />
                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">Tidak ada data ditemukan</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PRINT FOOTER (visible only on print) */}
        <div className="hidden print-only mt-10 border-t pt-8">
          <div className="flex justify-between items-start">
            <div className="text-[10px] text-slate-400">
              <p>Laporan Audit Porsi MBG Kab. Pasuruan</p>
              <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
            </div>
            <div className="text-center min-w-[200px]">
              <p className="text-[10px] font-black uppercase mb-16">Korwil Kab. Pasuruan</p>
              <div className="w-full border-b border-slate-900"></div>
              <p className="text-[10px] font-bold mt-2">Mba Aisha</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuditPorsiPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Memuat Audit...</p>
        </div>
      </div>
    }>
      <AuditPorsiContent />
    </Suspense>
  )
}
