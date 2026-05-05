"use client"
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast'
import Image from 'next/image'
import * as XLSX from 'xlsx'
import {
  BarChart3, LogOut, CheckCircle2, ChevronRight, ChevronLeft, Settings,
  Utensils, School, Box, Activity, Users, Baby, GraduationCap,
  Clock, MapPin, Map, AlertTriangle, Camera, X, ImageIcon, FileSpreadsheet, Loader2, Calendar,
  Search, Filter, Megaphone, Copy, ClipboardCheck, Database, TrendingUp, Trash2
} from 'lucide-react'

export default function SuperKorwilPage() {
  const router = useRouter()
  const { toast } = useToast()

  // --- VIEW STATE ---
  const [activeView, setActiveView] = useState<'monitoring' | 'galeri'>('monitoring')

  // --- MONITORING STATE (single day) ---
  const [today, setToday] = useState(getLocalToday())
  const [monitoringDate, setMonitoringDate] = useState(getLocalToday())
  const [units, setUnits] = useState<any[]>([])
  const [laporan, setLaporan] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const KATEGORI_PM = ["PAUD/KB", "TK/RA", "SD/MI", "SMP/MTS", "SMA/SMK", "SANTRI", "BALITA", "BUMIL", "BUSUI"]
  const [statsPorsi, setStatsPorsi] = useState<Record<string, number>>({})
  const [totalPorsiHarian, setTotalPorsiHarian] = useState(0)

  // --- GALERI STATE ---
  const [galeriData, setGaleriData] = useState<any[]>([])
  const [galeriLoading, setGaleriLoading] = useState(false)
  const [selectedFoto, setSelectedFoto] = useState<any>(null)
  const [exporting, setExporting] = useState(false)

  // --- SEARCH & FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'semua' | 'sudah' | 'belum'>('semua')

  // --- EXPORT MODAL STATE ---
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportStart, setExportStart] = useState(today)
  const [exportEnd, setExportEnd] = useState(today)

  // --- DELETE MODAL STATE ---
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // --- HANDLER DELETE ---
  const handleDeleteUnit = async () => {
    if (!unitToDelete) return
    setIsDeleting(true)
    try {
      // 1. Validasi & hapus di users_app (cascade manually)
      await supabase.from('users_app').delete().eq('sppg_unit_id', unitToDelete.id)

      // 2. Hapus referensi lain jika perlu
      await supabase.from('daftar_sekolah').delete().eq('sppg_id', unitToDelete.id)
      await supabase.from('laporan_harian_final').delete().eq('unit_id', unitToDelete.id)

      // 3. Hapus unit di daftar_sppg
      const { error } = await supabase.from('daftar_sppg').delete().eq('id', unitToDelete.id)
      if (error) throw error

      toast('success', 'Berhasil Dihapus', `Unit ${unitToDelete.nama_unit} telah dihapus permanen.`)
      setShowDeleteModal(false)
      setUnitToDelete(null)
      fetchData() // Refresh list otomatis
    } catch (err: any) {
      console.error(err)
      toast('error', 'Gagal Menghapus', err.message || 'Terjadi kesalahan.')
    } finally {
      setIsDeleting(false)
    }
  }

  // --- FETCH MONITORING ---
  const fetchData = useCallback(async () => {
    setDataLoading(true)

    // Bypass cache with a timestamp parameter
    const ts = new Date().getTime()

    // 1. Ambil daftar users yang sudah di-ACC (hanya role === 'sppg')
    const { data: usersApp } = await supabase.from('users_app').select('sppg_unit_id').eq('role', 'sppg')
    const validUnitIds = (usersApp || []).map(u => u.sppg_unit_id).filter(Boolean)

    // 2. Ambil daftar SPPG yang ID-nya masih ada di users_app
    let u: any[] = []
    if (validUnitIds.length > 0) {
      const { data } = await supabase
        .from('daftar_sppg')
        .select('*')
        .in('id', validUnitIds)
        .order('nama_unit')
        // dummy filter to bust cache if Next.js caches it
        .gte('created_at', '2000-01-01')
      u = data || []
    }

    const { data: l } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', monitoringDate).gte('created_at', '2000-01-01')
    const { data: s } = await supabase.from('daftar_sekolah').select('id, jenjang')

    if (u) setUnits(u)
    if (l && s) {
      // 3. CLEANUP: Filter laporan agar hanya menampilkan laporan dari Unit yang masih eksis di daftar_sppg
      const validLaporan = l.filter(lap => u.some(unit => unit.id === lap.unit_id))
      setLaporan(validLaporan)

      let mapping: Record<string, number> = {}
      KATEGORI_PM.forEach(k => mapping[k] = 0)
      let total = 0

      validLaporan.forEach(lap => {
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
    setDataLoading(false)
  }, [monitoringDate])

  // --- FETCH GALERI ---
  const fetchGaleri = useCallback(async () => {
    setGaleriLoading(true)
    // 1. Validasi SPPG yang sudah di-ACC
    const { data: activeUsers } = await supabase.from('users_app').select('sppg_unit_id').eq('role', 'sppg')
    const validUnitIds = (activeUsers || []).map(u => u.sppg_unit_id).filter(Boolean)

    if (validUnitIds.length > 0) {
      const { data } = await supabase
        .from('laporan_harian_final')
        .select('id, foto_url, nama_unit, menu_makanan, tanggal_ops, unit_id')
        .eq('tanggal_ops', monitoringDate)
        .not('foto_url', 'is', null)
        .neq('foto_url', '')
        .in('unit_id', validUnitIds)
        .order('tanggal_ops', { ascending: false })
        .gte('created_at', '2000-01-01')

      setGaleriData(data || [])
    } else {
      setGaleriData([])
    }
    setGaleriLoading(false)
  }, [monitoringDate])

  // --- EFFECTS (fixed: removed laporan.length to prevent infinite loop) ---
  useEffect(() => { fetchData() }, [monitoringDate, fetchData])
  useEffect(() => { if (activeView === 'galeri') fetchGaleri() }, [activeView, monitoringDate, fetchGaleri])

  // --- ESC key to close modal ---
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelectedFoto(null); setShowExportModal(false) } }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  // --- MIDNIGHT AUTO-SYNC: update 'today' when clock passes midnight ---
  useEffect(() => {
    const interval = setInterval(() => {
      const realToday = getLocalToday()
      if (realToday !== today) {
        setToday(realToday)
        setMonitoringDate(realToday)
      }
    }, 60000) // check every 60s
    return () => clearInterval(interval)
  }, [today])

  const progres = units.length > 0 ? Math.round((laporan.length / units.length) * 100) : 0

  // --- DEADLINE CHECK (WIB) ---
  const jamWIB = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getHours()
  const isLewatDeadline = jamWIB >= 9 && monitoringDate === today

  // --- COPY SUMMARY ---
  const [copied, setCopied] = useState(false)
  const handleCopySummary = async () => {
    const tanggalDisplay = formatDisplayDate(monitoringDate)
    const belumLapor = units.length - laporan.length
    const text = `📊 RINGKASAN SMO - ${tanggalDisplay}\n✅ Sudah Lapor: ${laporan.length} Unit\n❌ Belum Lapor: ${belumLapor} Unit\n📈 Progres: ${progres}%\nTolong segera lengkapi bagi yang belum. Terima kasih.`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast('success', 'Berhasil Disalin', 'Ringkasan berhasil disalin ke Clipboard!')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast('error', 'Gagal Menyalin', 'Browser tidak mendukung clipboard.')
    }
  }

  // Date stepper helpers
  const shiftDate = (days: number) => {
    const d = new Date(monitoringDate + 'T12:00:00') // noon to avoid DST edge cases
    d.setDate(d.getDate() + days)
    setMonitoringDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }))
  }
  const formatDisplayDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  // --- EXPORT EXCEL (uses its own fetch from modal dates) ---
  const handleExportExcel = async () => {
    setExporting(true)
    try {
      // Fetch laporan for export date range (separate from monitoring)
      const { data: exportLaporan } = await supabase
        .from('laporan_harian_final')
        .select('*')
        .gte('tanggal_ops', exportStart)
        .lte('tanggal_ops', exportEnd)

      const { data: allSekolah } = await supabase
        .from('daftar_sekolah')
        .select('*')

      const sekolahMap = new window.Map<any, any>((allSekolah || []).map((s: any) => [s.id, s]))
      const laporanData = exportLaporan || []

      type FlatRow = {
        tanggal: string; unitName: string; namaSekolah: string; jenjang: string;
        s13: number; s46: number; siswa: number; guru: number; tendik: number; kader: number; total: number;
      }
      const flatRows: FlatRow[] = []

      laporanData.forEach((lap: any) => {
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

      flatRows.sort((a, b) => {
        const cmpDate = a.tanggal.localeCompare(b.tanggal)
        if (cmpDate !== 0) return cmpDate
        const cmpUnit = a.unitName.localeCompare(b.unitName, 'id')
        if (cmpUnit !== 0) return cmpUnit
        const cmpJenjang = a.jenjang.localeCompare(b.jenjang, 'id')
        if (cmpJenjang !== 0) return cmpJenjang
        return a.namaSekolah.localeCompare(b.namaSekolah, 'id')
      })

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

      const COL_TGL = 1, COL_UNIT = 2, COL_JENJANG = 4
      const merges: XLSX.Range[] = []
      let startTgl = 0, startUnit = 0, startJenjang = 0

      const pushMerge = (startIdx: number, endIdx: number, col: number) => {
        if (endIdx > startIdx) {
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
      const lastData = rows.length - 2
      if (lastData >= 0) {
        pushMerge(startTgl, lastData, COL_TGL)
        pushMerge(startUnit, lastData, COL_UNIT)
        pushMerge(startJenjang, lastData, COL_JENJANG)
      }
      ws['!merges'] = merges

      const colWidths = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.max(key.length + 2, ...rows.map(r => String((r as any)[key]).length + 2))
      }))
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Korwil')
      const fileSuffix = exportStart === exportEnd ? exportStart : `${exportStart}_sampai_${exportEnd}`
      XLSX.writeFile(wb, `Laporan_Korwil_SPPG_${fileSuffix}.xlsx`)
      setShowExportModal(false)
    } catch (err: any) {
      console.error('Export failed:', err)
      toast('error', 'Gagal Ekspor', 'Coba lagi beberapa saat.')
    } finally {
      setExporting(false)
    }
  }

  // ============================================
  // SIDEBAR NAV ITEMS
  // ============================================
  const sidebarItems = [
    { label: 'Monitoring', icon: BarChart3, action: () => setActiveView('monitoring'), isActive: activeView === 'monitoring' && true },
    { label: 'Peta Wilayah', icon: Map, action: () => router.push('/korwil/monitoring-wilayah'), isActive: false },
    { label: 'Galeri', icon: Camera, action: () => setActiveView('galeri'), isActive: activeView === 'galeri' && true },
    { label: 'Data SPPG', icon: Database, action: () => router.push('/korwil/sppg'), isActive: false },
    { label: 'Akun Pengguna', icon: Users, action: () => router.push('/korwil/akun'), isActive: false },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-800 font-sans selection:bg-emerald-500/20 relative">

      {/* ============================================ */}
      {/* SIDEBAR — SOLID DARK NAVY                   */}
      {/* ============================================ */}
      <aside className="w-20 lg:w-64 bg-[#111827] fixed h-full z-50 transition-all duration-300 flex flex-col">
        {/* Logo Area */}
        <div className="p-5 lg:px-6 lg:py-7 border-b border-white/[0.06] flex items-center gap-3.5">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <Settings size={20} className="text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-extrabold tracking-tight text-[15px] text-white leading-none">KORWIL</h1>
            <p className="text-[10px] font-medium text-slate-500 tracking-wider mt-0.5">Control Panel</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1.5 mt-2">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 lg:px-4 lg:py-3 rounded-xl transition-all duration-200 group relative ${
                item.isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
              }`}
            >
              {/* Active indicator line */}
              {item.isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-emerald-400 rounded-r-full" />
              )}
              <item.icon size={20} className="shrink-0" />
              <span className="hidden lg:block font-semibold text-[13px] tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="p-3 lg:p-4 border-t border-white/[0.06]">
          <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); localStorage.clear(); router.push('/') }} className="w-full flex items-center gap-3.5 px-3.5 py-3 lg:px-4 lg:py-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
            <LogOut size={20} className="shrink-0" />
            <span className="hidden lg:block font-semibold text-[13px]">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ============================================ */}
      {/* MAIN CONTENT — WHITE CANVAS                 */}
      {/* ============================================ */}
      <main className="pl-20 lg:pl-64 min-h-screen transition-all">
        <div className="max-w-7xl mx-auto p-5 lg:p-8 space-y-6">

          {activeView === 'monitoring' ? (
            <>
              {/* ======== MONITORING VIEW ======== */}
              {/* TOP HEADER — DATE STEPPER */}
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Infografis Wilayah</h2>
                  <div className="flex items-center gap-2.5 mt-2.5">
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-slate-500">
                      <MapPin size={13} className="text-slate-400" />
                      <span className="text-[11px] font-semibold">Kab. Pasuruan</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* COPY SUMMARY */}
                  <button
                    onClick={handleCopySummary}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-semibold transition-all duration-200 border ${copied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-slate-600 border-[#E5E7EB] hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    {copied ? <><ClipboardCheck size={14} /> Disalin!</> : <><Copy size={14} /> Copy Summary</>}
                  </button>

                  {/* EXPORT EXCEL — opens modal */}
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-[11px] font-semibold transition-all duration-200"
                  >
                    <FileSpreadsheet size={14} /> Ekspor Excel
                  </button>

                  {/* DATE STEPPER */}
                  <div className="bg-white rounded-lg border border-[#E5E7EB] flex items-center overflow-hidden">
                    <button onClick={() => shiftDate(-1)} className="px-3 py-2.5 hover:bg-slate-50 transition-colors border-r border-[#E5E7EB]">
                      <ChevronLeft size={15} className="text-slate-400" />
                    </button>
                    <div className="px-3.5 py-2 flex items-center gap-2">
                      <Calendar size={13} className="text-slate-400" />
                      <span className="text-[12px] font-semibold text-slate-700 min-w-[120px] text-center">{formatDisplayDate(monitoringDate)}</span>
                    </div>
                    <button onClick={() => shiftDate(1)} className="px-3 py-2.5 hover:bg-slate-50 transition-colors border-l border-[#E5E7EB]">
                      <ChevronRight size={15} className="text-slate-400" />
                    </button>
                  </div>
                  {monitoringDate !== today && (
                    <button onClick={() => setMonitoringDate(today)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-semibold hover:bg-slate-200 transition-all border border-[#E5E7EB]">
                      Hari Ini
                    </button>
                  )}
                </div>
              </header>

              {/* ROW 1: 4 STAT CARDS — SEPARATED */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card: Progres */}
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Progres</p>
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <TrendingUp size={16} className="text-emerald-500" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight">{progres}%</h3>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
                    <div style={{ width: `${progres}%` }} className="h-full bg-emerald-500 rounded-full transition-all duration-1000"></div>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 mt-2">{laporan.length} / {units.length} Unit</p>
                </div>

                {/* Card: Total Distribusi */}
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Distribusi</p>
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Box size={16} className="text-blue-500" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{totalPorsiHarian.toLocaleString()}</h3>
                  <p className="text-[10px] font-medium text-slate-400 mt-2">Paket Porsi Terkirim</p>
                </div>

                {/* Card: Sudah Laporan */}
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sudah Lapor</p>
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight">{laporan.length}</h3>
                  <p className="text-[10px] font-medium text-slate-400 mt-2">Unit Terverifikasi</p>
                </div>

                {/* Card: Belum Laporan */}
                <div className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all duration-300 ${isLewatDeadline && units.length - laporan.length > 0 ? 'border-red-300' : 'border-[#E5E7EB]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Belum Lapor</p>
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                      <AlertTriangle size={16} className="text-[#991B1B]" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-[#991B1B] tracking-tight">{units.length - laporan.length}</h3>
                  <p className="text-[10px] font-medium text-slate-400 mt-2">Unit Tertunda</p>
                </div>
              </div>

              {/* BROADCAST PENGINGAT → WHATSAPP SHARE */}
              {units.length - laporan.length > 0 && (
                <button
                  onClick={() => {
                    const belumList = units.filter(u => !laporan.find(l => l.unit_id === u.id)).map(u => `• ${u.nama_unit}`).join('\n')
                    const text = `📢 *PENGINGAT MONITORING GIZI - KAB. PASURUAN*\n\nMohon perhatian untuk unit berikut yang *BELUM* mengirimkan laporan hari ini (${formatDisplayDate(monitoringDate)}):\n\n${belumList}\n\nMohon segera dilengkapi sebelum jam operasional berakhir. Terima kasih.`
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-xs tracking-wide flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.99]"
                >
                  <Megaphone size={16} /> Kirim via WhatsApp ke {units.length - laporan.length} Unit
                </button>
              )}

              {/* ROW 2: GRID KATEGORI DINAMIS — FLAT MINIMALIST */}
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                {KATEGORI_PM.map((kat) => (
                  <div key={kat} className={`bg-white p-4 rounded-xl border transition-all duration-300 group ${statsPorsi[kat] > 0 ? 'border-[#E5E7EB] hover:border-slate-300 shadow-sm hover:shadow-md' : 'border-[#E5E7EB] opacity-40'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-all duration-300 ${statsPorsi[kat] > 0 ? 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                      {kat.includes('TK') || kat.includes('PAUD') ? <School size={18} /> :
                        kat.includes('BALITA') || kat.includes('BUMIL') || kat.includes('BUSUI') ? <Baby size={18} /> :
                          kat.includes('SMP') || kat.includes('SMA') ? <GraduationCap size={18} /> :
                            kat.includes('SANTRI') ? <Users size={18} /> : <Activity size={18} />}
                    </div>
                    <h5 className="text-xl font-extrabold text-slate-800 leading-none tracking-tight">{statsPorsi[kat]?.toLocaleString() || 0}</h5>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1.5">{kat}</p>
                  </div>
                ))}
              </div>

              {/* ROW 3: SEARCH BAR + FILTER + UNIT LISTS */}
              <div className="space-y-4 pt-2">
                {/* SEARCH & FILTER TOOLBAR */}
                <div className="flex flex-col md:flex-row gap-3">
                  {/* SEARCH BAR */}
                  <div className="flex-1 relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama SPPG / Unit..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200 placeholder:text-slate-400"
                    />
                  </div>
                  {/* FILTER TOGGLES */}
                  <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-lg p-1">
                    <button
                      onClick={() => setFilterStatus('semua')}
                      className={`px-3.5 py-2 rounded-md text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 ${filterStatus === 'semua' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      <Filter size={12} /> Semua
                    </button>
                    <button
                      onClick={() => setFilterStatus('sudah')}
                      className={`px-3.5 py-2 rounded-md text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 ${filterStatus === 'sudah' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      <CheckCircle2 size={12} /> Sudah
                    </button>
                    <button
                      onClick={() => setFilterStatus('belum')}
                      className={`px-3.5 py-2 rounded-md text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 ${filterStatus === 'belum' ? 'bg-[#991B1B] text-white' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      <AlertTriangle size={12} /> Belum
                    </button>
                  </div>
                </div>

                {/* FILTERED UNIT LISTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* UNIT BELUM LAPOR */}
                  {(filterStatus === 'semua' || filterStatus === 'belum') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-[12px] font-bold text-[#991B1B] uppercase tracking-wider flex items-center gap-2">
                          <AlertTriangle size={15} /> Belum Lapor
                        </h3>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {units.filter(u => !laporan.find(l => l.unit_id === u.id)).filter(u => u.nama_unit?.toLowerCase().includes(searchQuery.toLowerCase())).length} Unit
                        </span>
                      </div>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {units.filter(u => !laporan.find(l => l.unit_id === u.id)).filter(u => u.nama_unit?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                          <div key={u.id} onClick={() => router.push(`/korwil/detail/${u.id}`)} className="bg-white border border-[#E5E7EB] p-3.5 rounded-lg flex justify-between items-center group cursor-pointer hover:border-red-200 hover:bg-red-50/30 transition-all duration-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                                <Utensils size={14} className="text-[#991B1B]" />
                              </div>
                              <span className="text-[13px] font-semibold text-slate-700 group-hover:text-[#991B1B] transition-colors">{u.nama_unit}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setUnitToDelete(u)
                                  setShowDeleteModal(true)
                                }}
                                className="p-1.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                title="Hapus Unit"
                              >
                                <Trash2 size={15} />
                              </button>
                              <ChevronRight className="text-slate-300 group-hover:text-[#991B1B] transition-all group-hover:translate-x-1" size={18} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* UNIT SUDAH LAPOR */}
                  {(filterStatus === 'semua' || filterStatus === 'sudah') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-[12px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 size={15} /> Sudah Lapor
                        </h3>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {laporan.filter(l => l.nama_unit?.toLowerCase().includes(searchQuery.toLowerCase())).length} Unit
                        </span>
                      </div>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {laporan.filter(l => l.nama_unit?.toLowerCase().includes(searchQuery.toLowerCase())).map(l => (
                          <div key={l.id} onClick={() => router.push(`/korwil/detail/${l.unit_id}`)} className="bg-white border border-[#E5E7EB] p-3.5 rounded-lg flex justify-between items-center group cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                <Utensils size={14} className="text-emerald-600" />
                              </div>
                              <span className="text-[13px] font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">{l.nama_unit}</span>
                            </div>
                            <ChevronRight className="text-slate-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" size={18} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ======== GALERI VIEW ======== */}
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">Galeri Dokumentasi</h2>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 transition-colors px-3 py-1.5 rounded-full border border-slate-200 text-slate-600">
                      <Camera size={14} className="text-indigo-500" />
                      <span className="text-[11px] font-semibold uppercase tracking-widest">Bukti Operasional</span>
                    </div>
                  </div>
                </div>

                {/* GALLERY COUNTER & DATE STEPPER */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                    <ImageIcon size={16} />
                    <span className="text-sm font-bold tracking-wide">{galeriData.length} Foto Masuk</span>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex items-center overflow-hidden">
                    <button onClick={() => shiftDate(-1)} className="px-3 py-2.5 hover:bg-slate-50 transition-colors border-r border-slate-100">
                      <ChevronLeft size={16} className="text-slate-400" />
                    </button>
                    <div className="px-4 py-2 flex items-center gap-2 bg-slate-50/50">
                      <Calendar size={14} className="text-indigo-500" />
                      <span className="text-[12px] font-bold text-slate-700 min-w-[120px] text-center">{formatDisplayDate(monitoringDate)}</span>
                    </div>
                    <button onClick={() => shiftDate(1)} className="px-3 py-2.5 hover:bg-slate-50 transition-colors border-l border-slate-100">
                      <ChevronRight size={16} className="text-slate-400" />
                    </button>
                  </div>
                  {monitoringDate !== today && (
                    <button onClick={() => setMonitoringDate(today)} className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all shadow-md">
                      Hari Ini
                    </button>
                  )}
                </div>
              </header>

              {/* PHOTO GRID */}
              {galeriLoading ? (
                <div className="text-center py-32 font-semibold text-slate-400 animate-pulse text-sm">Memuat Galeri...</div>
              ) : galeriData.length === 0 ? (
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-20 text-center shadow-sm">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Camera size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-400">Belum Ada Dokumentasi</h3>
                  <p className="text-sm text-slate-400 font-medium mt-2">Tidak ada foto operasional untuk {formatDisplayDate(monitoringDate)}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {galeriData.filter(item => item.foto_url && item.foto_url.startsWith('http')).map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedFoto(item)}
                      className="group bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 hover:shadow-indigo-500/10 transition-all duration-300 border border-slate-100 flex flex-col"
                    >
                      {/* Photo Area */}
                      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden shrink-0">
                        <Image
                          src={item.foto_url || '/placeholder.png'}
                          alt={`Dokumentasi ${item.nama_unit}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                          <span className="w-fit text-[10px] font-semibold text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg flex items-center gap-1.5">
                            <Utensils size={12} /> Buka Preview
                          </span>
                        </div>
                      </div>

                      {/* Info Area */}
                      <div className="p-4 space-y-3 flex flex-col flex-1">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800 leading-tight truncate group-hover:text-indigo-600 transition-colors" title={item.nama_unit}>{item.nama_unit}</p>
                          <p className="text-[11px] font-medium italic text-slate-500 mt-1 truncate" title={item.menu_makanan}>"{item.menu_makanan}"</p>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-orange-400 shrink-0" />
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider">{item.tanggal_ops}</span>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                            <span className="text-[8px] font-bold text-slate-400">{item.nama_unit.charAt(0)}</span>
                          </div>
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
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 lg:p-12 animate-in fade-in duration-300"
          onClick={() => setSelectedFoto(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-500/10 border border-white/10 flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedFoto(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2.5 bg-black/40 backdrop-blur-md text-slate-300 hover:text-white hover:bg-black/60 rounded-full transition-all border border-white/10"
            >
              <X size={20} />
            </button>

            {/* Large Image */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[70vh] flex items-center justify-center bg-black/50">
              <Image
                src={selectedFoto.foto_url || '/placeholder.png'}
                alt={`Dokumentasi ${selectedFoto.nama_unit}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {/* Caption (Glassmorphism over dark) */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900/40 backdrop-blur-3xl border-t border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Utensils size={22} className="shrink-0" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base sm:text-lg font-extrabold text-white leading-tight truncate">{selectedFoto.nama_unit}</p>
                  <p className="text-[12px] sm:text-sm font-medium text-slate-400 italic mt-1 truncate">"{selectedFoto.menu_makanan}"</p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0 bg-white/5 px-5 py-2.5 rounded-xl border border-white/10 flex items-center sm:items-end flex-col justify-center">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Operasional</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={12} className="text-emerald-400" />
                  <p className="text-[13px] font-bold text-slate-300">{selectedFoto.tanggal_ops}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Ekspor Laporan SPPG</h3>
              <button onClick={() => setShowExportModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500">Pilih rentang tanggal untuk data yang akan diekspor ke file Excel.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dari Tanggal</label>
                <input type="date" className="w-full py-2 px-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" value={exportStart} onChange={e => setExportStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sampai Tanggal</label>
                <input type="date" className="w-full py-2 px-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" value={exportEnd} onChange={e => setExportEnd(e.target.value)} />
              </div>
            </div>
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
            >
              {exporting ? <><Loader2 size={16} className="animate-spin" /> Mengekspor...</> : <><FileSpreadsheet size={16} /> Download Excel</>}
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && unitToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => !isDeleting && setShowDeleteModal(false)}>
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-50 text-[#991B1B] rounded-full flex items-center justify-center mx-auto mb-2">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-800">Hapus Unit {unitToDelete.nama_unit}?</h3>
              <p className="text-sm text-slate-500">
                Peringatan: Seluruh data unit ini dan akun login-nya akan <b>dihapus permanen</b>. Anda yakin?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUnit}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#991B1B] hover:bg-red-800 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}