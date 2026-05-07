"use client"
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import * as XLSX from 'xlsx'
import {
  BarChart3, LogOut, CheckCircle2, ChevronRight, ChevronLeft, Settings,
  Utensils, School, Box, Activity, Users, Baby, GraduationCap,
  Clock, MapPin, Map, AlertTriangle, Camera, X, ImageIcon, FileSpreadsheet, Loader2, Calendar,
  Search, Filter, Megaphone, Copy, ClipboardCheck, Database, TrendingUp, Trash2, Layout, ArrowRight, RotateCcw
} from 'lucide-react'
import { useToast } from '@/components/toast'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

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
  const [totalTargetPorsi, setTotalTargetPorsi] = useState(0)

  // --- MONTHLY CHART STATE ---
  const [chartData, setChartData] = useState<any[]>([])
  const [chartLoading, setChartLoading] = useState(true)

  const fetchMonthlyData = useCallback(async () => {
    setChartLoading(true)
    try {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA')
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA')

      // Fetch all reports for this month
      const { data: reports } = await supabase
        .from('laporan_harian_final')
        .select('tanggal_ops, realisasi_sekolah')
        .gte('tanggal_ops', firstDay)
        .lte('tanggal_ops', lastDay)

      // Fetch all schools for target calculation
      const { data: schools } = await supabase.from('daftar_sekolah').select('target_porsi')
      const totalTargetPerDay = (schools || []).reduce((acc, s) => acc + (s.target_porsi || 0), 0)

      const dailyMap: Record<string, { tgl: string, realisasi: number, target: number }> = {}

      // Initialize with all days of the month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      for (let i = 1; i <= daysInMonth; i++) {
        const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        dailyMap[dStr] = { tgl: String(i), realisasi: 0, target: totalTargetPerDay }
      }

      // Aggregate realisasi
      reports?.forEach(r => {
        if (dailyMap[r.tanggal_ops]) {
          const dailyTotal = Object.values(r.realisasi_sekolah || {}).reduce((acc: number, val: any) => acc + (parseInt(val) || 0), 0)
          dailyMap[r.tanggal_ops].realisasi += dailyTotal
        }
      })

      setChartData(Object.values(dailyMap))
    } catch (err) {
      console.error(err)
    } finally {
      setChartLoading(false)
    }
  }, [])


  // --- GALERI STATE ---
  const [galeriData, setGaleriData] = useState<any[]>([])
  const [galeriLoading, setGaleriLoading] = useState(false)
  const [selectedFoto, setSelectedFoto] = useState<any>(null)
  const [exporting, setExporting] = useState(false)

  // --- SEARCH & FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'semua' | 'sudah' | 'belum'>('semua')
  const [copied, setCopied] = useState(false)

  // --- EXPORT MODAL STATE ---
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportStart, setExportStart] = useState(today)
  const [exportEnd, setExportEnd] = useState(today)

  // --- DELETE MODAL STATE ---
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // --- DELETE REPORT STATE ---
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<any>(null)
  const [isDeletingReport, setIsDeletingReport] = useState(false)

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

  // --- HANDLER DELETE REPORT ---
  const handleDeleteReport = async () => {
    if (!reportToDelete) return
    setIsDeletingReport(true)
    try {
      // 1. Hapus Foto di Storage jika ada
      if (reportToDelete.foto_url) {
        try {
          const urlParts = reportToDelete.foto_url.split('/dokumentasi/')
          if (urlParts.length > 1) {
            const filePath = urlParts[1]
            await supabase.storage.from('dokumentasi').remove([filePath])
          }
        } catch (err) {
          console.error('Gagal hapus storage:', err)
        }
      }

      // 2. Hapus data di database
      const { error } = await supabase.from('laporan_harian_final').delete().eq('id', reportToDelete.id)
      if (error) throw error

      toast('success', 'Berhasil Dihapus', 'Laporan berhasil dihapus.')
      setShowDeleteReportModal(false)
      setReportToDelete(null)
      fetchData() // Refresh
      fetchMonthlyData() // Refresh chart
    } catch (err: any) {
      console.error(err)
      toast('error', 'Gagal Menghapus', err.message || 'Terjadi kesalahan.')
    } finally {
      setIsDeletingReport(false)
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
        .select('*, id, nama_unit, no_hp_ka_sppg')
        .in('id', validUnitIds)
        .order('nama_unit')
        .gte('created_at', '2000-01-01')
      u = data || []
    }

    const { data: l } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', monitoringDate).gte('created_at', '2000-01-01')
    const { data: s } = await supabase.from('daftar_sekolah').select('id, jenjang, target_porsi')

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
      const totalTarget = (s || []).reduce((acc, item) => acc + (item.target_porsi || 0), 0)
      setTotalTargetPorsi(totalTarget)
    }
    setDataLoading(false)
  }, [monitoringDate])

  // --- MODAL CATATAN STATE ---
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState({ unit: '', text: '' })

  // --- FETCH GALERI ---
  const fetchGaleri = useCallback(async () => {
    setGaleriLoading(true)
    // 1. Validasi SPPG yang sudah di-ACC
    const { data: activeUsers } = await supabase.from('users_app').select('sppg_unit_id').eq('role', 'sppg')
    const validUnitIds = (activeUsers || []).map(u => u.sppg_unit_id).filter(Boolean)

    if (validUnitIds.length > 0) {
      const { data } = await supabase
        .from('laporan_harian_final')
        .select('id, foto_url, nama_unit, menu_makanan, tanggal_ops, unit_id, is_operasional')
        .eq('tanggal_ops', monitoringDate)
        .eq('is_operasional', true) // Hanya tampilkan yang operasional di galeri
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

  // --- CALCULATIONS ---
  const progres = useMemo(() => {
    return units.length > 0 ? Math.round((laporan.length / units.length) * 100) : 0
  }, [units.length, laporan.length])

  // --- EFFECTS ---
  useEffect(() => { fetchData() }, [monitoringDate, fetchData])
  useEffect(() => { fetchMonthlyData() }, [fetchMonthlyData])
  useEffect(() => { if (activeView === 'galeri') fetchGaleri() }, [activeView, monitoringDate, fetchGaleri])

  // --- SKELETON COMPONENTS ---
  const SkeletonCard = () => (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/20 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-slate-100 rounded-xl" />
        <div className="w-20 h-4 bg-slate-100 rounded" />
      </div>
      <div className="w-24 h-8 bg-slate-100 rounded mb-2" />
      <div className="w-32 h-4 bg-slate-100 rounded" />
    </div>
  )

  const SkeletonChart = () => (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/20 animate-pulse">
      <div className="flex justify-between mb-8">
        <div className="space-y-2">
          <div className="w-48 h-6 bg-slate-100 rounded" />
          <div className="w-32 h-4 bg-slate-100 rounded" />
        </div>
        <div className="w-32 h-10 bg-slate-100 rounded-full" />
      </div>
      <div className="w-full h-64 bg-slate-50 rounded-2xl" />
    </div>
  )

  const SkeletonReport = () => (
    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/20 animate-pulse flex items-center gap-4">
      <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <div className="w-3/4 h-4 bg-slate-100 rounded" />
        <div className="w-1/2 h-3 bg-slate-100 rounded" />
      </div>
      <div className="w-10 h-10 bg-slate-100 rounded-xl" />
    </div>
  )

  // --- ESC key to close modal ---
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFoto(null);
        setShowExportModal(false);
        setShowNoteModal(false);
      }
    }
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

  // --- COPY SUMMARY ---
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
    { label: 'Monitoring', icon: BarChart3, action: () => setActiveView('monitoring'), isActive: activeView === 'monitoring' },
    { label: 'Peta Wilayah', icon: Map, action: () => router.push('/korwil/monitoring-wilayah'), isActive: false },
    { label: 'Galeri', icon: Camera, action: () => setActiveView('galeri'), isActive: activeView === 'galeri' },
    { label: 'Data SPPG', icon: Database, action: () => router.push('/korwil/sppg'), isActive: false },
    { label: 'Akun Pengguna', icon: Users, action: () => router.push('/korwil/akun'), isActive: false },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-500/20 relative pb-20">

      {/* SIDEBAR — COMPACT STYLE */}
      <aside className="w-20 lg:w-64 bg-white fixed h-full z-50 transition-all duration-300 flex flex-col border-r border-slate-100 shadow-xl shadow-slate-200/10">
        {/* Logo Area */}
        <div className="p-5 lg:p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
            <Layout size={20} className="text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-black tracking-tight text-lg text-slate-900 leading-none">Jobie</h1>
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">Korwil Dashboard</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 lg:px-4 space-y-1 mt-2">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${item.isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
            >
              <item.icon size={20} className="shrink-0" />
              <span className="hidden lg:block font-bold text-xs">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="p-6 lg:p-8 border-t border-slate-50">
          <button
            onClick={async () => { await fetch('/api/logout', { method: 'POST' }); localStorage.clear(); router.push('/') }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300 group"
          >
            <LogOut size={22} className="shrink-0 group-hover:rotate-12 transition-transform" />
            <span className="hidden lg:block font-bold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="pl-20 lg:pl-64 min-h-screen transition-all">
        <div className="max-w-7xl mx-auto p-5 lg:p-8 space-y-8">

          {activeView === 'monitoring' ? (
            <>
              {/* TOP HEADER */}
              <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Halo, Korwil! 👋</h2>
                  <p className="text-xs text-slate-400 font-medium">Berikut ringkasan operasional wilayah Pasuruan hari ini.</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* DATE PICKER */}
                  <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/10 flex items-center pr-4">
                    <button onClick={() => shiftDate(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-lg transition-all">
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2 px-3 min-w-[150px] justify-center">
                      <Calendar size={16} className="text-indigo-500" />
                      <span className="text-xs font-black text-slate-700">{formatDisplayDate(monitoringDate)}</span>
                    </div>
                    <button onClick={() => shiftDate(1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-lg transition-all">
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={handleCopySummary} className="w-10 h-10 bg-white border border-slate-100 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-all shadow-lg shadow-slate-200/10 text-slate-600">
                      <Copy size={18} />
                    </button>
                    <button onClick={() => setShowExportModal(true)} className="px-5 h-10 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                      <FileSpreadsheet size={16} /> Ekspor
                    </button>
                  </div>
                </div>
              </header>

              {/* STAT CARDS — ONE ROW COMPACT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {dataLoading ? (
                  <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                ) : (
                  <>
                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-lg shadow-slate-200/10 group hover:-translate-y-1 transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <TrendingUp size={18} />
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded uppercase">Progres Lapor</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">{progres}%</h3>
                      <p className="text-slate-400 font-bold text-[9px] mt-1 uppercase tracking-widest">{laporan.length} / {units.length} Unit</p>
                      <div className="w-full h-1 bg-slate-50 rounded-full mt-3 overflow-hidden">
                        <div style={{ width: `${progres}%` }} className="h-full bg-indigo-600 transition-all duration-1000 ease-out" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-lg shadow-slate-200/10 group hover:-translate-y-1 transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                          <AlertTriangle size={18} />
                        </div>
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black rounded uppercase">Pending</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">{units.length - laporan.length}</h3>
                      <p className="text-slate-400 font-bold text-[9px] mt-1 uppercase tracking-widest">SPPG Belum Lapor</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-lg shadow-slate-200/10 group hover:-translate-y-1 transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          <Box size={18} />
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase">Total Realisasi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{totalPorsiHarian.toLocaleString()}</h3>
                        {totalPorsiHarian > totalTargetPorsi && (
                          <div className="group/tip relative cursor-help">
                            <AlertTriangle size={14} className="text-amber-500 animate-pulse" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[8px] rounded-lg opacity-0 group-hover/tip:opacity-100 transition-all pointer-events-none z-50">
                              Realisasi melebihi target kuota resmi. Mohon cek validitas input SPPG.
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-400 font-bold text-[9px] mt-1 uppercase tracking-widest">Porsi Tersalurkan</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-lg shadow-slate-200/10 group hover:-translate-y-1 transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Users size={18} />
                        </div>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded uppercase">Total Penerima</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">{totalTargetPorsi.toLocaleString()}</h3>
                      <p className="text-slate-400 font-bold text-[9px] mt-1 uppercase tracking-widest">Target Porsi Pasuruan</p>
                    </div>
                  </>
                )}
              </div>

              {/* MONTHLY CHART */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xl shadow-slate-200/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Tren Distribusi - {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date())}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Target vs Realisasi Porsi bulan ini.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500">Realisasi</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-slate-200 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500">Target</span>
                    </div>
                  </div>
                </div>

                {chartLoading ? (
                  <SkeletonChart />
                ) : (
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
                        <XAxis dataKey="tgl" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#CBD5E1' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#CBD5E1' }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px' }}
                          labelStyle={{ fontWeight: 900, fontSize: '10px', marginBottom: '4px', color: '#1E293B' }}
                          itemStyle={{ fontSize: '10px', padding: '0' }}
                        />
                        <Area type="monotone" dataKey="target" stroke="#E2E8F0" strokeWidth={1} fill="transparent" />
                        <Area type="monotone" dataKey="realisasi" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorReal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* REPORT GRID SECTION */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Monitoring Unit</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Detail status dan realisasi setiap unit.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {/* SEARCH BAR */}
                    <div className="relative w-full sm:w-56">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari unit..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold shadow-lg shadow-slate-200/10 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      />
                    </div>

                    {/* STATUS FILTER */}
                    <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-lg shadow-slate-200/10 w-full sm:w-auto">
                      <button
                        onClick={() => setFilterStatus('semua')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${filterStatus === 'semua' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
                      >
                        Semua
                      </button>
                      <button
                        onClick={() => setFilterStatus('sudah')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${filterStatus === 'sudah' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400'}`}
                      >
                        Operasional
                      </button>
                      <button
                        onClick={() => setFilterStatus('belum')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${filterStatus === 'belum' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400'}`}
                      >
                        Belum
                      </button>
                    </div>

                    {/* BROADCAST GLOBAL BUTTON */}
                    <button
                      onClick={() => {
                        const belumLapor = units.filter(u => !laporan.some(l => l.unit_id === u.id))
                        if (belumLapor.length === 0) {
                          toast('info', 'Lengkap!', 'Seluruh unit sudah mengirimkan laporan.')
                          return
                        }
                        const listNames = belumLapor.map((u, i) => `${i + 1}. ${u.nama_unit}`).join('\n')
                        const pesan = `*INFO MONITORING MBG PASURUAN*\n\nBerikut adalah unit SPPG yang *BELUM* mengirimkan laporan hari ini:\n\n${listNames}\n\nMohon kerja samanya untuk segera mengisi laporan di aplikasi. Terima kasih.`
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, '_blank')
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/10 group active:scale-95"
                    >
                      <Megaphone size={14} className="group-hover:animate-bounce" /> Ingatkan di Grup
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {dataLoading ? (
                    <>
                      <SkeletonReport /><SkeletonReport /><SkeletonReport /><SkeletonReport /><SkeletonReport /><SkeletonReport />
                    </>
                  ) : (
                    <>
                      {units
                        .filter(u => u.nama_unit?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(u => {
                          const report = laporan.find(l => l.unit_id === u.id)
                          const hasLapor = !!report
                          const isOp = report?.is_operasional ?? true

                          if (filterStatus === 'sudah' && (!hasLapor || !isOp)) return null
                          if (filterStatus === 'belum' && hasLapor) return null

                          return (
                            <div
                              key={u.id}
                              onClick={() => router.push(`/korwil/detail/${u.id}`)}
                              className={`group bg-white p-4 rounded-xl border border-slate-100 shadow-lg shadow-slate-200/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${hasLapor ? (isOp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600') : 'bg-slate-50 text-slate-300'}`}>
                                  {hasLapor ? (isOp ? <Utensils size={16} /> : <AlertTriangle size={16} />) : <Clock size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{u.nama_unit}</h4>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${hasLapor ? (isOp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700') : 'bg-slate-100 text-slate-500'}`}>
                                      {hasLapor ? (isOp ? 'Lapor' : 'Tutup') : 'N/A'}
                                    </span>
                                    {hasLapor && isOp && (
                                      <p className="text-[10px] font-black text-slate-400">{Object.values(report.realisasi_sekolah || {}).reduce((acc: number, v: any) => acc + (parseInt(v) || 0), 0)}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {hasLapor && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setReportToDelete(report)
                                        setShowDeleteReportModal(true)
                                      }}
                                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 transition-all" />
                                </div>
                              </div>

                              {!isOp ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedNote({ unit: u.nama_unit, text: report.catatan_tidak_operasional || 'Tidak ada catatan.' })
                                    setShowNoteModal(true)
                                  }}
                                  className="mt-3 w-full py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                                >
                                  Alasan
                                </button>
                              ) : (
                                !hasLapor && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const pesan = `Halo ${u.nama_unit}, kami dari Korwil ingin mengingatkan bahwa Anda belum mengirimkan laporan harian Makan Bergizi Gratis untuk hari ini. Mohon segera menginput data di aplikasi. Terima kasih.`
                                      const phone = u.no_hp_ka_sppg || ''
                                      window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(pesan)}`, '_blank')
                                    }}
                                    className="mt-3 w-full py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                  >
                                    <Megaphone size={12} /> Ingatkan via WA
                                  </button>
                                )
                              )}
                            </div>
                          )
                        })}
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* GALERI VIEW — JOBIE STYLE */}
              <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Galeri Dokumentasi 📸</h2>
                  <p className="text-slate-400 font-medium">Bukti operasional harian seluruh unit wilayah.</p>
                </div>
                <div className="bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center pr-6">
                  <button onClick={() => shiftDate(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-all"><ChevronLeft size={18} /></button>
                  <div className="flex items-center gap-3 px-4 min-w-[180px] justify-center"><Calendar size={18} className="text-indigo-500" /><span className="text-sm font-black text-slate-700">{formatDisplayDate(monitoringDate)}</span></div>
                  <button onClick={() => shiftDate(1)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-all"><ChevronRight size={18} /></button>
                </div>
              </header>

              {galeriLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="aspect-[4/5] bg-white rounded-[2.5rem] animate-pulse border border-slate-50" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {galeriData.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedFoto(item)}
                      className="group relative aspect-[4/5] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/30 cursor-pointer border-4 border-white hover:-translate-y-2 transition-all duration-700"
                    >
                      <Image
                        src={item.foto_url}
                        alt={item.nama_unit}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-0 left-0 right-0 p-8 space-y-2">
                        <p className="text-white font-black text-lg leading-tight">{item.nama_unit}</p>
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                          Lihat Detail
                        </span>
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
      {/* ============================================ */}
      {/* MODAL LIHAT CATATAN                         */}
      {/* ============================================ */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shadow-inner">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none italic">Alasan Kendala</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{selectedNote.unit}</p>
                  </div>
                </div>
                <button onClick={() => setShowNoteModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 min-h-[120px]">
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                  "{selectedNote.text}"
                </p>
              </div>

              <button
                onClick={() => setShowNoteModal(false)}
                className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
              >
                Tutup Catatan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DELETE REPORT CONFIRMATION MODAL */}
      {showDeleteReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Hapus Laporan?</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Apakah Anda yakin ingin menghapus laporan ini? Data yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteReportModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all"
                disabled={isDeletingReport}
              >
                Batal
              </button>
              <button
                onClick={handleDeleteReport}
                className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
                disabled={isDeletingReport}
              >
                {isDeletingReport ? <Loader2 size={14} className="animate-spin" /> : 'Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}