"use client"
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { 
  ArrowLeft, FileSpreadsheet, FileText, Search, ChevronLeft, ChevronRight, 
  Calendar, AlertTriangle, CheckCircle2, TrendingUp, Users, Filter, Download
} from 'lucide-react'
import { useToast } from '@/components/toast'

export default function AuditPorsiPage() {
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

      // 2. Fetch All Schools (Limit 10k)
      const { data: s } = await supabase.from('daftar_sekolah').select('id, sppg_id, target_porsi').limit(10000)
      if (s) setAllSchools(s)

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
      const isAnomali = unitReal > unitTarget

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
        status: unitReport ? 'Sudah Lapor' : 'Belum Lapor'
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
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

        {/* MAIN TABLE */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden card-print">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Data Audit...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kecamatan</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Desa / Unit SPPG</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Target Resmi</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Realisasi Harian</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Selisih</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Object.entries(groupedData).map(([kecamatan, items]) => (
                    <div key={kecamatan} className="contents">
                      {/* Kecamatan Group Header */}
                      <tr className="bg-slate-50/30">
                        <td colSpan={6} className="px-6 py-2">
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            KECAMATAN: {kecamatan}
                          </span>
                        </td>
                      </tr>
                      {items.map((item, idx) => (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-slate-50/50 transition-colors ${item.isAnomali ? 'bg-rose-50/30' : ''}`}
                        >
                          <td className="px-6 py-3 text-[10px] font-bold text-slate-400">{item.kecamatan}</td>
                          <td className="px-6 py-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.desa}</span>
                              <span className="text-[9px] text-slate-400 font-medium">ID SPPG: {item.id_sppg || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center text-xs font-bold text-slate-600">{item.target.toLocaleString()}</td>
                          <td className={`px-6 py-3 text-center text-xs ${item.isAnomali ? 'text-rose-600 font-black' : 'font-bold text-slate-600'}`}>
                            {item.realisasi.toLocaleString()}
                          </td>
                          <td className={`px-6 py-3 text-center text-xs font-bold ${item.selisih > 0 ? 'text-rose-600' : item.selisih < 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                            {item.selisih > 0 ? `+${item.selisih}` : item.selisih}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                              item.status === 'Sudah Lapor' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </div>
                  ))}
                  {Object.keys(groupedData).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <Search size={32} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Tidak ada data ditemukan</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
