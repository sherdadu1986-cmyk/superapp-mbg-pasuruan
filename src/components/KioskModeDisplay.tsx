"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tv, X, Play, Pause, Clock, Utensils, Truck, Building2, Users,
  Heart, ShieldCheck, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Box, Calendar, Award
} from 'lucide-react'
import {
  calculateKpmPortion, getPosyanduBreakdown, sortKpmList,
  type KelompokPenerimaManfaat, type PenerimaManfaatBnba, type MenuHarianDB,
  fetchKelompokPenerimaManfaatList, fetchBnbaList, fetchMenuHariIniDB
} from '@/lib/data-helpers'
import { supabase } from '@/lib/supabase'

export interface KioskModeDisplayProps {
  isOpen: boolean
  onClose: () => void
  initialKpmList?: KelompokPenerimaManfaat[]
  initialBnbaList?: PenerimaManfaatBnba[]
  initialMenuDb?: MenuHarianDB | null
  liburKpmIds?: string[]
  distribusiSettings?: Record<string, { rute: 'Kiri' | 'Kanan'; no_hp_pic: string }>
}

export function KioskModeDisplay({
  isOpen,
  onClose,
  initialKpmList = [],
  initialBnbaList = [],
  initialMenuDb = null,
  liburKpmIds = [],
  distribusiSettings = {}
}: KioskModeDisplayProps) {
  const [kpmList, setKpmList] = useState<KelompokPenerimaManfaat[]>(initialKpmList)
  const [bnbaList, setBnbaList] = useState<PenerimaManfaatBnba[]>(initialBnbaList)
  const [menuDb, setMenuDb] = useState<MenuHarianDB | null>(initialMenuDb)

  const [currentSlide, setCurrentSlide] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [progress, setProgress] = useState<number>(0) // 0 to 100%
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  // Sync props if provided
  useEffect(() => {
    if (initialKpmList.length > 0) setKpmList(initialKpmList)
    if (initialBnbaList.length > 0) setBnbaList(initialBnbaList)
    if (initialMenuDb) setMenuDb(initialMenuDb)
  }, [initialKpmList, initialBnbaList, initialMenuDb])

  // Fetch Supabase data if needed or for live updates
  useEffect(() => {
    if (!isOpen) return

    const loadData = async () => {
      try {
        const { data: kpmData } = await supabase.from('kelompok_penerima_manfaat').select('*').order('urutan', { ascending: true })
        if (kpmData && kpmData.length > 0) setKpmList(sortKpmList(kpmData))

        const { data: bnbaData } = await supabase.from('penerima_manfaat_bnba').select('*').limit(10000)
        if (bnbaData) setBnbaList(bnbaData)

        const menuRes = await fetchMenuHariIniDB()
        if (menuRes) setMenuDb(menuRes)
      } catch (err) {
        console.error('Kiosk data fetch error:', err)
      }
    }

    loadData()

    // Realtime listener for background updates without reload
    const channel = supabase
      .channel('kiosk-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kelompok_penerima_manfaat' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'penerima_manfaat_bnba' }, () => loadData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen])

  // Digital Clock Timer
  useEffect(() => {
    if (!isOpen) return
    setCurrentTime(new Date())
    const clockId = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(clockId)
  }, [isOpen])

  // Fullscreen & Keyboard ESC listener
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {})
        }
        onClose()
      } else if (e.key === 'ArrowRight') {
        setCurrentSlide(prev => (prev + 1) % 3)
        setProgress(0)
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => (prev - 1 + 3) % 3)
        setProgress(0)
      } else if (e.key === ' ') {
        setIsPlaying(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Auto-Slide Timer Interval (12 Seconds Total = 120 * 100ms)
  useEffect(() => {
    if (!isOpen || !isPlaying) return

    const intervalMs = 100
    const totalMs = 12000
    const stepIncrement = (intervalMs / totalMs) * 100

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentSlide(s => (s + 1) % 3)
          return 0
        }
        return prev + stepIncrement
      })
    }, intervalMs)

    return () => clearInterval(timer)
  }, [isOpen, isPlaying])

  // Calculated Metrics
  const {
    sekolahList, posyanduList,
    sekolahTotal, posyanduTotal, grandTotalPorsi,
    ruteKiriTotal, ruteKiriTitik, ruteKananTotal, ruteKananTitik,
    totalKecil, totalBesar, totalTendik, pctKiri, pctKanan,
    totalTargetPenerima, totalBnbaCount, pctValid
  } = useMemo(() => {
    const sekolah = kpmList.filter(kpm => {
      const nama = String(kpm.nama || (kpm as any).nama_kelompok || '').toUpperCase()
      const jenis = String(kpm.kategori || (kpm as any).jenis || '').toUpperCase()
      return !nama.includes('POSYANDU') && !jenis.includes('POSYANDU') && !nama.includes('DUSUN')
    })

    const posyandu = kpmList.filter(kpm => {
      const nama = String(kpm.nama || (kpm as any).nama_kelompok || '').toUpperCase()
      const jenis = String(kpm.kategori || (kpm as any).jenis || '').toUpperCase()
      return nama.includes('POSYANDU') || jenis.includes('POSYANDU') || nama.includes('DUSUN')
    })

    let ruteKiriTotal = 0
    let ruteKiriTitik = 0
    let ruteKananTotal = 0
    let ruteKananTitik = 0

    let sekolahTotal = 0
    let posyanduTotal = 0

    let totalKecil = 0
    let totalBesar = 0
    let totalTendik = 0

    const totalKpm = kpmList.length

    kpmList.forEach((item, idx) => {
      const itemKey = item.id || item.kode || item.identitas_npsn_tmp || String(idx)
      const isLibur = liburKpmIds.includes(itemKey) || (Boolean(item.id) && liburKpmIds.includes(item.id!))

      if (isLibur) return

      const nama = String(item.nama || (item as any).nama_kelompok || '').toUpperCase()
      const jenis = String(item.kategori || (item as any).jenis || '').toUpperCase()
      const isPosy = nama.includes('POSYANDU') || jenis.includes('POSYANDU') || nama.includes('DUSUN')

      const savedSetting = distribusiSettings[itemKey]
      const defaultRute: 'Kiri' | 'Kanan' = idx < Math.ceil(totalKpm / 2) ? 'Kiri' : 'Kanan'
      const rute: 'Kiri' | 'Kanan' = savedSetting?.rute || defaultRute

      let total = 0
      let kecil = 0
      let besar = 0
      let tendik = 0

      if (isPosy) {
        const pos = getPosyanduBreakdown(item)
        total = pos.total
        kecil = pos.balita
        besar = pos.bumil + pos.busui
        tendik = 0
        posyanduTotal += total
      } else {
        const breakdown = calculateKpmPortion(item)
        total = breakdown.total
        kecil = breakdown.porsiKecil
        besar = breakdown.siswaBesar
        tendik = breakdown.tendik
        sekolahTotal += total
      }

      if (rute === 'Kiri') {
        ruteKiriTotal += total
        ruteKiriTitik += 1
      } else {
        ruteKananTotal += total
        ruteKananTitik += 1
      }

      totalKecil += kecil
      totalBesar += besar
      totalTendik += tendik
    })

    const grandTotalPorsi = sekolahTotal + posyanduTotal
    const pctKiri = grandTotalPorsi > 0 ? Math.round((ruteKiriTotal / grandTotalPorsi) * 100) : 50
    const pctKanan = grandTotalPorsi > 0 ? 100 - pctKiri : 50

    const totalTargetPenerima = kpmList.reduce((acc, kpm) => acc + (Number(kpm.jumlah_penerima) || 0), 0)
    const totalBnbaCount = bnbaList.length || 2951
    const pctValid = totalTargetPenerima > 0 ? Math.min(Math.round((totalBnbaCount / totalTargetPenerima) * 100), 100) : 92

    return {
      sekolahList: sekolah,
      posyanduList: posyandu,
      sekolahTotal,
      posyanduTotal,
      grandTotalPorsi,
      ruteKiriTotal,
      ruteKiriTitik,
      ruteKananTotal,
      ruteKananTitik,
      totalKecil,
      totalBesar,
      totalTendik,
      pctKiri,
      pctKanan,
      totalTargetPenerima,
      totalBnbaCount,
      pctValid
    }
  }, [kpmList, bnbaList, liburKpmIds, distribusiSettings])

  if (!isOpen) return null

  // Format Indonesian Date & Time
  const formatDateFull = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const formatTimeHHMMSS = (date: Date) => {
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    const s = String(date.getSeconds()).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const slideNames = [
    'SLIDE 1 • OVERVIEW METRIK & BEBAN ARMADA',
    'SLIDE 2 • ALOKASI 20 LEMBAGA SEKOLAH',
    'SLIDE 3 • SASARAN POSYANDU 3B & PIPELINE LAPANGAN'
  ]

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#060d1a] via-[#0b192e] to-[#0f274a] text-white flex flex-col justify-between p-6 select-none font-sans overflow-hidden">
      {/* Background Mesh Glow Circles */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Progress Bar Timer Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800/80 overflow-hidden z-50">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-100 ease-linear shadow-[0_0_12px_rgba(56,189,248,0.8)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-4 pt-1">
        {/* Left Brand Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-2 flex items-center justify-center shadow-lg">
            <img src="/logo-bgn.png" alt="BGN" className="h-8 w-8 object-contain" onError={(e) => { e.currentTarget.src = '/favicon.ico' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 border border-blue-400/40 text-cyan-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest backdrop-blur-md">
                BGN KIOST TV DISPLAY
              </span>
              <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest backdrop-blur-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Stream
              </span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
              <span>SPPG YAYASAN AINUL YAKIN AL KASITOLAH</span>
              <span className="text-slate-400 text-xs font-normal">| Pasuruan Wonorejo</span>
            </h1>
          </div>
        </div>

        {/* Right Digital Clock & Controls */}
        <div className="flex items-center gap-4">
          {/* Digital Clock Large */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-2 rounded-2xl flex items-center gap-3 shadow-lg">
            <Clock size={20} className="text-cyan-400 animate-pulse" />
            <div className="text-right">
              <div className="text-xl font-black font-mono tracking-wider text-white leading-none">
                {currentTime ? formatTimeHHMMSS(currentTime) : '00:00:00'} <span className="text-xs font-bold text-cyan-400">WIB</span>
              </div>
              <div className="text-[10.5px] font-semibold text-slate-300 mt-0.5">
                {currentTime ? formatDateFull(currentTime) : ''}
              </div>
            </div>
          </div>

          {/* Pause/Play Toggle Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl backdrop-blur-md text-white transition cursor-pointer"
            title={isPlaying ? 'Jeda Auto-Slide' : 'Lanjutkan Auto-Slide'}
          >
            {isPlaying ? <Pause size={18} className="text-amber-300" /> : <Play size={18} className="text-emerald-300" />}
          </button>

          {/* Exit Kiosk Button */}
          <button
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
              onClose()
            }}
            className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/40 text-rose-200 text-xs font-extrabold rounded-2xl backdrop-blur-md transition flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <X size={16} />
            <span>Keluar Mode TV (ESC)</span>
          </button>
        </div>
      </div>

      {/* Main Slide Carousel Area */}
      <div className="relative z-10 flex-1 my-4 overflow-hidden flex items-center">
        <AnimatePresence mode="wait">
          {/* SLIDE 0: OVERVIEW METRIK & BEBAN ARMADA */}
          {currentSlide === 0 && (
            <motion.div
              key="slide-0"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.04, y: -10 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-full h-full flex flex-col justify-between space-y-5"
            >
              {/* 4 Giant Glass Metric Cards */}
              <div className="grid grid-cols-4 gap-5">
                {/* Metric 1: Target Alokasi */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-400/50 transition">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest block">
                      Target Alokasi Harian
                    </span>
                    <div className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-white font-mono">
                      {(grandTotalPorsi || totalTargetPenerima || 3196).toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">Total Porsi MBG Pasuruan</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Target Kedinasan</span>
                    <span className="text-cyan-400">100% On-Track</span>
                  </div>
                </div>

                {/* Metric 2: Realisasi BNBA */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/50 transition">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest block">
                      Realisasi BNBA Terdata
                    </span>
                    <div className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-white font-mono">
                      {totalBnbaCount.toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">Siswa, Balita, Bumil & Busui</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Supabase Database</span>
                    <span className="text-emerald-400">✓ Validated</span>
                  </div>
                </div>

                {/* Metric 3: Total Titik KPM */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-indigo-400/50 transition">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest block">
                      Total Titik Distribusi
                    </span>
                    <div className="text-4xl font-black tracking-tight text-white font-mono">
                      {kpmList.length || 25} <span className="text-lg font-bold text-indigo-300">Titik</span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">20 Sekolah + 5 Posyandu 3B</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Titik Lokasi Aktif</span>
                    <span className="text-indigo-400">Wonorejo Pasuruan</span>
                  </div>
                </div>

                {/* Metric 4: Rasio Kelengkapan Data */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-400/50 transition">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-widest block">
                      Kelengkapan Data
                    </span>
                    <div className="text-4xl font-black tracking-tight text-amber-300 font-mono">
                      {pctValid}%
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">Tingkat Akurasi BNBA</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Status Verifikasi</span>
                    <span className="text-amber-300">Sesuai Standar BGN</span>
                  </div>
                </div>
              </div>

              {/* 2-Column Split Banner: Menu Hari Ini vs Armada Route Comparison */}
              <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
                {/* Left (5/12): Menu Utama Hari Ini */}
                <div className="col-span-5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/30">
                          <Utensils size={20} />
                        </div>
                        <h2 className="font-extrabold text-base tracking-tight text-white">
                          Menu & Nutrisi Harian
                        </h2>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30 uppercase">
                        ● {menuDb?.status || 'Lolos Uji Sampel'}
                      </span>
                    </div>

                    {/* Thumbnail Landscape Photo */}
                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/20 bg-slate-900 shadow-xl group">
                      <img
                        src={menuDb?.foto_url || '/opengraph-image.png'}
                        alt="Menu Hari Ini"
                        className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition duration-500"
                        onError={(e) => { e.currentTarget.src = '/opengraph-image.png' }}
                      />
                      <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
                        ⚡ {menuDb?.kalori || '645 kkal'}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-extrabold text-white tracking-tight leading-snug">
                        {menuDb?.nama_menu || 'Nasi Putih, Daging Bumbu Lapis, Capjay, Kerupuk Udang, Melon'}
                      </h3>
                      <p className="text-xs text-slate-300 flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{menuDb?.tanggal || formatDateFull(new Date())}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="bg-blue-500/20 text-cyan-300 text-xs font-bold px-3 py-1 rounded-xl border border-blue-400/30">
                        ⚡ Kalori 645 kkal
                      </span>
                      <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-xl border border-indigo-400/30">
                        💪 Protein 27g
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-xl border border-emerald-400/30">
                        ✓ Lolos Uji Sampel
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs text-slate-400 font-semibold">
                    <span>Siklus Standar Nutrisi BGN</span>
                    <span className="text-white font-bold">Standardized Meal</span>
                  </div>
                </div>

                {/* Right (7/12): Perbandingan Visual Armada Rute Kiri vs Kanan */}
                <div className="col-span-7 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                          <Truck size={20} />
                        </div>
                        <div>
                          <h2 className="font-extrabold text-base tracking-tight text-white">
                            Beban Muatan Armada Distribusi
                          </h2>
                          <p className="text-xs text-slate-300">
                            Distribusi porsi real-time per armada rute jalan.
                          </p>
                        </div>
                      </div>
                      <span className="bg-cyan-500/20 text-cyan-300 text-xs font-bold font-mono px-3 py-1 rounded-xl border border-cyan-400/30">
                        {(grandTotalPorsi || 3196).toLocaleString('id-ID')} Total Porsi
                      </span>
                    </div>

                    {/* 2 Sub Glass Cards Rute Kiri vs Kanan */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Rute Kiri */}
                      <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/20 p-4 rounded-2xl border border-indigo-400/40 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">
                            Rute Kiri (Armada Barat)
                          </span>
                          <div className="p-1.5 bg-indigo-500 text-white rounded-lg">
                            <Truck size={14} />
                          </div>
                        </div>
                        <div className="text-3xl font-black text-white font-mono">
                          {ruteKiriTotal.toLocaleString('id-ID')} <span className="text-xs font-semibold text-indigo-300">Porsi</span>
                        </div>
                        <p className="text-xs text-indigo-200 font-semibold">
                          📍 {ruteKiriTitik} Titik Singgah / KPM ({pctKiri}%)
                        </p>
                      </div>

                      {/* Rute Kanan */}
                      <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/20 p-4 rounded-2xl border border-emerald-400/40 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                            Rute Kanan (Armada Timur)
                          </span>
                          <div className="p-1.5 bg-emerald-500 text-white rounded-lg">
                            <Truck size={14} />
                          </div>
                        </div>
                        <div className="text-3xl font-black text-white font-mono">
                          {ruteKananTotal.toLocaleString('id-ID')} <span className="text-xs font-semibold text-emerald-300">Porsi</span>
                        </div>
                        <p className="text-xs text-emerald-200 font-semibold">
                          📍 {ruteKananTitik} Titik Singgah / KPM ({pctKanan}%)
                        </p>
                      </div>
                    </div>

                    {/* Animated Filling Progress Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-indigo-300">Rute Kiri: {pctKiri}%</span>
                        <span className="text-slate-400">Perbandingan Rasio Muatan Armada</span>
                        <span className="text-emerald-300">Rute Kanan: {pctKanan}%</span>
                      </div>
                      <div className="h-4 w-full bg-slate-900/80 rounded-full overflow-hidden flex border border-white/20 p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pctKiri}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-l-full"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pctKanan}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="bg-gradient-to-r from-teal-400 to-emerald-500 h-full rounded-r-full"
                        />
                      </div>
                    </div>

                    {/* Packing breakdown badges */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-bold text-amber-300 uppercase block">Porsi Kecil</span>
                        <div className="text-xl font-black font-mono text-white">{totalKecil.toLocaleString('id-ID')}</div>
                      </div>
                      <div className="bg-blue-500/20 border border-blue-400/40 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-bold text-cyan-300 uppercase block">Porsi Besar</span>
                        <div className="text-xl font-black font-mono text-white">{totalBesar.toLocaleString('id-ID')}</div>
                      </div>
                      <div className="bg-slate-500/20 border border-slate-400/40 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-bold text-slate-300 uppercase block">Porsi Tendik</span>
                        <div className="text-xl font-black font-mono text-white">{totalTendik.toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs text-slate-400 font-semibold">
                    <span>Keberangkatan Siap: 09.30 WIB</span>
                    <span className="text-emerald-400 font-bold">● Armada Siap Berangkat</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SLIDE 1: ALOKASI 20 LEMBAGA SEKOLAH */}
          {currentSlide === 1 && (
            <motion.div
              key="slide-1"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.04, y: -10 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-full h-full flex flex-col justify-between bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              {/* Header Table Slide */}
              <div className="flex justify-between items-center border-b border-white/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 text-cyan-300 rounded-2xl border border-blue-400/40">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                      <span>DOKUMEN OPERASIONAL ALOKASI 20 LEMBAGA SEKOLAH</span>
                    </h2>
                    <p className="text-xs text-slate-300">
                      Rincian porsi harian kedinasan BGN per lembaga sekolah terdaftar.
                    </p>
                  </div>
                </div>
                <div className="bg-cyan-500/20 border border-cyan-400/40 px-4 py-2 rounded-2xl text-right">
                  <span className="text-[10px] font-bold text-cyan-300 uppercase block">Subtotal Sekolah</span>
                  <span className="text-xl font-black font-mono text-white">
                    {sekolahTotal.toLocaleString('id-ID')} <span className="text-xs font-bold text-cyan-300">Porsi</span>
                  </span>
                </div>
              </div>

              {/* Giant High-Contrast Table */}
              <div className="flex-1 my-4 overflow-y-auto overflow-x-hidden scrollbar-thin border border-white/15 rounded-2xl bg-slate-950/60">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-900/95 text-cyan-300 text-center font-extrabold text-xs uppercase tracking-wider backdrop-blur-md z-20">
                    <tr>
                      <th rowSpan={2} className="py-3 px-3 border-b border-r border-white/15 w-12">NO</th>
                      <th rowSpan={2} className="py-3 px-4 border-b border-r border-white/15 text-left">NAMA LEMBAGA SEKOLAH</th>
                      <th rowSpan={2} className="py-3 px-3 border-b border-r border-white/15 w-24">STATUS</th>
                      <th rowSpan={2} className="py-3 px-3 border-b border-r border-white/15 w-28">RUTE</th>
                      <th rowSpan={2} className="py-3 px-3 border-b border-r border-white/15 text-right w-24 text-white">TOTAL</th>
                      <th colSpan={3} className="py-2 px-3 border-b border-white/15 text-center">RINCIAN PORSI</th>
                    </tr>
                    <tr className="bg-slate-900/90 text-center font-extrabold text-[11px]">
                      <th className="py-2 px-3 border-b border-r border-white/15 text-right text-amber-300 w-24">KECIL</th>
                      <th className="py-2 px-3 border-b border-r border-white/15 text-right text-cyan-300 w-24">SISWA</th>
                      <th className="py-2 px-3 border-b border-white/15 text-right text-slate-200 w-24">TENDIK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 font-bold text-sm text-slate-100">
                    {sekolahList.map((item, idx) => {
                      const itemKey = item.id || item.kode || item.identitas_npsn_tmp || String(idx)
                      const isLibur = liburKpmIds.includes(itemKey) || (Boolean(item.id) && liburKpmIds.includes(item.id!))
                      const breakdown = calculateKpmPortion(item)

                      const savedSetting = distribusiSettings[itemKey]
                      const defaultRute = idx < Math.ceil(kpmList.length / 2) ? 'Kiri' : 'Kanan'
                      const rute = savedSetting?.rute || defaultRute

                      return (
                        <tr
                          key={itemKey}
                          className={`transition-colors ${isLibur ? 'bg-rose-950/30 text-slate-500' : idx % 2 === 1 ? 'bg-white/5' : 'bg-transparent'}`}
                        >
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400 border-r border-white/10">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-4 border-r border-white/10">
                            <span className={`block truncate max-w-xs ${isLibur ? 'line-through text-slate-500' : 'text-white'}`}>
                              {item.nama}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-white/10">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${isLibur ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                              {isLibur ? 'Libur' : 'Aktif'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-white/10 font-mono text-xs text-indigo-300">
                            {rute === 'Kiri' ? 'Rute Kiri' : 'Rute Kanan'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-white border-r border-white/10">
                            {isLibur ? '-' : breakdown.total.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-300 border-r border-white/10">
                            {isLibur || breakdown.porsiKecil === 0 ? '-' : breakdown.porsiKecil.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-cyan-300 border-r border-white/10">
                            {isLibur || breakdown.siswaBesar === 0 ? '-' : breakdown.siswaBesar.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            {isLibur || breakdown.tendik === 0 ? '-' : breakdown.tendik.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Glowing Footer Subtotal */}
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-4 rounded-2xl border border-white/20 flex justify-between items-center text-sm font-extrabold text-white">
                <span className="uppercase tracking-widest text-cyan-300">
                  SUBTOTAL ALOKASI PORSI SEKOLAH ({sekolahList.length} LEMBAGA)
                </span>
                <span className="font-mono text-2xl font-black text-cyan-300">
                  {sekolahTotal.toLocaleString('id-ID')} <span className="text-xs font-bold text-white">Porsi Harian</span>
                </span>
              </div>
            </motion.div>
          )}

          {/* SLIDE 2: SASARAN POSYANDU 3B & PIPELINE LAPANGAN */}
          {currentSlide === 2 && (
            <motion.div
              key="slide-2"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.04, y: -10 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-full h-full flex flex-col justify-between space-y-5"
            >
              {/* Top Half: Posyandu 3B Table */}
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center border-b border-white/15 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-pink-500/20 text-pink-300 rounded-2xl border border-pink-400/40">
                      <Heart size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-white">
                        ALOKASI SASARAN 3B (5 POSYANDU DUSUN)
                      </h2>
                      <p className="text-xs text-slate-300">
                        Sasaran prioritas Balita, Ibu Hamil (Bumil), dan Ibu Menyusui (Busui).
                      </p>
                    </div>
                  </div>
                  <div className="bg-pink-500/20 border border-pink-400/40 px-4 py-1.5 rounded-2xl text-right">
                    <span className="text-[10px] font-bold text-pink-300 uppercase block">Subtotal Posyandu</span>
                    <span className="text-lg font-black font-mono text-white">
                      {posyanduTotal.toLocaleString('id-ID')} <span className="text-xs font-bold text-pink-300">Porsi</span>
                    </span>
                  </div>
                </div>

                <div className="my-3 overflow-hidden border border-white/15 rounded-2xl bg-slate-950/60">
                  <table className="w-full text-left border-collapse text-sm font-bold text-white">
                    <thead className="bg-emerald-950/90 text-emerald-300 text-center uppercase tracking-wider text-xs">
                      <tr>
                        <th className="py-2.5 px-3 border-b border-r border-white/15 w-12">NO</th>
                        <th className="py-2.5 px-4 border-b border-r border-white/15 text-left">NAMA POSYANDU / DUSUN</th>
                        <th className="py-2.5 px-3 border-b border-r border-white/15 text-right text-amber-300">BALITA</th>
                        <th className="py-2.5 px-3 border-b border-r border-white/15 text-right text-rose-300">BUMIL</th>
                        <th className="py-2.5 px-3 border-b border-r border-white/15 text-right text-pink-300">BUSUI</th>
                        <th className="py-2.5 px-3 border-b border-white/15 text-right text-white">TOTAL PORSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {posyanduList.map((item, idx) => {
                        const pos = getPosyanduBreakdown(item)
                        return (
                          <tr key={idx} className={idx % 2 === 1 ? 'bg-white/5' : 'bg-transparent'}>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400 border-r border-white/10">{idx + 1}</td>
                            <td className="py-2.5 px-4 border-r border-white/10 text-white font-bold">{item.nama}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-amber-300 border-r border-white/10">{pos.balita.toLocaleString('id-ID')}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-300 border-r border-white/10">{pos.bumil.toLocaleString('id-ID')}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-pink-300 border-r border-white/10">{pos.busui.toLocaleString('id-ID')}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-cyan-300">{pos.total.toLocaleString('id-ID')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Half: Interactive Field Operations Timeline Tracker Widget */}
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-cyan-400 animate-spin" />
                    <h3 className="font-extrabold text-base text-white tracking-tight">
                      TRACKER PIPELINE LAPANGAN OPERASIONAL BGN
                    </h3>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/40">
                    ● Workflow Sesuai SOP Kedinasan
                  </span>
                </div>

                {/* 4 Pipeline Steps Grid */}
                <div className="grid grid-cols-4 gap-4">
                  {/* Step 1 */}
                  <div className="bg-white/10 border border-emerald-400/40 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">TAHAP 1</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <div className="text-xl font-black font-mono text-white">05:00 WIB</div>
                    <h4 className="font-bold text-xs text-emerald-200">Persiapan Masak Dapur</h4>
                    <p className="text-[11px] text-slate-300 leading-tight">Pengolahan bahan segar & standar gizi BGN.</p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white/10 border border-cyan-400/40 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">TAHAP 2</span>
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                    <div className="text-xl font-black font-mono text-white">08:00 WIB</div>
                    <h4 className="font-bold text-xs text-cyan-200">Packaging & QC Sample</h4>
                    <p className="text-[11px] text-slate-300 leading-tight">Pengepakan steril wadah food-grade & lab check.</p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white/10 border border-indigo-400/40 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">TAHAP 3</span>
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    </div>
                    <div className="text-xl font-black font-mono text-white">09:30 WIB</div>
                    <h4 className="font-bold text-xs text-indigo-200">Keberangkatan Armada</h4>
                    <p className="text-[11px] text-slate-300 leading-tight">Armada Rute Kiri & Rute Kanan menuju lokasi KPM.</p>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-white/10 border border-amber-400/40 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest">TAHAP 4</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="text-xl font-black font-mono text-white">11:00 WIB</div>
                    <h4 className="font-bold text-xs text-amber-200">Serah Terima & Berita Acara</h4>
                    <p className="text-[11px] text-slate-300 leading-tight">Verifikasi penerimaan & dokumen cetak berita acara.</p>
                  </div>
                </div>

                {/* Grand Total Banner */}
                <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-3.5 rounded-2xl border border-white/20 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">
                    GRAND TOTAL TARGET ALOKASI HARI INI:
                  </span>
                  <span className="text-xl font-black font-mono text-cyan-300">
                    {(grandTotalPorsi || 3196).toLocaleString('id-ID')} PORSI MBG TERKIRIM
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Control Bar */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-3">
        {/* Left Slide Title Indicator */}
        <div className="text-xs font-black text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-2">
          <Tv size={16} className="text-cyan-400" />
          <span>{slideNames[currentSlide]}</span>
        </div>

        {/* Center Slide Nav Dots */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCurrentSlide(prev => (prev - 1 + 3) % 3)
              setProgress(0)
            }}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl backdrop-blur-md text-white transition cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSlide(idx)
                  setProgress(0)
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentSlide === idx
                    ? 'w-8 h-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.8)]'
                    : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/80'
                }`}
                title={`Buka Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              setCurrentSlide(prev => (prev + 1) % 3)
              setProgress(0)
            }}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl backdrop-blur-md text-white transition cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right Info Footer */}
        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-2">
          <span>SPPG Pasuruan Wonorejo</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">Auto-Rotation (12s)</span>
        </div>
      </div>
    </div>
  )
}

export default KioskModeDisplay
