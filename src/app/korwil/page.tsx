"use client"
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import * as XLSX from 'xlsx'
import {
  BarChart3, LogOut, CheckCircle2, ChevronRight, Settings,
  Utensils, School, Box, Activity, Users, Baby, GraduationCap,
  Clock, MapPin, AlertTriangle, Camera, X, ImageIcon, FileSpreadsheet, Loader2
} from 'lucide-react'

export default function SuperKorwilPage() {
  const router = useRouter()

  // --- VIEW STATE ---
  const [activeView, setActiveView] = useState<'monitoring' | 'galeri'>('monitoring')

  // --- MONITORING STATE ---
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [units, setUnits] = useState<any[]>([])
  const [laporan, setLaporan] = useState<any[]>([])
  const KATEGORI_PM = ["PAUD/KB", "TK/RA", "SD/MI", "SMP/MTS", "SMA/SMK", "SANTRI", "BALITA", "BUMIL", "BUSUI"]
  const [statsPorsi, setStatsPorsi] = useState<Record<string, number>>({})
  const [totalPorsiHarian, setTotalPorsiHarian] = useState(0)

  // --- GALERI STATE ---
  const [galeriData, setGaleriData] = useState<any[]>([])
  const [galeriLoading, setGaleriLoading] = useState(false)
  const [selectedFoto, setSelectedFoto] = useState<any>(null)
  const [exporting, setExporting] = useState(false)

  // --- FETCH MONITORING ---
  const fetchData = useCallback(async () => {
    const { data: u } = await supabase.from('daftar_sppg').select('*').order('nama_unit')
    const { data: l } = await supabase.from('laporan_harian_final').select('*').gte('tanggal_ops', startDate).lte('tanggal_ops', endDate)
    const { data: s } = await supabase.from('daftar_sekolah').select('id, jenjang')

    if (u) setUnits(u)
    if (l && s) {
      setLaporan(l)

      let mapping: Record<string, number> = {}
      KATEGORI_PM.forEach(k => mapping[k] = 0)
      let total = 0

      l.forEach(lap => {
        const realisasi = lap.realisasi_sekolah || {}
        Object.entries(realisasi).forEach(([sekolahId, porsi]) => {
          const porsiNum = Number(porsi) || 0
          total += porsiNum

          const sekolahInfo = s.find(item => item.id === sekolahId)
          if (sekolahInfo) {
            const jenjang = sekolahInfo.jenjang?.toUpperCase() || ''
            const targetKat = KATEGORI_PM.find(k => jenjang.includes(k.split('/')[0]))
            if (targetKat) {
              mapping[targetKat] += porsiNum
            } else {
              mapping["SD/MI"] += porsiNum
            }
          }
        })
      })

      setStatsPorsi(mapping)
      setTotalPorsiHarian(total)
    }
  }, [startDate, endDate])

  // --- FETCH GALERI ---
  const fetchGaleri = useCallback(async () => {
    setGaleriLoading(true)
    const { data } = await supabase
      .from('laporan_harian_final')
      .select('id, foto_url, nama_unit, menu_makanan, tanggal_ops')
      .gte('tanggal_ops', startDate)
      .lte('tanggal_ops', endDate)
      .not('foto_url', 'is', null)
      .neq('foto_url', '')
      .order('tanggal_ops', { ascending: false })

    setGaleriData(data || [])
    setGaleriLoading(false)
  }, [startDate, endDate])

  // --- EFFECTS (fixed: removed laporan.length to prevent infinite loop) ---
  useEffect(() => { fetchData() }, [startDate, endDate, fetchData])
  useEffect(() => { if (activeView === 'galeri') fetchGaleri() }, [activeView, startDate, endDate, fetchGaleri])

  // --- ESC key to close modal ---
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedFoto(null) }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const progres = units.length > 0 ? Math.round((laporan.length / units.length) * 100) : 0

  // --- EXPORT EXCEL ---
  const handleExportExcel = async () => {
    setExporting(true)
    try {
      // Fetch school details for enrichment only (names, jenjang, porsi breakdown)
      const { data: allSekolah } = await supabase
        .from('daftar_sekolah')
        .select('*')

      const sekolahMap = new Map((allSekolah || []).map(s => [s.id, s]))

      // Use `laporan` state — the SAME data rendered on screen
      // Expand each laporan's realisasi_sekolah into flat rows
      type FlatRow = {
        tanggal: string; unitName: string; namaSekolah: string; jenjang: string;
        s13: number; s46: number; siswa: number; guru: number; tendik: number; kader: number; total: number;
      }
      const flatRows: FlatRow[] = []

      laporan.forEach((lap: any) => {
        const realisasi = lap.realisasi_sekolah || {}
        Object.entries(realisasi).forEach(([sekolahId, porsi]) => {
          const porsiNum = Number(porsi) || 0
          const sk = sekolahMap.get(sekolahId) as any
          flatRows.push({
            tanggal: lap.tanggal_ops || '',
            unitName: lap.nama_unit || '-',
            namaSekolah: sk?.nama_sekolah || sekolahId,
            jenjang: sk?.jenjang || '-',
            s13: sk?.porsi_siswa_1_3 || 0,
            s46: sk?.porsi_siswa_4_6 || 0,
            siswa: sk?.porsi_siswa || 0,
            guru: sk?.porsi_guru || 0,
            tendik: sk?.porsi_tendik || 0,
            kader: sk?.porsi_kader || 0,
            total: porsiNum,
          })
        })
      })

      // Sort: Tanggal (asc) → Unit SPPG (A-Z) → Jenjang (A-Z) → Nama Titik (A-Z)
      flatRows.sort((a, b) => {
        const cmpDate = a.tanggal.localeCompare(b.tanggal)
        if (cmpDate !== 0) return cmpDate
        const cmpUnit = a.unitName.localeCompare(b.unitName, 'id')
        if (cmpUnit !== 0) return cmpUnit
        const cmpJenjang = a.jenjang.localeCompare(b.jenjang, 'id')
        if (cmpJenjang !== 0) return cmpJenjang
        return a.namaSekolah.localeCompare(b.namaSekolah, 'id')
      })

      // Map to Excel-ready objects
      const rows = flatRows.map((r, i) => ({
        'No': i + 1,
        'Tanggal Laporan': r.tanggal,
        'Nama Unit SPPG': r.unitName,
        'Nama Titik Layanan / Sekolah': r.namaSekolah,
        'Jenjang': r.jenjang,
        'Porsi Siswa (Kls 1-3)': r.s13,
        'Porsi Siswa (Kls 4-6)': r.s46,
        'Porsi Siswa (Umum)': r.siswa,
        'Porsi Guru': r.guru,
        'Porsi Tendik': r.tendik,
        'Porsi Kader': r.kader,
        'Total Porsi': r.total,
      }))

      // GRAND TOTAL row — sums match totalPorsiHarian on screen
      const gt = rows.reduce((acc, r) => ({
        s13: acc.s13 + r['Porsi Siswa (Kls 1-3)'],
        s46: acc.s46 + r['Porsi Siswa (Kls 4-6)'],
        siswa: acc.siswa + r['Porsi Siswa (Umum)'],
        guru: acc.guru + r['Porsi Guru'],
        tendik: acc.tendik + r['Porsi Tendik'],
        kader: acc.kader + r['Porsi Kader'],
        total: acc.total + r['Total Porsi'],
      }), { s13: 0, s46: 0, siswa: 0, guru: 0, tendik: 0, kader: 0, total: 0 })

      rows.push({
        'No': '' as any,
        'Tanggal Laporan': '',
        'Nama Unit SPPG': 'GRAND TOTAL',
        'Nama Titik Layanan / Sekolah': '',
        'Jenjang': '',
        'Porsi Siswa (Kls 1-3)': gt.s13,
        'Porsi Siswa (Kls 4-6)': gt.s46,
        'Porsi Siswa (Umum)': gt.siswa,
        'Porsi Guru': gt.guru,
        'Porsi Tendik': gt.tendik,
        'Porsi Kader': gt.kader,
        'Total Porsi': gt.total,
      })

      const ws = XLSX.utils.json_to_sheet(rows)

      // --- Hierarchical Merge Cells: Tanggal (col 1), Unit SPPG (col 2), Jenjang (col 4) ---
      // Column indices: No=0, Tanggal=1, Unit=2, NamaTitik=3, Jenjang=4
      const COL_TGL = 1, COL_UNIT = 2, COL_JENJANG = 4
      const merges: XLSX.Range[] = []
      let startTgl = 0, startUnit = 0, startJenjang = 0

      const pushMerge = (startIdx: number, endIdx: number, col: number) => {
        if (endIdx > startIdx) {
          // +1 offset because row 0 in sheet = header
          merges.push({ s: { r: startIdx + 1, c: col }, e: { r: endIdx + 1, c: col } })
        }
      }

      for (let i = 1; i < rows.length; i++) {
        const prev = rows[i - 1], curr = rows[i]
        const tglChanged = curr['Tanggal Laporan'] !== prev['Tanggal Laporan']
        const unitChanged = tglChanged || curr['Nama Unit SPPG'] !== prev['Nama Unit SPPG']
        const jenjangChanged = unitChanged || curr['Jenjang'] !== prev['Jenjang']

        if (tglChanged) { pushMerge(startTgl, i - 1, COL_TGL); startTgl = i }
        if (unitChanged) { pushMerge(startUnit, i - 1, COL_UNIT); startUnit = i }
        if (jenjangChanged) { pushMerge(startJenjang, i - 1, COL_JENJANG); startJenjang = i }
      }
      // Flush remaining ranges (exclude GRAND TOTAL row from merges)
      const lastData = rows.length - 2 // last data row index (before GRAND TOTAL)
      if (lastData >= 0) {
        pushMerge(startTgl, lastData, COL_TGL)
        pushMerge(startUnit, lastData, COL_UNIT)
        pushMerge(startJenjang, lastData, COL_JENJANG)
      }
      ws['!merges'] = merges

      // Auto-size columns
      const colWidths = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.max(key.length + 2, ...rows.map(r => String((r as any)[key]).length + 2))
      }))
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Korwil')
      const fileSuffix = startDate === endDate ? startDate : `${startDate}_sampai_${endDate}`
      XLSX.writeFile(wb, `Laporan_Korwil_SPPG_${fileSuffix}.xlsx`)
    } catch (err: any) {
      console.error('Export failed:', err)
      alert('⚠️ Gagal mengekspor data. Coba lagi.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500/20">

      {/* ============================================ */}
      {/* SIDEBAR COMMAND CENTER                      */}
      {/* ============================================ */}
      <aside className="w-24 lg:w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200 fixed h-full z-50 transition-all shadow-sm">
        <div className="p-8 border-b border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
            <Settings size={24} />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-black tracking-tighter text-xl italic text-slate-900 uppercase leading-none">KORWIL</h1>
            <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase mt-1">Control Panel</p>
          </div>
        </div>

        <nav className="p-6 space-y-3">
          <button
            onClick={() => setActiveView('monitoring')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeView === 'monitoring' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
          >
            <BarChart3 size={20} />
            <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Monitoring</span>
          </button>
          <button
            onClick={() => setActiveView('galeri')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeView === 'galeri' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
          >
            <Camera size={20} />
            <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Galeri</span>
          </button>
        </nav>

        <div className="absolute bottom-8 w-full px-6">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-xs uppercase tracking-widest">
            <LogOut size={20} />
            <span className="hidden lg:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ============================================ */}
      {/* MAIN CONTENT                                */}
      {/* ============================================ */}
      <main className="pl-24 lg:pl-72 p-8 transition-all">
        <div className="max-w-7xl mx-auto space-y-10">

          {activeView === 'monitoring' ? (
            <>
              {/* ======== MONITORING VIEW ======== */}
              {/* TOP HEADER */}
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Infografis Wilayah</h2>
                  <div className="flex items-center gap-4 mt-4 text-slate-500">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                      <MapPin size={14} className="text-indigo-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Kab. Pasuruan</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                      <Clock size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{startDate === endDate ? startDate : `${startDate} — ${endDate}`}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleExportExcel}
                    disabled={exporting}
                    className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:opacity-60 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
                  >
                    {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                    {exporting ? 'Mengekspor...' : 'Ekspor Excel'}
                  </button>
                  <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 px-3 uppercase tracking-widest">Dari</span>
                    <input type="date" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <span className="text-[9px] font-black text-slate-400 px-2 uppercase tracking-widest">s/d</span>
                    <input type="date" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
              </header>

              {/* ROW 1: PROGRES & TOTAL PORSI */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[3rem] shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em] mb-2">Progres Pengiriman SPPG</p>
                        <h3 className="text-6xl font-black italic tracking-tighter text-white">{progres}%</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Status Laporan</p>
                        <p className="text-xl font-black text-white">{laporan.length} / {units.length} UNIT</p>
                      </div>
                    </div>
                    <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
                      <div style={{ width: `${progres}%` }} className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-1000"></div>
                    </div>
                  </div>
                  <BarChart3 className="absolute -right-8 -bottom-8 text-white/10 rotate-12 transition-transform group-hover:scale-110" size={250} />
                </div>

                <div className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-md flex flex-col justify-center relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Total Distribusi Hari Ini</p>
                    <h4 className="text-6xl font-black italic tracking-tighter text-slate-900 group-hover:text-indigo-600 transition-colors">{totalPorsiHarian.toLocaleString()}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-4 flex items-center gap-2 tracking-widest leading-none">
                      <Box size={14} className="text-indigo-500" /> Paket Porsi Terkirim
                    </p>
                  </div>
                  <Box className="absolute -right-4 -bottom-4 text-slate-100" size={120} />
                </div>
              </div>

              {/* ROW 2: GRID KATEGORI DINAMIS */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {KATEGORI_PM.map((kat) => (
                  <div key={kat} className={`p-8 rounded-[2.5rem] border transition-all duration-500 group ${statsPorsi[kat] > 0 ? 'bg-white border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-md' : 'bg-slate-100 border-slate-200 opacity-50'}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${statsPorsi[kat] > 0 ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-slate-200 text-slate-400'}`}>
                      {kat.includes('TK') || kat.includes('PAUD') ? <School size={24} /> :
                        kat.includes('BALITA') || kat.includes('BUMIL') ? <Baby size={24} /> :
                          kat.includes('SMP') || kat.includes('SMA') ? <GraduationCap size={24} /> :
                            kat.includes('SANTRI') ? <Users size={24} /> : <Activity size={24} />}
                    </div>
                    <h5 className="text-3xl font-black text-slate-900 leading-none tracking-tighter italic">{statsPorsi[kat]?.toLocaleString() || 0}</h5>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3">{kat}</p>
                  </div>
                ))}
              </div>

              {/* ROW 3: LIST STATUS UNIT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6">
                {/* UNIT BELUM LAPOR */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                      <AlertTriangle size={18} className="animate-pulse" /> Urgent: Belum Lapor
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{units.length - laporan.length} Unit</span>
                  </div>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {units.filter(u => !laporan.find(l => l.unit_id === u.id)).map(u => (
                      <div key={u.id} onClick={() => router.push(`/korwil/detail/${u.id}`)} className="bg-white border border-slate-200 p-6 rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm">
                        <span className="text-xs font-black text-slate-600 group-hover:text-rose-700 uppercase italic transition-colors tracking-tighter">{u.nama_unit}</span>
                        <ChevronRight className="text-slate-300 group-hover:text-rose-500 transition-transform group-hover:translate-x-2" size={20} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* UNIT SUDAH LAPOR */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                      <CheckCircle2 size={18} /> Verified: Laporan Masuk
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{laporan.length} Unit</span>
                  </div>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {laporan.map(l => (
                      <div key={l.id} onClick={() => router.push(`/korwil/detail/${l.unit_id}`)} className="bg-white border border-slate-200 p-6 rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm">
                        <div className="flex items-center gap-5">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                            <Utensils size={18} />
                          </div>
                          <span className="text-xs font-black text-slate-600 group-hover:text-emerald-700 uppercase italic transition-colors tracking-tighter">{l.nama_unit}</span>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-emerald-500 transition-transform group-hover:translate-x-2" size={20} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ======== GALERI VIEW ======== */}
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Galeri Dokumentasi</h2>
                  <div className="flex items-center gap-4 mt-4 text-slate-500">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                      <Camera size={14} className="text-indigo-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Bukti Operasional Harian</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                      <Clock size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{startDate === endDate ? startDate : `${startDate} — ${endDate}`}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 px-3 uppercase tracking-widest">Dari</span>
                  <input type="date" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  <span className="text-[9px] font-black text-slate-400 px-2 uppercase tracking-widest">s/d</span>
                  <input type="date" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </header>

              {/* GALLERY COUNTER */}
              <div className="flex items-center gap-4">
                <div className="bg-white border border-slate-200 px-8 py-4 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 italic tracking-tighter leading-none">{galeriData.length}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Foto Masuk</p>
                  </div>
                </div>
              </div>

              {/* PHOTO GRID */}
              {galeriLoading ? (
                <div className="text-center py-32 font-bold text-slate-400 animate-pulse uppercase tracking-[0.3em] text-xs">Memuat Galeri...</div>
              ) : galeriData.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-[3rem] p-24 text-center shadow-sm">
                  <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                    <Camera size={48} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-400 uppercase italic tracking-tighter">Belum Ada Dokumentasi</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">Tidak ada foto operasional untuk {startDate === endDate ? `tanggal ${startDate}` : `${startDate} s/d ${endDate}`}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {galeriData.filter(item => item.foto_url && item.foto_url.startsWith('http')).map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedFoto(item)}
                      className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden group cursor-pointer hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 shadow-sm"
                    >
                      {/* Photo Area */}
                      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
                        <Image
                          src={item.foto_url || '/placeholder.png'}
                          alt={`Dokumentasi ${item.nama_unit}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/30">Klik untuk Perbesar</span>
                        </div>
                      </div>

                      {/* Info Area */}
                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Utensils size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-black text-slate-800 uppercase italic tracking-tighter leading-none truncate group-hover:text-indigo-600 transition-colors">{item.nama_unit}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate">&quot;{item.menu_makanan}&quot;</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.tanggal_ops}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* ============================================ */}
      {/* MODAL ENLARGE FOTO                          */}
      {/* ============================================ */}
      {selectedFoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={() => setSelectedFoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedFoto(null)}
              className="absolute top-6 right-6 z-10 p-3 bg-white/80 backdrop-blur-md text-slate-500 hover:text-slate-800 hover:bg-white rounded-2xl transition-all border border-slate-200 shadow-sm"
            >
              <X size={22} />
            </button>

            {/* Large Image */}
            <div className="relative w-full aspect-[16/10] bg-slate-100">
              <Image
                src={selectedFoto.foto_url || '/placeholder.png'}
                alt={`Dokumentasi ${selectedFoto.nama_unit}`}
                fill
                sizes="(max-width: 768px) 100vw, 900px"
                className="object-contain"
                priority
              />
            </div>

            {/* Caption */}
            <div className="p-8 flex items-center gap-6 border-t border-slate-200">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <Utensils size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-none truncate">{selectedFoto.nama_unit}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 truncate">Menu: &quot;{selectedFoto.menu_makanan}&quot;</p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tanggal Ops</p>
                <p className="text-sm font-black text-indigo-600 italic tracking-tighter mt-1">{selectedFoto.tanggal_ops}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}